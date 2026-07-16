import { useEffect, useState } from "react";
import { supabase } from "./supabase";

// Resolve o registro em `montadores` vinculado ao usuário autenticado —
// toda tela do app filtra dados por este id (RLS já reforça isso no banco).
export function useMontador(session) {
  const [montador, setMontador] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) { setMontador(null); setLoading(false); return; }
    setLoading(true);
    supabase.from("montadores").select("*").eq("user_id", session.user.id).single()
      .then(({ data }) => { setMontador(data); setLoading(false); });
  }, [session]);

  return { montador, loading };
}
