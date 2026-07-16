-- ============================================================
-- MONTAMOVEL — Integração n8n / WhatsApp (Módulo 8)
-- Complementa schema.sql + 002 + 003 (migração incremental)
--
-- Arquitetura: o Postgres notifica o n8n via webhook assinado
-- (HMAC-SHA256, conforme docs/MontaMovel_Planejamento_v3.docx §13.4)
-- sempre que uma OS muda para um status relevante. O n8n decide
-- QUAL mensagem mandar e por qual canal — o banco só avisa "aconteceu
-- X na OS Y", nunca monta a mensagem em si (isso fica no n8n/templates).
--
-- Requer as extensões pg_net e pg_cron habilitadas no projeto
-- Supabase (Dashboard → Database → Extensions).
-- ============================================================

create extension if not exists pg_net;
create extension if not exists pg_cron;

-- ─── Config de integração por tenant ────────────────────────
alter table public.tenants
  add column if not exists n8n_webhook_url text,
  add column if not exists webhook_secret  text default encode(gen_random_bytes(32), 'hex');

-- Dedup do lembrete de 24h (job roda de hora em hora)
alter table public.ordens_servico
  add column if not exists lembrete_enviado boolean default false;

-- ─── Função central: assina e dispara o webhook ─────────────
create or replace function public.notify_n8n(p_tenant_id uuid, p_evento text, p_payload jsonb)
returns void language plpgsql as $$
declare
  v_tenant   record;
  v_body     text;
  v_sig      text;
begin
  select n8n_webhook_url, webhook_secret into v_tenant from public.tenants where id = p_tenant_id;
  if v_tenant.n8n_webhook_url is null then return; end if; -- tenant sem n8n configurado ainda

  v_body := jsonb_build_object('evento', p_evento, 'tenant_id', p_tenant_id, 'dados', p_payload)::text;
  v_sig  := encode(hmac(v_body, v_tenant.webhook_secret, 'sha256'), 'hex');

  perform net.http_post(
    url     := v_tenant.n8n_webhook_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'X-MontaMovel-Signature', v_sig),
    body    := v_body::jsonb
  );
end;
$$;

-- ─── Payload padrão de uma OS pro n8n montar a mensagem ─────
create or replace function public.build_os_payload(p_os_id uuid)
returns jsonb language sql stable as $$
  select jsonb_build_object(
    'os_id', os.id, 'numero', os.numero, 'status', os.status,
    'data_agendada', os.data_agendada, 'hora_agendada', os.hora_agendada,
    'bairro', os.bairro, 'cidade', os.cidade,
    'cliente_nome', c.nome, 'cliente_telefone', c.telefone, 'cliente_whatsapp', coalesce(c.whatsapp, c.telefone),
    'montador_nome', m.nome,
    'produto_nome', coalesce(p.nome, os.produto_descricao),
    'link_portal', concat('https://portal.montamovel.com.br/?t=', os.token_cliente),
    'motivo_assist', os.motivo_assist
  )
  from public.ordens_servico os
  join public.clientes c on c.id = os.cliente_id
  left join public.montadores m on m.id = os.montador_id
  left join public.produtos p on p.id = os.produto_id
  where os.id = p_os_id;
$$;

-- ─── Trigger: status da OS mudou → notifica evento correspondente ──
create or replace function public.trg_os_notify_n8n()
returns trigger language plpgsql as $$
declare
  v_evento text;
  v_log_id uuid;
begin
  v_evento := case
    when tg_op = 'INSERT' and new.status in ('Agendada', 'Pendente Confirmação') then 'confirmacao'
    when tg_op = 'UPDATE' and new.status is distinct from old.status then
      case new.status
        when 'Em Rota'                 then 'em_rota'
        when 'Concluída com Sucesso'   then 'nps'
        when 'Em Assistência'          then 'assistencia'
        when 'Reagendada'              then 'reagendamento'
        else null
      end
    else null
  end;

  if v_evento is not null then
    insert into public.comunicacoes_log (tenant_id, os_id, cliente_id, canal, tipo, status, mensagem)
      values (new.tenant_id, new.id, new.cliente_id, 'whatsapp', v_evento, 'enviado', 'Disparado para n8n — aguardando confirmação de entrega')
      returning id into v_log_id;
    -- comunicacao_id vai junto pro n8n conseguir ecoar o status de entrega
    -- de volta pra linha certa (ver supabase/functions/n8n-inbound)
    perform public.notify_n8n(new.tenant_id, v_evento, public.build_os_payload(new.id) || jsonb_build_object('comunicacao_id', v_log_id));
  end if;

  return new;
end;
$$;

drop trigger if exists os_notify_n8n on public.ordens_servico;
create trigger os_notify_n8n
  after insert or update of status on public.ordens_servico
  for each row execute function public.trg_os_notify_n8n();

-- ─── Job agendado: lembrete 24h antes da montagem ───────────
create or replace function public.job_lembrete_24h()
returns void language plpgsql as $$
declare v_os record; v_log_id uuid;
begin
  for v_os in
    select id, tenant_id, cliente_id from public.ordens_servico
    where status = 'Confirmada'
      and data_agendada = current_date + 1
      and lembrete_enviado = false
  loop
    insert into public.comunicacoes_log (tenant_id, os_id, cliente_id, canal, tipo, status, mensagem)
      values (v_os.tenant_id, v_os.id, v_os.cliente_id, 'whatsapp', 'lembrete', 'enviado', 'Lembrete 24h disparado para n8n')
      returning id into v_log_id;
    perform public.notify_n8n(v_os.tenant_id, 'lembrete', public.build_os_payload(v_os.id) || jsonb_build_object('comunicacao_id', v_log_id));
    update public.ordens_servico set lembrete_enviado = true where id = v_os.id;
  end loop;
end;
$$;

select cron.schedule('montamovel_lembrete_24h', '0 * * * *', 'select public.job_lembrete_24h();')
where not exists (select 1 from cron.job where jobname = 'montamovel_lembrete_24h');
