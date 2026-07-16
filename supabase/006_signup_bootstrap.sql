-- ============================================================
-- MONTAMOVEL — Cadastro self-service de nova empresa (trial)
-- Complementa schema.sql + 002..005 (migração incremental)
--
-- Problema que resolve: um usuário recém-criado via supabase.auth.signUp()
-- ainda não tem linha em public.users nem tenant_id — então toda política
-- de RLS baseada em get_tenant_id() bloqueia qualquer INSERT feito por ele.
-- Esta função roda com privilégio elevado só pra esse bootstrap inicial e
-- garante, dentro de uma única transação, que o usuário autenticado nunca
-- fica "órfão" (sem tenant) nem consegue rodar isso duas vezes.
-- ============================================================

create or replace function public.bootstrap_tenant(
  p_razao_social text, p_email text, p_telefone text,
  p_cidade text, p_estado text, p_nome_admin text
) returns uuid
security definer set search_path = public as $$
declare
  v_tenant_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado.';
  end if;

  if exists (select 1 from public.users where id = auth.uid()) then
    raise exception 'Este usuário já pertence a uma empresa.';
  end if;

  insert into public.tenants (razao_social, email, telefone, cidade, estado, plano, trial_fim)
    values (p_razao_social, p_email, p_telefone, p_cidade, p_estado, 'trial', now() + interval '60 days')
    returning id into v_tenant_id;

  insert into public.users (id, tenant_id, nome, email, telefone, role)
    values (auth.uid(), v_tenant_id, p_nome_admin, p_email, p_telefone, 'admin');

  return v_tenant_id;
end;
$$;

revoke all on function public.bootstrap_tenant(text, text, text, text, text, text) from public;
grant execute on function public.bootstrap_tenant(text, text, text, text, text, text) to authenticated;
