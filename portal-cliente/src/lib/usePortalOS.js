import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";

function getToken() {
  return new URLSearchParams(window.location.search).get("t");
}

export function usePortalOS() {
  const token = getToken();
  const [os, setOs] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const load = useCallback(async () => {
    if (!token) { setErro("Link inválido — nenhum código de acompanhamento informado."); setLoading(false); return; }
    setLoading(true);
    const [{ data: osData, error: e1 }, { data: evData }] = await Promise.all([
      supabase.rpc("portal_get_os", { p_token: token }),
      supabase.rpc("portal_get_eventos", { p_token: token }),
    ]);
    if (e1 || !osData || osData.length === 0) {
      setErro("Este link expirou ou não é mais válido. Entre em contato com quem agendou sua montagem.");
      setOs(null);
    } else {
      setOs(osData[0]);
      setEventos(evData || []);
      setErro(null);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  // Cada ação chama a RPC correspondente e relança o erro amigável do banco
  // (as funções portal_* fazem RAISE EXCEPTION com mensagens em português).
  const chamar = async (fn, args) => {
    const { error } = await supabase.rpc(fn, { p_token: token, ...args });
    if (error) throw new Error(error.message.replace(/^.*?:\s*/, ""));
    await load();
  };

  return {
    token, os, eventos, loading, erro, refetch: load,
    confirmar: () => chamar("portal_confirmar", {}),
    reagendar: (data, hora) => chamar("portal_reagendar", { p_nova_data: data, p_nova_hora: hora }),
    cancelar: (motivo) => chamar("portal_cancelar", { p_motivo: motivo }),
    responderNps: (score, comentario) => chamar("portal_responder_nps", { p_score: score, p_comentario: comentario }),
  };
}
