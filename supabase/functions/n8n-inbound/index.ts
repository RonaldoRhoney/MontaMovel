// Supabase Edge Function — recebe callbacks do n8n (Deno).
//
// Duas responsabilidades, conforme docs/MontaMovel_Planejamento_v3.docx §13.4:
//  1) status de entrega da mensagem (enviado/entregue/lido/falhou) → atualiza comunicacoes_log
//  2) log de mensagens recebidas do cliente que o n8n não conseguiu mapear pra uma ação
//     automática (ex.: texto livre) → vira notificação pro atendente, não tenta adivinhar.
//
// Ações que o cliente PODE disparar via WhatsApp (confirmar, reagendar, avaliar) não passam
// por aqui — o n8n chama direto as RPCs portal_* (mesmas do portal-cliente/), usando o
// token_cliente que já veio no payload de build_os_payload(). Isso evita duplicar a lógica
// de negócio em dois lugares.
//
// Autenticação: HMAC-SHA256 do corpo bruto com o webhook_secret do tenant (mesmo mecanismo
// usado para assinar a saída em notify_n8n() — aqui validamos a entrada).

import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function hmacHex(secret: string, body: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const raw = await req.text();
  let evento: { tipo: string; tenant_id: string; comunicacao_id?: string; status?: string; provider_id?: string; erro?: string; texto_livre?: string; telefone?: string };
  try { evento = JSON.parse(raw); } catch { return new Response("JSON inválido", { status: 400 }); }

  const { data: tenant } = await supabase.from("tenants").select("webhook_secret").eq("id", evento.tenant_id).single();
  if (!tenant?.webhook_secret) return new Response("Tenant desconhecido", { status: 404 });

  const assinatura = req.headers.get("X-MontaMovel-Signature") || "";
  const esperado = await hmacHex(tenant.webhook_secret, raw);
  if (assinatura !== esperado) return new Response("Assinatura inválida", { status: 401 });

  if (evento.tipo === "status_entrega") {
    await supabase.from("comunicacoes_log")
      .update({ status: evento.status, provider_id: evento.provider_id, erro: evento.erro ?? null })
      .eq("id", evento.comunicacao_id);
  } else if (evento.tipo === "mensagem_nao_mapeada") {
    await supabase.from("notificacoes").insert([{
      tenant_id: evento.tenant_id, tipo: "alerta", titulo: "Resposta de cliente sem ação automática",
      mensagem: `WhatsApp ${evento.telefone ?? "desconhecido"}: "${evento.texto_livre ?? ""}"`,
    }]);
  } else {
    return new Response("Tipo de evento não reconhecido", { status: 400 });
  }

  return new Response("ok", { status: 200 });
});
