import { useState } from "react";
import { C } from "../theme";
import { supabase } from "../lib/supabase";
import { Btn } from "../components/ui";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const entrar = async () => {
    if (!email || !senha) return setErro("Preencha e-mail e senha.");
    setLoading(true); setErro("");
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) setErro("Credenciais inválidas.");
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100dvh", background: C.dark, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Inter',-apple-system,sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 30, fontWeight: 900, color: C.text }}>Monta<span style={{ color: C.accent }}>Movel</span></div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>App do Montador</div>
        </div>
        {erro && <div style={{ background: C.accent + "18", border: `1px solid ${C.accent}44`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.accent, marginBottom: 16 }}>{erro}</div>}
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="seu@email.com" autoComplete="username"
          style={{ width: "100%", boxSizing: "border-box", padding: "14px 16px", borderRadius: 12, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 15, marginBottom: 12, outline: "none" }} />
        <input value={senha} onChange={e => setSenha(e.target.value)} type="password" placeholder="Senha" autoComplete="current-password" onKeyDown={e => e.key === "Enter" && entrar()}
          style={{ width: "100%", boxSizing: "border-box", padding: "14px 16px", borderRadius: 12, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 15, marginBottom: 20, outline: "none" }} />
        <Btn onClick={entrar} disabled={loading} full>{loading ? "Entrando..." : "Entrar"}</Btn>
      </div>
    </div>
  );
};
