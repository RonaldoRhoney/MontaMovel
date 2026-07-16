-- ============================================================
-- MONTAMOVEL — RPCs do Portal do Cliente (self-service, sem login)
-- Complementa schema.sql + 002 (migração incremental)
--
-- Decisão de segurança: em vez de abrir RLS pra role anon em
-- ordens_servico (o que vazaria a tabela inteira pra qualquer
-- requisição não autenticada), o acesso do cliente final passa
-- só por estas funções SECURITY DEFINER. Cada uma recebe o
-- token_cliente (UUID aleatório, único por OS, expira em 48h —
-- ver schema.sql) e só age sobre a própria OS se o token bater
-- e não estiver expirado. Nenhuma outra tabela fica exposta.
-- ============================================================

-- ─── Consulta: status + timeline da OS ─────────────────────
create or replace function public.portal_get_os(p_token text)
returns table (
  numero text, status text, prioridade text,
  data_agendada date, hora_agendada time,
  logradouro text, numero_end text, complemento text, bairro text, cidade text,
  cliente_nome text, produto_nome text,
  resultado text, nps_score int,
  token_expira_at timestamptz
) security definer set search_path = public as $$
  select os.numero, os.status, os.prioridade,
         os.data_agendada, os.hora_agendada,
         os.logradouro, os.numero_end, os.complemento, os.bairro, os.cidade,
         c.nome, coalesce(p.nome, os.produto_descricao),
         os.resultado, os.nps_score,
         os.token_expira_at
  from public.ordens_servico os
  join public.clientes c on c.id = os.cliente_id
  left join public.produtos p on p.id = os.produto_id
  where os.token_cliente = p_token and os.token_expira_at > now();
$$ language sql stable;

-- ─── Timeline pública (sem GPS/fotos — só os marcos do serviço) ──
create or replace function public.portal_get_eventos(p_token text)
returns table (tipo text, created_at timestamptz) security definer set search_path = public as $$
  select e.tipo, e.created_at
  from public.os_eventos e
  join public.ordens_servico os on os.id = e.os_id
  where os.token_cliente = p_token and os.token_expira_at > now()
    and e.tipo in ('criacao','confirmacao','saida_rota','checkin','checkout','status_change')
  order by e.created_at;
$$ language sql stable;

-- ─── "Meus Dados" (LGPD Art. 18 — direito de acesso) ───────
create or replace function public.portal_get_meus_dados(p_token text)
returns table (nome text, telefone text, email text, endereco text) security definer set search_path = public as $$
  select c.nome, c.telefone, c.email,
         concat_ws(', ', concat_ws(' ', c.logradouro, c.numero), c.bairro, c.cidade, c.estado)
  from public.ordens_servico os
  join public.clientes c on c.id = os.cliente_id
  where os.token_cliente = p_token and os.token_expira_at > now();
$$ language sql stable;

-- ─── Ação: cliente confirma o agendamento ──────────────────
create or replace function public.portal_confirmar(p_token text)
returns void security definer set search_path = public as $$
declare v_os record;
begin
  select * into v_os from public.ordens_servico
    where token_cliente = p_token and token_expira_at > now()
    and status in ('Agendada','Pendente Confirmação') for update;
  if not found then raise exception 'Link inválido, expirado ou OS não está mais aguardando confirmação.'; end if;

  update public.ordens_servico set status = 'Confirmada' where id = v_os.id;
  insert into public.os_eventos (tenant_id, os_id, tipo, descricao)
    values (v_os.tenant_id, v_os.id, 'confirmacao', 'Confirmado pelo cliente via portal');
end;
$$ language plpgsql;

-- ─── Ação: cliente pede reagendamento ───────────────────────
create or replace function public.portal_reagendar(p_token text, p_nova_data date, p_nova_hora time)
returns void security definer set search_path = public as $$
declare v_os record;
begin
  if p_nova_data < current_date then raise exception 'Data inválida.'; end if;

  select * into v_os from public.ordens_servico
    where token_cliente = p_token and token_expira_at > now()
    and status not in ('Concluída com Sucesso','Cancelada','Em Assistência') for update;
  if not found then raise exception 'Link inválido, expirado ou OS não pode mais ser reagendada.'; end if;

  update public.ordens_servico
    set status = 'Reagendada', data_agendada = p_nova_data, hora_agendada = p_nova_hora
    where id = v_os.id;
  insert into public.os_eventos (tenant_id, os_id, tipo, descricao)
    values (v_os.tenant_id, v_os.id, 'status_change', format('Reagendado pelo cliente para %s %s', p_nova_data, p_nova_hora));
end;
$$ language plpgsql;

-- ─── Ação: cliente cancela ───────────────────────────────────
create or replace function public.portal_cancelar(p_token text, p_motivo text)
returns void security definer set search_path = public as $$
declare v_os record;
begin
  select * into v_os from public.ordens_servico
    where token_cliente = p_token and token_expira_at > now()
    and status not in ('Concluída com Sucesso','Cancelada','Em Assistência') for update;
  if not found then raise exception 'Link inválido, expirado ou OS não pode mais ser cancelada.'; end if;

  update public.ordens_servico
    set status = 'Cancelada', motivo_cancel = 'Solicitação do Cliente', observacoes = coalesce(p_motivo, observacoes)
    where id = v_os.id;
  insert into public.os_eventos (tenant_id, os_id, tipo, descricao)
    values (v_os.tenant_id, v_os.id, 'status_change', concat('Cancelado pelo cliente via portal: ', coalesce(p_motivo, 'sem motivo informado')));
end;
$$ language plpgsql;

-- ─── Ação: NPS pós-montagem ──────────────────────────────────
create or replace function public.portal_responder_nps(p_token text, p_score int, p_comentario text)
returns void security definer set search_path = public as $$
declare v_os record;
begin
  if p_score < 0 or p_score > 10 then raise exception 'Nota inválida.'; end if;

  select * into v_os from public.ordens_servico
    where token_cliente = p_token and token_expira_at > now()
    and status = 'Concluída com Sucesso' and nps_score is null for update;
  if not found then raise exception 'Link inválido, expirado ou avaliação já registrada.'; end if;

  update public.ordens_servico
    set nps_score = p_score, nps_comentario = p_comentario, nps_respondido_at = now()
    where id = v_os.id;
  insert into public.nps_respostas (tenant_id, os_id, cliente_id, montador_id, score, comentario, canal)
    values (v_os.tenant_id, v_os.id, v_os.cliente_id, v_os.montador_id, p_score, p_comentario, 'portal');
end;
$$ language plpgsql;

-- ─── Permissões: só estas funções ficam acessíveis a anon ───
revoke all on function public.portal_get_os(text) from public;
revoke all on function public.portal_get_eventos(text) from public;
revoke all on function public.portal_get_meus_dados(text) from public;
revoke all on function public.portal_confirmar(text) from public;
revoke all on function public.portal_reagendar(text, date, time) from public;
revoke all on function public.portal_cancelar(text, text) from public;
revoke all on function public.portal_responder_nps(text, int, text) from public;

grant execute on function public.portal_get_os(text) to anon, authenticated;
grant execute on function public.portal_get_eventos(text) to anon, authenticated;
grant execute on function public.portal_get_meus_dados(text) to anon, authenticated;
grant execute on function public.portal_confirmar(text) to anon, authenticated;
grant execute on function public.portal_reagendar(text, date, time) to anon, authenticated;
grant execute on function public.portal_cancelar(text, text) to anon, authenticated;
grant execute on function public.portal_responder_nps(text, int, text) to anon, authenticated;
