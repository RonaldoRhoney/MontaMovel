import { useState } from "react";
import { C } from "../theme";
import { supabase } from "../lib/supabase";
import { Inp, Btn } from "../components/ui";
import { AuthShell } from "../components/AuthShell";

export const Login = ({ onLogin, onCriarConta }) => {
  const [email, setEmail]     = useState("");
  const [senha, setSenha]     = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro]       = useState("");
  const [aviso, setAviso]     = useState("");
  const [modoRecuperar, setModoRecuperar] = useState(false);

  const entrar = async () => {
    if (!email || !senha) return setErro("Preencha e-mail e senha.");
    setLoading(true); setErro("");
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) setErro("Credenciais inválidas.");
    else onLogin();
    setLoading(false);
  };

  const recuperar = async () => {
    if (!email) return setErro("Informe seu e-mail para receber o link de recuperação.");
    setLoading(true); setErro(""); setAviso("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    setLoading(false);
    if (error) return setErro(error.message);
    setAviso("Enviamos um link de recuperação para " + email + ".");
  };

  return (
    <AuthShell subtitle={modoRecuperar ? "Recuperar senha" : "Acesse sua plataforma"}>
      {erro&&<div style={{background:C.accent+"18",border:`1px solid ${C.accent}44`,borderRadius:9,padding:"10px 14px",fontSize:13,color:C.accent,marginBottom:16}}>{erro}</div>}
      {aviso&&<div style={{background:C.blue+"18",border:`1px solid ${C.blue}44`,borderRadius:9,padding:"10px 14px",fontSize:13,color:C.blue,marginBottom:16}}>{aviso}</div>}
      <Inp label="E-mail" value={email} onChange={setEmail} type="email" placeholder="seu@email.com" required/>
      {!modoRecuperar && <Inp label="Senha" value={senha} onChange={setSenha} type="password" placeholder="••••••••" required/>}
      {modoRecuperar
        ? <Btn onClick={recuperar} disabled={loading} full>{loading?"Enviando...":"Enviar link de recuperação"}</Btn>
        : <Btn onClick={entrar} disabled={loading} full>{loading?"Entrando...":"Entrar"}</Btn>}
      <div style={{marginTop:16,textAlign:"center",display:"flex",flexDirection:"column",gap:8}}>
        <button onClick={()=>{setModoRecuperar(!modoRecuperar);setErro("");setAviso("");}} style={{background:"none",border:"none",color:C.blue,cursor:"pointer",fontSize:12}}>
          {modoRecuperar ? "Voltar para o login" : "Esqueci minha senha"}
        </button>
        {!modoRecuperar && <button onClick={onCriarConta} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:12}}>Não tem conta? Comece seu trial de 60 dias</button>}
      </div>
    </AuthShell>
  );
};
