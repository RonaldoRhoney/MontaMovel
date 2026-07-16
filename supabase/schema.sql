-- ============================================================
-- MONTAMOVEL — SCHEMA SUPABASE (PostgreSQL)
-- Versão: 1.0 | RhoneyInc 2026
-- Cobertura: LGPD, Portaria MTE 671/2021, Multi-tenant RLS
-- ============================================================

-- ─── EXTENSÕES ────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- busca textual fuzzy

-- ─── 1. TENANTS (empresas-clientes do SaaS) ───────────────
CREATE TABLE public.tenants (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  razao_social    TEXT NOT NULL,
  cnpj            TEXT UNIQUE,
  email           TEXT NOT NULL,
  telefone        TEXT,
  plano           TEXT NOT NULL DEFAULT 'trial' CHECK (plano IN ('trial','starter','pro','enterprise')),
  trial_fim       TIMESTAMPTZ,
  ativo           BOOLEAN NOT NULL DEFAULT true,
  logo_url        TEXT,
  cidade          TEXT,
  estado          TEXT DEFAULT 'PA',
  dpo_email       TEXT,
  ripd_atualizado DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. USUÁRIOS DO SISTEMA ────────────────────────────────
-- Estende auth.users do Supabase
CREATE TABLE public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  email       TEXT NOT NULL,
  telefone    TEXT,
  role        TEXT NOT NULL CHECK (role IN ('admin','gestor','atendente','montador')),
  ativo       BOOLEAN NOT NULL DEFAULT true,
  mfa_ativo   BOOLEAN DEFAULT false,
  ultimo_acesso TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. CLIENTES FINAIS ────────────────────────────────────
CREATE TABLE public.clientes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome          TEXT NOT NULL,
  -- CPF/email armazenados criptografados (LGPD Art. 46)
  cpf_enc       TEXT,  -- pgcrypto AES-256
  email         TEXT,
  telefone      TEXT NOT NULL,
  whatsapp      TEXT,
  logradouro    TEXT,
  numero        TEXT,
  complemento   TEXT,
  bairro        TEXT,
  cidade        TEXT,
  estado        TEXT,
  cep           TEXT,
  latitude      NUMERIC(10,7),
  longitude     NUMERIC(10,7),
  observacoes   TEXT,
  consentimento_lgpd BOOLEAN DEFAULT false,
  consentimento_at   TIMESTAMPTZ,
  canal_origem  TEXT CHECK (canal_origem IN ('atendente','self_service','whatsapp','importacao')),
  ativo         BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 4. MONTADORES ────────────────────────────────────────
CREATE TABLE public.montadores (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES public.users(id),
  nome            TEXT NOT NULL,
  matricula       TEXT,
  telefone        TEXT NOT NULL,
  cpf_enc         TEXT,  -- criptografado
  data_nascimento DATE,
  tipo_contrato   TEXT NOT NULL CHECK (tipo_contrato IN ('CLT','PJ','Autonomo')),
  data_admissao   DATE,
  data_demissao   DATE,
  bairro          TEXT,
  cidade          TEXT,
  estado          TEXT,
  cep             TEXT,
  especialidades  TEXT[], -- ['guarda-roupa','cozinha','escritorio']
  status          TEXT NOT NULL DEFAULT 'Disponível'
                  CHECK (status IN ('Disponível','Em Campo','Em Rota','Atrasado','Inativo','Férias')),
  nps_medio       NUMERIC(3,1) DEFAULT 0,
  total_os        INTEGER DEFAULT 0,
  foto_url        TEXT,
  ativo           BOOLEAN DEFAULT true,
  aceite_rastreio BOOLEAN DEFAULT false, -- LGPD: aceite de rastreio GPS
  aceite_rastreio_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 5. PRODUTOS / TIPOS DE MONTAGEM ──────────────────────
CREATE TABLE public.produtos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  sku             TEXT,
  categoria       TEXT NOT NULL CHECK (categoria IN ('guarda-roupa','cozinha','escritorio','sala','quarto','banheiro','varanda','externo','outro')),
  complexidade    TEXT NOT NULL DEFAULT 'simples' CHECK (complexidade IN ('simples','media','complexa','especial')),
  tempo_estimado  INTEGER, -- minutos
  descricao       TEXT,
  foto_url        TEXT,
  ativo           BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 6. ESTOQUE DE PEÇAS ──────────────────────────────────
CREATE TABLE public.estoque (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  sku             TEXT,
  categoria       TEXT NOT NULL CHECK (categoria IN ('Fixação','Ferragem','Suporte','Ferramenta','Consumível','Outro')),
  qtd_atual       INTEGER NOT NULL DEFAULT 0,
  qtd_minima      INTEGER NOT NULL DEFAULT 0,
  unidade         TEXT DEFAULT 'unid',
  fornecedor      TEXT,
  preco_unitario  NUMERIC(10,2),
  localizacao     TEXT, -- prateleira/gaveta
  ativo           BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT qtd_nao_negativa CHECK (qtd_atual >= 0)
);

-- View calculada de status do estoque
CREATE VIEW public.estoque_status AS
SELECT *,
  CASE
    WHEN qtd_atual = 0          THEN 'Zerado'
    WHEN qtd_atual < qtd_minima THEN 'Crítico'
    WHEN qtd_atual < qtd_minima * 1.5 THEN 'Alerta'
    ELSE 'OK'
  END AS status,
  ROUND((qtd_atual::NUMERIC / NULLIF(qtd_minima,0)) * 30) AS cobertura_dias
FROM public.estoque
WHERE ativo = true;

-- ─── 7. MOVIMENTAÇÕES DE ESTOQUE ──────────────────────────
CREATE TABLE public.estoque_movimentos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  estoque_id  UUID NOT NULL REFERENCES public.estoque(id),
  os_id       UUID, -- FK criada após tabela OS
  user_id     UUID REFERENCES public.users(id),
  tipo        TEXT NOT NULL CHECK (tipo IN ('entrada','saida','ajuste','perda')),
  quantidade  INTEGER NOT NULL,
  motivo      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 8. ORDENS DE SERVIÇO ─────────────────────────────────
CREATE TABLE public.ordens_servico (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  numero          TEXT NOT NULL, -- OS-XXXX gerado pelo sistema
  cliente_id      UUID NOT NULL REFERENCES public.clientes(id),
  produto_id      UUID REFERENCES public.produtos(id),
  produto_descricao TEXT, -- fallback se produto não estiver no catálogo
  montador_id     UUID REFERENCES public.montadores(id),
  criado_por      UUID REFERENCES public.users(id),
  status          TEXT NOT NULL DEFAULT 'Agendada'
                  CHECK (status IN ('Agendada','Pendente Confirmação','Confirmada','Em Rota','Em Montagem','Concluída com Sucesso','Em Assistência','Reagendada','Cancelada','Atrasada')),
  prioridade      TEXT NOT NULL DEFAULT 'Normal' CHECK (prioridade IN ('Normal','Urgente')),
  -- Endereço da montagem (pode diferir do cadastro do cliente)
  logradouro      TEXT,
  numero_end      TEXT,
  complemento     TEXT,
  bairro          TEXT,
  cidade          TEXT,
  estado          TEXT,
  cep             TEXT,
  latitude        NUMERIC(10,7),
  longitude       NUMERIC(10,7),
  -- Agendamento
  data_agendada   DATE NOT NULL,
  hora_agendada   TIME NOT NULL,
  data_realizada  DATE,
  hora_realizada  TIME,
  -- Resultado
  resultado       TEXT CHECK (resultado IN ('sucesso','assistencia','cancelada')),
  motivo_assist   TEXT CHECK (motivo_assist IN ('Peça Faltante','Avaria','Produto Incorreto','Cliente Ausente','Acesso Negado','Outro')),
  motivo_cancel   TEXT CHECK (motivo_cancel IN ('Solicitação do Cliente','Operação Interna','Reagendamento','Outro')),
  observacoes     TEXT,
  -- Assinatura digital (Lei 14.063/2020)
  assinatura_url  TEXT,
  assinatura_hash TEXT, -- SHA-256 do PDF
  assinatura_ip   TEXT,
  assinatura_lat  NUMERIC(10,7),
  assinatura_lng  NUMERIC(10,7),
  assinatura_at   TIMESTAMPTZ,
  -- NPS
  nps_score       INTEGER CHECK (nps_score BETWEEN 0 AND 10),
  nps_comentario  TEXT,
  nps_respondido_at TIMESTAMPTZ,
  -- Link do cliente (token único com expiração)
  token_cliente   TEXT UNIQUE DEFAULT encode(gen_random_bytes(32),'hex'),
  token_expira_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '48 hours',
  -- Controle
  os_origem_id    UUID REFERENCES public.ordens_servico(id), -- para assistências
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar FK de movimentos para OS agora que a tabela existe
ALTER TABLE public.estoque_movimentos
  ADD CONSTRAINT fk_os FOREIGN KEY (os_id) REFERENCES public.ordens_servico(id);

-- Sequence para número da OS
CREATE SEQUENCE IF NOT EXISTS os_numero_seq START 2001;
CREATE OR REPLACE FUNCTION public.gerar_numero_os()
RETURNS TRIGGER AS $$
BEGIN
  NEW.numero := 'OS-' || LPAD(nextval('os_numero_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_numero_os
  BEFORE INSERT ON public.ordens_servico
  FOR EACH ROW WHEN (NEW.numero IS NULL OR NEW.numero = '')
  EXECUTE FUNCTION public.gerar_numero_os();

-- ─── 9. EVENTOS DA OS (Timeline) ──────────────────────────
CREATE TABLE public.os_eventos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  os_id       UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES public.users(id),
  tipo        TEXT NOT NULL CHECK (tipo IN ('criacao','confirmacao','saida_rota','checkin','checkout','foto','assinatura','status_change','comentario','notificacao')),
  descricao   TEXT,
  latitude    NUMERIC(10,7),
  longitude   NUMERIC(10,7),
  foto_url    TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 10. REGISTRO DE PONTO (REP-P — Portaria 671/2021) ────
CREATE TABLE public.ponto_registros (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  montador_id     UUID NOT NULL REFERENCES public.montadores(id),
  data            DATE NOT NULL,
  tipo            TEXT NOT NULL CHECK (tipo IN ('entrada','saida_intervalo','retorno_intervalo','saida')),
  hora_registro   TIMESTAMPTZ NOT NULL,
  latitude        NUMERIC(10,7),
  longitude       NUMERIC(10,7),
  dispositivo_id  TEXT,
  ip_origem       TEXT,
  foto_url        TEXT, -- prova de presença opcional
  hash_afd        TEXT, -- hash do registro para AFD
  origem          TEXT DEFAULT 'app' CHECK (origem IN ('app','manual','importacao')),
  justificativa   TEXT, -- obrigatória para registros manuais
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(montador_id, data, tipo) -- sem duplicatas por tipo/dia
);

-- ─── 11. ROTAS ────────────────────────────────────────────
CREATE TABLE public.rotas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  montador_id     UUID NOT NULL REFERENCES public.montadores(id),
  data            DATE NOT NULL,
  sequencia       UUID[], -- array de os_ids na ordem otimizada
  distancia_km    NUMERIC(6,2),
  otimizada       BOOLEAN DEFAULT false,
  status          TEXT DEFAULT 'planejada' CHECK (status IN ('planejada','em_andamento','concluida')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(montador_id, data)
);

-- ─── 12. LOG DE COMUNICAÇÕES ──────────────────────────────
CREATE TABLE public.comunicacoes_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  os_id       UUID REFERENCES public.ordens_servico(id),
  cliente_id  UUID REFERENCES public.clientes(id),
  canal       TEXT NOT NULL CHECK (canal IN ('whatsapp','email','sms')),
  tipo        TEXT NOT NULL CHECK (tipo IN ('confirmacao','lembrete','em_rota','comprovante','assistencia','nps','reagendamento','alerta_gestor','marketing')),
  status      TEXT NOT NULL DEFAULT 'enviado' CHECK (status IN ('enviado','entregue','lido','falhou','cancelado')),
  mensagem    TEXT,
  provider_id TEXT, -- ID da mensagem no provedor (Z-API, Evolution, etc.)
  erro        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 13. NPS / AVALIAÇÕES ─────────────────────────────────
CREATE TABLE public.nps_respostas (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  os_id       UUID NOT NULL REFERENCES public.ordens_servico(id),
  cliente_id  UUID NOT NULL REFERENCES public.clientes(id),
  montador_id UUID REFERENCES public.montadores(id),
  score       INTEGER NOT NULL CHECK (score BETWEEN 0 AND 10),
  comentario  TEXT,
  canal       TEXT CHECK (canal IN ('whatsapp','email','portal')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 14. LOG DE AUDITORIA (LGPD + Segurança) ──────────────
-- Tabela IMUTÁVEL — sem UPDATE/DELETE permitidos via RLS
CREATE TABLE public.audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID REFERENCES public.tenants(id),
  user_id     UUID REFERENCES auth.users(id),
  acao        TEXT NOT NULL, -- 'INSERT','UPDATE','DELETE','LOGIN','EXPORT','VIEW_SENSITIVE'
  tabela      TEXT,
  registro_id TEXT,
  dados_antes JSONB,
  dados_depois JSONB,
  ip          TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 15. NOTIFICAÇÕES INTERNAS ────────────────────────────
CREATE TABLE public.notificacoes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES public.users(id), -- null = todos do tenant
  tipo        TEXT NOT NULL CHECK (tipo IN ('alerta','sucesso','info','critico')),
  titulo      TEXT NOT NULL,
  mensagem    TEXT NOT NULL,
  lida        BOOLEAN DEFAULT false,
  os_id       UUID REFERENCES public.ordens_servico(id),
  link        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES DE PERFORMANCE
-- ============================================================
CREATE INDEX idx_os_tenant_status    ON public.ordens_servico(tenant_id, status);
CREATE INDEX idx_os_tenant_data      ON public.ordens_servico(tenant_id, data_agendada);
CREATE INDEX idx_os_montador         ON public.ordens_servico(montador_id);
CREATE INDEX idx_os_cliente          ON public.ordens_servico(cliente_id);
CREATE INDEX idx_os_token            ON public.ordens_servico(token_cliente);
CREATE INDEX idx_clientes_tenant     ON public.clientes(tenant_id);
CREATE INDEX idx_clientes_nome       ON public.clientes USING gin(nome gin_trgm_ops);
CREATE INDEX idx_clientes_telefone   ON public.clientes(telefone);
CREATE INDEX idx_montadores_tenant   ON public.montadores(tenant_id);
CREATE INDEX idx_ponto_montador_data ON public.ponto_registros(montador_id, data);
CREATE INDEX idx_estoque_tenant      ON public.estoque(tenant_id);
CREATE INDEX idx_eventos_os          ON public.os_eventos(os_id);
CREATE INDEX idx_audit_tenant_data   ON public.audit_log(tenant_id, created_at);
CREATE INDEX idx_notif_user          ON public.notificacoes(user_id, lida);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — ISOLAMENTO MULTI-TENANT
-- ============================================================
-- Habilitar RLS em TODAS as tabelas sensíveis
ALTER TABLE public.tenants             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.montadores          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_movimentos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_servico      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_eventos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ponto_registros     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rotas               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comunicacoes_log    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nps_respostas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes        ENABLE ROW LEVEL SECURITY;

-- Função auxiliar: retorna tenant_id do usuário autenticado
CREATE OR REPLACE FUNCTION public.get_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Função auxiliar: retorna role do usuário autenticado
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── Políticas: usuário só vê dados do próprio tenant ──────
CREATE POLICY tenant_isolation ON public.clientes
  USING (tenant_id = public.get_tenant_id());

CREATE POLICY tenant_isolation ON public.montadores
  USING (tenant_id = public.get_tenant_id());

CREATE POLICY tenant_isolation ON public.produtos
  USING (tenant_id = public.get_tenant_id());

CREATE POLICY tenant_isolation ON public.estoque
  USING (tenant_id = public.get_tenant_id());

CREATE POLICY tenant_isolation ON public.estoque_movimentos
  USING (tenant_id = public.get_tenant_id());

CREATE POLICY tenant_isolation ON public.ordens_servico
  USING (tenant_id = public.get_tenant_id());

CREATE POLICY tenant_isolation ON public.os_eventos
  USING (tenant_id = public.get_tenant_id());

CREATE POLICY tenant_isolation ON public.ponto_registros
  USING (tenant_id = public.get_tenant_id());

CREATE POLICY tenant_isolation ON public.rotas
  USING (tenant_id = public.get_tenant_id());

CREATE POLICY tenant_isolation ON public.comunicacoes_log
  USING (tenant_id = public.get_tenant_id());

CREATE POLICY tenant_isolation ON public.nps_respostas
  USING (tenant_id = public.get_tenant_id());

CREATE POLICY tenant_isolation ON public.notificacoes
  USING (tenant_id = public.get_tenant_id() OR user_id = auth.uid());

-- Audit log: apenas leitura, sem DELETE/UPDATE para ninguém
CREATE POLICY audit_read_only ON public.audit_log
  FOR SELECT USING (tenant_id = public.get_tenant_id() AND public.get_user_role() IN ('admin','gestor'));

-- Montador só vê suas próprias OS
CREATE POLICY montador_own_os ON public.ordens_servico
  AS RESTRICTIVE
  USING (
    public.get_user_role() != 'montador'
    OR montador_id = (SELECT id FROM public.montadores WHERE user_id = auth.uid() LIMIT 1)
  );

-- Montador só vê seu próprio ponto
CREATE POLICY montador_own_ponto ON public.ponto_registros
  AS RESTRICTIVE
  USING (
    public.get_user_role() != 'montador'
    OR montador_id = (SELECT id FROM public.montadores WHERE user_id = auth.uid() LIMIT 1)
  );

-- ── Permissões de escrita por role ────────────────────────
-- Atendente NÃO pode deletar OS
CREATE POLICY atendente_no_delete_os ON public.ordens_servico
  FOR DELETE USING (public.get_user_role() IN ('admin','gestor'));

-- Apenas admin/gestor podem alterar montadores
CREATE POLICY montador_write ON public.montadores
  FOR INSERT WITH CHECK (public.get_user_role() IN ('admin','gestor'));
CREATE POLICY montador_update ON public.montadores
  FOR UPDATE USING (public.get_user_role() IN ('admin','gestor'));

-- ── Política de acesso ao tenant ──────────────────────────
CREATE POLICY tenant_self ON public.tenants
  USING (id = public.get_tenant_id());

-- ── Users: usuário vê apenas do próprio tenant ────────────
CREATE POLICY users_tenant ON public.users
  USING (tenant_id = public.get_tenant_id());

-- ============================================================
-- TRIGGERS DE ATUALIZAÇÃO
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER upd_tenants          BEFORE UPDATE ON public.tenants          FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER upd_users            BEFORE UPDATE ON public.users            FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER upd_clientes         BEFORE UPDATE ON public.clientes         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER upd_montadores       BEFORE UPDATE ON public.montadores       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER upd_produtos         BEFORE UPDATE ON public.produtos         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER upd_estoque          BEFORE UPDATE ON public.estoque          FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER upd_os               BEFORE UPDATE ON public.ordens_servico   FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER upd_rotas            BEFORE UPDATE ON public.rotas            FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Trigger: registra evento na timeline ao mudar status da OS ──
CREATE OR REPLACE FUNCTION public.registrar_evento_os()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.os_eventos(tenant_id, os_id, user_id, tipo, descricao, metadata)
    VALUES(NEW.tenant_id, NEW.id, auth.uid(), 'status_change',
           'Status alterado de ' || COALESCE(OLD.status,'—') || ' para ' || NEW.status,
           jsonb_build_object('status_anterior', OLD.status, 'status_novo', NEW.status));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_evento_status_os
  AFTER UPDATE ON public.ordens_servico
  FOR EACH ROW EXECUTE FUNCTION public.registrar_evento_os();

-- ── Trigger: atualiza NPS médio do montador ──────────────
CREATE OR REPLACE FUNCTION public.atualizar_nps_montador()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.montadores SET
    nps_medio = (SELECT ROUND(AVG(score)::NUMERIC,1) FROM public.nps_respostas WHERE montador_id = NEW.montador_id),
    updated_at = NOW()
  WHERE id = NEW.montador_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_nps_montador
  AFTER INSERT ON public.nps_respostas
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_nps_montador();

-- ── Trigger: decrementa estoque ao criar movimento de saída ──
CREATE OR REPLACE FUNCTION public.processar_movimento_estoque()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tipo IN ('saida','perda') THEN
    UPDATE public.estoque SET qtd_atual = qtd_atual - NEW.quantidade WHERE id = NEW.estoque_id;
  ELSIF NEW.tipo = 'entrada' THEN
    UPDATE public.estoque SET qtd_atual = qtd_atual + NEW.quantidade WHERE id = NEW.estoque_id;
  ELSIF NEW.tipo = 'ajuste' THEN
    UPDATE public.estoque SET qtd_atual = NEW.quantidade WHERE id = NEW.estoque_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_estoque_movimento
  AFTER INSERT ON public.estoque_movimentos
  FOR EACH ROW EXECUTE FUNCTION public.processar_movimento_estoque();

-- ── Trigger: gera notificação ao criar OS atrasada ───────
CREATE OR REPLACE FUNCTION public.notificar_os_atrasada()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Atrasada' AND OLD.status != 'Atrasada' THEN
    INSERT INTO public.notificacoes(tenant_id, tipo, titulo, mensagem, os_id)
    VALUES(NEW.tenant_id, 'critico',
           'OS Atrasada: ' || NEW.numero,
           'Montador sem check-in. OS: ' || NEW.numero,
           NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notif_atrasada
  AFTER UPDATE ON public.ordens_servico
  FOR EACH ROW EXECUTE FUNCTION public.notificar_os_atrasada();

-- ============================================================
-- FUNÇÕES UTILITÁRIAS (SECURITY DEFINER — seguras)
-- ============================================================

-- Resumo do dashboard para o tenant autenticado
CREATE OR REPLACE FUNCTION public.dashboard_resumo()
RETURNS JSONB AS $$
DECLARE
  tid UUID := public.get_tenant_id();
  hoje DATE := CURRENT_DATE;
BEGIN
  RETURN jsonb_build_object(
    'os_hoje',       (SELECT COUNT(*) FROM public.ordens_servico WHERE tenant_id=tid AND data_agendada=hoje),
    'concluidas',    (SELECT COUNT(*) FROM public.ordens_servico WHERE tenant_id=tid AND status='Concluída com Sucesso' AND data_agendada=hoje),
    'em_andamento',  (SELECT COUNT(*) FROM public.ordens_servico WHERE tenant_id=tid AND status IN ('Em Rota','Em Montagem') AND data_agendada=hoje),
    'assistencias',  (SELECT COUNT(*) FROM public.ordens_servico WHERE tenant_id=tid AND status='Em Assistência'),
    'atrasadas',     (SELECT COUNT(*) FROM public.ordens_servico WHERE tenant_id=tid AND status='Atrasada'),
    'nps_medio',     (SELECT ROUND(AVG(score)::NUMERIC,1) FROM public.nps_respostas WHERE tenant_id=tid AND created_at > NOW()-INTERVAL '30 days'),
    'montadores_ativos', (SELECT COUNT(*) FROM public.montadores WHERE tenant_id=tid AND status NOT IN ('Inativo','Férias') AND ativo=true),
    'estoque_critico',   (SELECT COUNT(*) FROM public.estoque WHERE tenant_id=tid AND qtd_atual < qtd_minima AND ativo=true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Busca OS com filtros (usada pelo módulo de Relatórios)
CREATE OR REPLACE FUNCTION public.buscar_os(
  p_status TEXT DEFAULT NULL,
  p_montador_id UUID DEFAULT NULL,
  p_bairro TEXT DEFAULT NULL,
  p_cidade TEXT DEFAULT NULL,
  p_data_ini DATE DEFAULT NULL,
  p_data_fim DATE DEFAULT NULL,
  p_prioridade TEXT DEFAULT NULL,
  p_resultado TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID, numero TEXT, status TEXT, prioridade TEXT,
  data_agendada DATE, hora_agendada TIME,
  cliente_nome TEXT, produto_descricao TEXT,
  montador_nome TEXT, bairro TEXT, cidade TEXT,
  nps_score INTEGER, motivo_assist TEXT
) AS $$
  SELECT
    os.id, os.numero, os.status, os.prioridade,
    os.data_agendada, os.hora_agendada,
    c.nome AS cliente_nome,
    COALESCE(p.nome, os.produto_descricao) AS produto_descricao,
    m.nome AS montador_nome,
    os.bairro, os.cidade,
    os.nps_score, os.motivo_assist
  FROM public.ordens_servico os
  LEFT JOIN public.clientes c ON c.id = os.cliente_id
  LEFT JOIN public.produtos p ON p.id = os.produto_id
  LEFT JOIN public.montadores m ON m.id = os.montador_id
  WHERE os.tenant_id = public.get_tenant_id()
    AND (p_status IS NULL OR os.status = p_status)
    AND (p_montador_id IS NULL OR os.montador_id = p_montador_id)
    AND (p_bairro IS NULL OR os.bairro ILIKE '%' || p_bairro || '%')
    AND (p_cidade IS NULL OR os.cidade ILIKE '%' || p_cidade || '%')
    AND (p_data_ini IS NULL OR os.data_agendada >= p_data_ini)
    AND (p_data_fim IS NULL OR os.data_agendada <= p_data_fim)
    AND (p_prioridade IS NULL OR os.prioridade = p_prioridade)
    AND (p_resultado IS NULL OR os.resultado = p_resultado)
  ORDER BY os.data_agendada DESC, os.hora_agendada
  LIMIT p_limit OFFSET p_offset;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- DADOS INICIAIS (SEED) — apenas para ambiente de dev/demo
-- ============================================================
-- (Executar apenas em staging/dev, nunca em produção diretamente)
-- INSERT INTO public.tenants(razao_social, cnpj, email, plano)
-- VALUES ('Móveis Paraense Ltda.', '12.345.678/0001-90', 'admin@moveisparaense.com.br', 'pro');

-- ============================================================
-- STORAGE BUCKETS (Supabase Storage — configurar no dashboard)
-- ============================================================
-- Bucket: os-fotos        → privado, acesso via URL assinada (1h)
-- Bucket: assinaturas     → privado, acesso via URL assinada (1h)
-- Bucket: comprovantes    → privado, acesso via URL assinada (24h)
-- Bucket: montadores-fotos→ privado, acesso via URL assinada (24h)
-- Bucket: logos           → público (logos das empresas)

-- ============================================================
-- REALTIME — habilitar nas tabelas que precisam de push live
-- ============================================================
-- No Supabase Dashboard > Database > Replication, habilitar:
-- ✅ ordens_servico   (status em tempo real no dashboard)
-- ✅ os_eventos       (timeline ao vivo)
-- ✅ notificacoes     (sino de alertas)
-- ✅ montadores       (posição/status dos montadores)
-- ✅ ponto_registros  (check-in ao vivo)

-- ============================================================
-- VARIÁVEIS DE AMBIENTE NECESSÁRIAS (.env.local)
-- ============================================================
-- VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
-- VITE_SUPABASE_ANON_KEY=SEU_ANON_KEY
-- (nunca expor a SERVICE_ROLE_KEY no frontend)

