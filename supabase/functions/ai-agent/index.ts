// Supabase Edge Function — proxy do Agente IA (chat flutuante do painel) para
// a API da Anthropic.
//
// Por que isso não pode rodar no navegador: a chamada anterior era feita
// direto do frontend para api.anthropic.com sem nenhuma chave — ou o recurso
// estava quebrado em produção, ou alguém teria que colocar a ANTHROPIC_API_KEY
// no bundle do cliente, o que expõe a chave a qualquer pessoa que inspecione
// as requisições. Esta função mantém a chave só no servidor (Supabase secret)
// e revalida a sessão de quem chama antes de repassar a mensagem à IA.

import { createClient } from "jsr:@supabase/supabase-js@2";

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
  if (!token) return new Response("Não autenticado.", { status: 401 });

  const { data: { user: chamador }, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !chamador) return new Response("Sessão inválida.", { status: 401 });

  if (!ANTHROPIC_API_KEY) {
    return new Response("Agente de IA não configurado (ANTHROPIC_API_KEY ausente).", { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const { system, messages } = body as { system?: string; messages?: { role: string; content: string }[] };
  if (!system || !Array.isArray(messages) || messages.length === 0) {
    return new Response("Dados inválidos.", { status: 400 });
  }

  // Limita tamanho de mensagens para evitar abuso/custo descontrolado.
  const safeMessages = messages.slice(-20).map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: String(m.content || "").slice(0, 4000),
  }));

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system,
      messages: safeMessages,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("[ai-agent] Anthropic error", res.status, errText);
    return new Response("Agente indisponível no momento.", { status: 502 });
  }

  const data = await res.json();
  const reply = data?.content?.[0]?.text || "";
  return new Response(JSON.stringify({ reply }), { status: 200, headers: { "Content-Type": "application/json" } });
});
