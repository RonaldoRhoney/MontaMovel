import { useState } from "react";
import { C } from "../theme";
import { supabase } from "../lib/supabase";
import { Btn, Card } from "./ui";

// LGPD Art. 18 — direito de acesso do titular; link de contato do DPO
// conforme docs/MontaMovel_Planejamento_v3.docx §12.1.
export const MeusDados = ({ token }) => {
  const [aberto, setAberto] = useState(false);
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);

  const abrir = async () => {
    if (!aberto && !dados) {
      setLoading(true);
      const { data } = await supabase.rpc("portal_get_meus_dados", { p_token: token });
      setDados(data?.[0] || null);
      setLoading(false);
    }
    setAberto(v => !v);
  };

  return (
    <Card>
      <button onClick={abrir} style={{ background: "none", border: "none", color: C.text, fontSize: 14, fontWeight: 700, cursor: "pointer", padding: 0, display: "flex", justifyContent: "space-between", width: "100%" }}>
        🔒 Meus Dados <span style={{ color: C.muted }}>{aberto ? "▲" : "▼"}</span>
      </button>
      {aberto && (
        <div style={{ marginTop: 14 }}>
          {loading && <div style={{ color: C.muted, fontSize: 13 }}>Carregando...</div>}
          {dados && (
            <div style={{ fontSize: 13, color: C.text, lineHeight: 1.9 }}>
              <div><strong style={{ color: C.muted }}>Nome:</strong> {dados.nome}</div>
              <div><strong style={{ color: C.muted }}>Telefone:</strong> {dados.telefone}</div>
              {dados.email && <div><strong style={{ color: C.muted }}>E-mail:</strong> {dados.email}</div>}
              <div><strong style={{ color: C.muted }}>Endereço:</strong> {dados.endereco}</div>
            </div>
          )}
          <div style={{ fontSize: 12, color: C.muted, marginTop: 12, lineHeight: 1.6 }}>
            Para corrigir ou solicitar a exclusão dos seus dados, fale com nosso Encarregado de Dados (DPO):
          </div>
          <a href="mailto:dpo@montamovel.com.br" style={{ display: "block", marginTop: 8 }}>
            <Btn variant="ghost" full>✉️ dpo@montamovel.com.br</Btn>
          </a>
        </div>
      )}
    </Card>
  );
};
