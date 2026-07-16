-- ============================================================
-- MONTAMOVEL — Storage + políticas para o PWA do Montador
-- Complementa schema.sql (não edita — migração incremental)
-- ============================================================

-- ─── BUCKET PRIVADO PARA FOTOS E ASSINATURAS ───────────────
-- Convenção de path: {tenant_id}/os/{os_id}/{arquivo}
--                     {tenant_id}/ponto/{montador_id}/{arquivo}
insert into storage.buckets (id, name, public)
values ('evidencias', 'evidencias', false)
on conflict (id) do nothing;

-- Montador só sobe arquivo dentro da pasta do próprio tenant,
-- e só em OS que pertence a ele
create policy montador_upload_evidencias on storage.objects
  for insert with check (
    bucket_id = 'evidencias'
    and (storage.foldername(name))[1] = public.get_tenant_id()::text
    and (
      public.get_user_role() != 'montador'
      or exists (
        select 1 from public.ordens_servico os
        join public.montadores m on m.id = os.montador_id
        where os.id::text = (storage.foldername(name))[3]
          and m.user_id = auth.uid()
      )
    )
  );

-- Leitura restrita ao próprio tenant (URLs assinadas, nunca públicas)
create policy tenant_read_evidencias on storage.objects
  for select using (
    bucket_id = 'evidencias'
    and (storage.foldername(name))[1] = public.get_tenant_id()::text
  );

-- ─── os_eventos: montador só registra evento na própria OS ──
-- (tenant_isolation já existe em schema.sql; isto restringe mais)
create policy montador_own_os_eventos on public.os_eventos
  as restrictive
  using (
    public.get_user_role() != 'montador'
    or exists (
      select 1 from public.ordens_servico os
      join public.montadores m on m.id = os.montador_id
      where os.id = os_eventos.os_id and m.user_id = auth.uid()
    )
  );
