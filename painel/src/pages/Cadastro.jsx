import { useState } from "react";
import { C } from "../theme";
import { supabase } from "../lib/supabase";
import { Inp, Btn } from "../components/ui";

// Cadastro self-service (trial 60 dias, plano §8.2/§14.6). Dois passos porque
// são duas operações distintas no Supabase: criar a conta (auth.users) e só
// depois, já autenticado, criar a empresa (RPC bootstrap_tenant — RLS não
// deixaria um usuário sem tenant_id inserir em `tenants`/`users` direto).
//
// `contaCriada` permite entrar direto no passo 2 quando o App já tem uma
// sessão válida mas nenhuma linha em `public.users` (ex.: usuário recarregou
// a página no meio do cadastro).
export const Cadastro = ({ contaCriada = false, onConcluido, onVoltarLogin }) => {
  const [passo, setPasso] = useState(contaCriada ? 2 : 1);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const [conta, setConta] = useState({ email: "", senha: "" });
  const [empresa, setEmpresa] = useState({ razao_social: "", cnpj: "", telefone: "", cidade: "", estado: "PA", nome_admin: "" });
  const e = (v) => setEmpresa({ ...empresa, ...v });

  const criarConta = async () => {
    if (!conta.email || conta.senha.length < 10) return setErro("E-mail válido e senha com 10+ caracteres.");
    setLoading(true); setErro("");
    const { error } = await supabase.auth.signUp({ email: conta.email, password: conta.senha });
    setLoading(false);
    if (error) return setErro(error.message);
    setEmpresa((p) => ({ ...p, telefone: p.telefone })); // no-op, mantém estado
    setPasso(2);
  };

  const criarEmpresa = async () => {
    if (!empresa.razao_social || !empresa.nome_admin) return setErro("Razão social e seu nome são obrigatórios.");
    setLoading(true); setErro("");
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.rpc("bootstrap_tenant", {
      p_razao_social: empresa.razao_social, p_email: user?.email || conta.email, p_telefone: empresa.telefone,
      p_cidade: empresa.cidade, p_estado: empresa.estado, p_nome_admin: empresa.nome_admin,
    });
    setLoading(false);
    if (error) return setErro(error.message);
    onConcluido();
  };

  return (
    <div style={{ minHeight: "100vh", background: C.dark, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',-apple-system,sans-serif" }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 40, width: 420, boxShadow: "0 8px 40px #00000088" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: C.text }}>Monta<span style={{ color: C.accent }}>Movel</span></div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>{passo === 1 ? "Crie sua conta — 60 dias grátis" : "Agora, sobre sua empresa"}</div>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
          {[1, 2].map((n) => <div key={n} style={{ flex: 1, height: 3, borderRadius: 2, background: passo >= n ? C.accent : C.border }} />)}
        </div>

        {erro && <div style={{ background: C.accent + "18", border: `1px solid ${C.accent}44`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.accent, marginBottom: 16 }}>{erro}</div>}

        {passo === 1 ? (
          <>
            <Inp label="E-mail" value={conta.email} onChange={(v) => setConta({ ...conta, email: v })} type="email" placeholder="voce@empresa.com" required />
            <Inp label="Senha" value={conta.senha} onChange={(v) => setConta({ ...conta, senha: v })} type="password" placeholder="Mínimo 10 caracteres" required />
            <Btn onClick={criarConta} disabled={loading}>{loading ? "Criando..." : "Continuar"}</Btn>
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <button onClick={onVoltarLogin} style={{ background: "none", border: "none", color: C.blue, cursor: "pointer", fontSize: 12 }}>Já tenho conta — entrar</button>
            </div>
          </>
        ) : (
          <>
            <Inp label="Seu nome" value={empresa.nome_admin} onChange={(v) => e({ nome_admin: v })} required />
            <Inp label="Razão Social" value={empresa.razao_social} onChange={(v) => e({ razao_social: v })} required />
            <Inp label="CNPJ (opcional para MEI/começando)" value={empresa.cnpj} onChange={(v) => e({ cnpj: v })} />
            <Inp label="Telefone" value={empresa.telefone} onChange={(v) => e({ telefone: v })} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Inp label="Cidade" value={empresa.cidade} onChange={(v) => e({ cidade: v })} />
              <Inp label="Estado" value={empresa.estado} onChange={(v) => e({ estado: v })} placeholder="PA" />
            </div>
            <Btn onClick={criarEmpresa} disabled={loading}>{loading ? "Criando empresa..." : "Começar meu trial de 60 dias"}</Btn>
          </>
        )}
      </div>
    </div>
  );
};
