-- ============================================================
-- MONTAMOVEL — Pedidos (vendas importadas do ERP/e-commerce da loja)
-- Complementa schema.sql + 002..006 (migração incremental)
--
-- Por que isso existe: a montagem nasce de uma venda que já aconteceu em
-- outro sistema (ERP/e-commerce da loja parceira). O atendente do MontaMovel
-- não deveria redigitar cliente/produto do zero pra abrir uma OS — ele busca
-- o pedido já existente (por número ou CPF do cliente) e os dados vêm
-- amarrados. Nesta fase (sem integração automática via API — isso é Fase 3
-- no roadmap), a importação é por CSV.
-- ============================================================

create table public.pedidos (
  id               uuid primary key default uuid_generate_v4(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  numero_pedido    text not null,
  cliente_id       uuid not null references public.clientes(id),
  produto_id       uuid references public.produtos(id),
  produto_descricao text, -- fallback se o produto não estiver no catálogo
  data_compra      date,
  valor            numeric(10,2),
  canal_origem     text, -- nome do sistema de origem (ex.: 'ERP Loja X', 'Shopify')
  utilizado        boolean not null default false, -- já virou OS?
  importado_em     timestamptz default now(),
  created_at       timestamptz default now(),
  unique (tenant_id, numero_pedido)
);

create index idx_pedidos_numero  on public.pedidos (tenant_id, numero_pedido);
create index idx_pedidos_cliente on public.pedidos (cliente_id) where not utilizado;

alter table public.ordens_servico
  add column if not exists pedido_id uuid references public.pedidos(id);

alter table public.pedidos enable row level security;
create policy tenant_isolation on public.pedidos
  using (tenant_id = public.get_tenant_id());
