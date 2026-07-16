# MontaMovel — Integração n8n / WhatsApp (Módulo 8)

Como as peças se conectam:

```
Postgres (Supabase)                    n8n                         WhatsApp
──────────────────                    ───                         ────────
ordens_servico muda de status
  │
  ├─ trigger os_notify_n8n ──POST assinado (HMAC)──▶ Webhook Eventos MontaMovel
  │                                                    (01-outbound-whatsapp.json)
  │                                                       │
  │                                                       ├─ monta a mensagem certa
  │                                                       └─ envia via Evolution/Z-API ──▶ cliente

job_lembrete_24h (pg_cron, roda de hora em hora) ──▶ mesmo webhook acima, evento "lembrete"

cliente responde no WhatsApp ──▶ webhook do provedor ──▶ Webhook Evolution Inbound
                                                            (02-inbound-whatsapp.json)
                                                               │
                                                               ├─ resolve a OS pelo telefone
                                                               ├─ SIM/CONFIRMAR → RPC portal_confirmar
                                                               ├─ NÃO/CANCELAR  → RPC portal_cancelar
                                                               ├─ nota 0-10     → RPC portal_responder_nps
                                                               └─ resto         → alerta pro atendente
```

O banco nunca decide o texto da mensagem nem fala com o WhatsApp diretamente — ele só avisa
"aconteceu X na OS Y" (`public.notify_n8n`, ver `supabase/004_n8n_integration.sql`). Isso mantém
templates de mensagem editáveis dentro do n8n, sem precisar de deploy pra mudar um texto.

## 1. Aplicar as migrações no Supabase

Na ordem, depois de `schema.sql`:

```
supabase/002_storage_and_pwa_policies.sql
supabase/003_portal_cliente_rpc.sql
supabase/004_n8n_integration.sql   -- exige as extensões pg_net e pg_cron habilitadas
supabase/005_n8n_inbound_rpc.sql
```

`pg_net` e `pg_cron` precisam ser habilitadas em Database → Extensions no dashboard antes de
rodar a 004 (a migração já tenta `CREATE EXTENSION IF NOT EXISTS`, mas em alguns planos isso
só funciona pelo dashboard).

## 2. Configurar por tenant

Cada empresa-cliente (`tenants`) precisa de:

- `n8n_webhook_url` — a URL do webhook `montamovel-eventos` do workflow 01, para esse tenant
  (se você rodar um n8n compartilhado, o path pode incluir o tenant_id; se for self-hosted por
  cliente Enterprise, é uma instância inteira separada)
- `webhook_secret` — já é gerado automaticamente na migração; copie o valor e configure como
  credencial no n8n (usado tanto para assinar o outbound quanto validar o inbound)

## 3. Publicar a Edge Function

```
supabase functions deploy n8n-inbound
```

Ela recebe dois tipos de callback do n8n — status de entrega da mensagem e mensagens do
cliente que não bateram com nenhuma ação automática — e grava em `comunicacoes_log` /
`notificacoes`. Ver `supabase/functions/n8n-inbound/index.ts`.

## 4. Importar os workflows no n8n

- `01-outbound-whatsapp.json` — um workflow só, com um `Code` node que escolhe o template
  certo por tipo de evento (confirmação, lembrete, saída em rota, NPS, assistência,
  reagendamento). Editar o texto dos templates é editar esse node, sem tocar em nada mais.
- `02-inbound-whatsapp.json` — recebe as respostas do cliente. **Rodar um workflow por tenant**
  (variável de ambiente `MONTAMOVEL_TENANT_ID`), a menos que todos os clientes-empresa
  compartilhem o mesmo número de WhatsApp.

Depois de importar, configure no ambiente do n8n (ou nas credenciais do node, se preferir por
workflow):

| Variável | Para quê |
|---|---|
| `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE` | Envio via Evolution API (troque pelo Z-API se for esse o provedor) |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Chamar as RPCs `portal_*` (anon) e `n8n_resolve_os_por_telefone` (service role — **nunca** exponha essa chave fora do n8n) |
| `SUPABASE_FUNCTIONS_URL` | Endpoint da Edge Function `n8n-inbound` |
| `MONTAMOVEL_SIGN_HELPER` | Ver nota de segurança abaixo |

**Nota sobre assinatura HMAC no n8n:** o node `HTTP Request` não calcula HMAC nativamente.
`MONTAMOVEL_SIGN_HELPER` é um placeholder — na prática, adicione um `Code` node antes do
`HTTP Request` que calcule `crypto.createHmac('sha256', secret).update(body).digest('hex')`
(Node.js `crypto` está disponível dentro do Code node do n8n) e referencie o resultado no
header. Deixei o placeholder em vez de já embutir isso porque o `webhook_secret` é por
tenant — só faz sentido resolver isso depois de decidir se o n8n é compartilhado ou
um-por-cliente (ver `n8n_webhook_url` acima).

## O que ainda falta (fora do escopo desta rodada)

- Templates de mensagem em `01-outbound-whatsapp.json` são um ponto de partida — revisar tom
  e formatação antes de qualquer envio real.
- O Code node de `02-inbound-whatsapp.json` que faz parsing do payload assume o formato da
  Evolution API; se o provedor final for outro (Z-API, WhatsApp Cloud API oficial), esse node
  precisa ser adaptado.
- Sem teste ponta-a-ponta contra um n8n/Supabase reais — ambos os JSONs foram validados como
  JSON e revisados manualmente, mas só um import real no editor do n8n confirma que os tipos
  de node/versão batem com a versão instalada.
