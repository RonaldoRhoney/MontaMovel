// Supabase Edge Function — convida um novo usuário interno (gestor/atendente/
// admin/montador com acesso ao painel) pro tenant de quem está chamando.
//
// Por que isso não é uma RPC comum: criar um usuário exige auth.admin.
// inviteUserByEmail(), disponível só com a service role key — nunca pode
// rodar no navegador do cliente. O front (Configuracoes → Usuários) chama
// este endpoint passando o próprio access token; a função revalida quem é
// o chamador e qual o tenant dele antes de convidar alguém.

import { createClient } from "jsr:@supabase/supabase-js@2";

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
  if (!token) return new Response("Não autenticado.", { status: 401 });

  const { data: { user: chamador }, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !chamador) return new Response("Sessão inválida.", { status: 401 });

  const { data: perfilChamador } = await admin.from("users").select("tenant_id, role").eq("id", chamador.id).single();
  if (!perfilChamador || !["admin", "gestor"].includes(perfilChamador.role)) {
    return new Response("Sem permissão para convidar usuários.", { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { email, nome, telefone, role } = body as { email?: string; nome?: string; telefone?: string; role?: string };
  if (!email || !nome || !["admin", "gestor", "atendente", "montador"].includes(role || "")) {
    return new Response("Dados inválidos.", { status: 400 });
  }

  const { data: convite, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email);
  if (inviteErr || !convite?.user) {
    return new Response(inviteErr?.message || "Falha ao convidar.", { status: 400 });
  }

  const { error: insertErr } = await admin.from("users").insert([{
    id: convite.user.id, tenant_id: perfilChamador.tenant_id,
    nome, email, telefone: telefone || null, role, ativo: true,
  }]);
  if (insertErr) return new Response(insertErr.message, { status: 400 });

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
});
