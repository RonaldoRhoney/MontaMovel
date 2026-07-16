-- ============================================================
-- MONTAMOVEL — Fabricante sinalizado na assistência
-- Complementa schema.sql + 002..008 (migração incremental)
--
-- Quando o montador abre uma assistência, ele aponta de qual
-- fabricante é o móvel (ex.: "DJ Móveis") — direto no local, mesmo
-- que o produto da OS não esteja ligado a um fabricante no catálogo
-- (produtos.fabricante_id). É esse apontamento, não o catálogo, que
-- alimenta o relatório de assistências por fabricante (semanal/
-- mensal/anual): a origem real do problema é o que o montador viu
-- na etiqueta do móvel, não o que está cadastrado.
-- ============================================================

alter table public.ordens_servico
  add column if not exists fabricante_assist_id uuid references public.fabricantes(id);

-- ─── Relatório: assistências por fabricante num período ────
create or replace function public.relatorio_assistencias_por_fabricante(p_data_ini date, p_data_fim date)
returns table (fabricante_id uuid, fabricante_nome text, total bigint)
security definer set search_path = public as $$
  select
    coalesce(f.id, p.fabricante_id) as fabricante_id,
    coalesce(f.nome, pf.nome, 'Não informado') as fabricante_nome,
    count(*) as total
  from public.ordens_servico os
  left join public.fabricantes f on f.id = os.fabricante_assist_id
  left join public.produtos p on p.id = os.produto_id
  left join public.fabricantes pf on pf.id = p.fabricante_id
  where os.tenant_id = public.get_tenant_id()
    and os.resultado = 'assistencia'
    and coalesce(os.data_realizada, os.data_agendada) between p_data_ini and p_data_fim
  group by 1, 2
  order by total desc;
$$ language sql stable;
