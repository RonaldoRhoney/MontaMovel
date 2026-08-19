// Supabase Edge Function — exclusão da própria conta pelo titular (LGPD/Google
// Play policy: precisa existir um fluxo de autoatendimento, não só soft-delete
// administrativo sobre terceiros). Apaga o usuário de auth (cascata apaga a
// linha em `public.users`) e nunca aceita excluir outra conta que não a de
// quem está autenticado.

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

  const { error } = await admin.auth.admin.deleteUser(chamador.id);
  if (error) return new Response(error.message, { status: 400 });

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
});
