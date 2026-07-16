-- ============================================================
-- MONTAMOVEL — RPC de apoio ao fluxo INBOUND do n8n
-- Complementa 004_n8n_integration.sql
--
-- Diferença de segurança em relação às RPCs portal_* (003): estas
-- aqui recebem telefone, não token — por isso NÃO são liberadas pra
-- anon/authenticated, só pra service_role. Quem chama é o n8n usando
-- a service role key (credencial de backend, nunca exposta ao
-- cliente final), depois de já ter validado a mensagem no WhatsApp.
-- ============================================================

-- Acha a OS "em aberto" mais recente daquele telefone, pra resolver
-- o token quando o cliente responde algo pelo WhatsApp (ex.: "SIM").
create or replace function public.n8n_resolve_os_por_telefone(p_tenant_id uuid, p_telefone text)
returns table (os_id uuid, token_cliente text, status text, numero text)
security definer set search_path = public as $$
  select os.id, os.token_cliente, os.status, os.numero
  from public.ordens_servico os
  join public.clientes c on c.id = os.cliente_id
  where os.tenant_id = p_tenant_id
    and (c.whatsapp = p_telefone or c.telefone = p_telefone)
    and os.status not in ('Concluída com Sucesso', 'Cancelada')
  order by os.data_agendada desc, os.hora_agendada desc
  limit 1;
$$ language sql stable;

revoke all on function public.n8n_resolve_os_por_telefone(uuid, text) from public;
grant execute on function public.n8n_resolve_os_por_telefone(uuid, text) to service_role;
