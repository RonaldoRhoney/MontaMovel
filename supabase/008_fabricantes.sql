-- ============================================================
-- MONTAMOVEL — Fabricantes (fornecedores dos produtos)
-- Complementa schema.sql + 002..007 (migração incremental)
--
-- O plano já previa isso em §7.5 ("Por fornecedor — análise de
-- assistências por origem do produto") mas a tabela nunca existiu.
-- ============================================================

create table public.fabricantes (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  nome        text not null,
  cnpj        text,
  site        text,
  telefone    text,
  email       text,
  cidade      text,
  estado      text,
  categorias  text[], -- livre, ex.: ['guarda-roupa','cozinha','colchões']
  observacoes text,
  ativo       boolean not null default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.produtos
  add column if not exists fabricante_id uuid references public.fabricantes(id);

alter table public.fabricantes enable row level security;
create policy tenant_isolation on public.fabricantes
  using (tenant_id = public.get_tenant_id());

create trigger set_updated_at_fabricantes
  before update on public.fabricantes
  for each row execute function public.set_updated_at();

-- ─── Seed opcional: fabricantes conhecidos do mercado brasileiro ──
-- Chamada pelo próprio gestor (botão "Popular com fabricantes
-- conhecidos" em Fabricantes.jsx) — nunca roda sozinha, e é
-- idempotente (não duplica se o nome já existe no tenant). Dados de
-- contato ficam em branco de propósito: é uma lista de partida pra
-- cadastro rápido, não uma base verificada de CNPJ/telefone.
create or replace function public.seed_fabricantes_padrao()
returns integer
security definer set search_path = public as $$
declare
  v_tenant_id uuid := public.get_tenant_id();
  v_inseridos integer;
  v_lista jsonb := '[
    {"nome":"Madesa","cidade":"Bento Gonçalves","estado":"RS","categorias":["quarto","guarda-roupa"]},
    {"nome":"Bertolini","cidade":"Bento Gonçalves","estado":"RS","categorias":["quarto","cozinha"]},
    {"nome":"Rudnick","cidade":"Videira","estado":"SC","categorias":["quarto","guarda-roupa"]},
    {"nome":"Henn","cidade":"Arroio do Meio","estado":"RS","categorias":["cozinha","quarto"]},
    {"nome":"Dellano Móveis","cidade":"Bento Gonçalves","estado":"RS","categorias":["quarto","sala"]},
    {"nome":"Kappesberg","cidade":"Videira","estado":"SC","categorias":["cozinha","quarto"]},
    {"nome":"Casatema","cidade":"Bento Gonçalves","estado":"RS","categorias":["quarto","guarda-roupa"]},
    {"nome":"Politorno","cidade":"Bento Gonçalves","estado":"RS","categorias":["quarto","sala"]},
    {"nome":"Bosi Móveis","cidade":"Ubá","estado":"MG","categorias":["quarto","guarda-roupa"]},
    {"nome":"Móveis Carraro","cidade":"Bento Gonçalves","estado":"RS","categorias":["sala","escritorio"]},
    {"nome":"Demobile","cidade":"Ubá","estado":"MG","categorias":["quarto","cozinha"]},
    {"nome":"Art in Móveis","cidade":"Ubá","estado":"MG","categorias":["quarto","guarda-roupa"]},
    {"nome":"Pallazio","cidade":"Ubá","estado":"MG","categorias":["sala","quarto"]},
    {"nome":"Multimóveis","cidade":"Ubá","estado":"MG","categorias":["cozinha","quarto"]},
    {"nome":"Imcal Móveis","cidade":"Ubá","estado":"MG","categorias":["quarto","guarda-roupa"]},
    {"nome":"Moval","cidade":"Ubá","estado":"MG","categorias":["sala","quarto"]},
    {"nome":"Todeschini","cidade":"Bento Gonçalves","estado":"RS","categorias":["planejados","cozinha"]},
    {"nome":"Herval","cidade":"Rio Negrinho","estado":"SC","categorias":["colchões","estofados"]},
    {"nome":"Probel","cidade":"Várzea Paulista","estado":"SP","categorias":["colchões"]},
    {"nome":"Ortobom","cidade":"Duque de Caxias","estado":"RJ","categorias":["colchões"]}
  ]'::jsonb;
  v_item jsonb;
begin
  if v_tenant_id is null then raise exception 'Sem tenant associado ao usuário.'; end if;

  v_inseridos := 0;
  for v_item in select * from jsonb_array_elements(v_lista) loop
    if not exists (select 1 from public.fabricantes where tenant_id = v_tenant_id and nome = v_item->>'nome') then
      insert into public.fabricantes (tenant_id, nome, cidade, estado, categorias)
        values (
          v_tenant_id, v_item->>'nome', v_item->>'cidade', v_item->>'estado',
          (select array_agg(x) from jsonb_array_elements_text(v_item->'categorias') x)
        );
      v_inseridos := v_inseridos + 1;
    end if;
  end loop;

  return v_inseridos;
end;
$$ language plpgsql;

revoke all on function public.seed_fabricantes_padrao() from public;
grant execute on function public.seed_fabricantes_padrao() to authenticated;
