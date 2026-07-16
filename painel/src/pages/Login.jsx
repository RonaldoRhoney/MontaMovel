import { useState } from "react";
import { C } from "../theme";
import { supabase } from "../lib/supabase";
import { Inp, Btn } from "../components/ui";

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

  return <div style={{minHeight:"100vh",background:C.dark,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',-apple-system,sans-serif"}}>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:40,width:380,boxShadow:"0 8px 40px #00000088"}}>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{fontSize:28,fontWeight:900,color:C.text}}>Monta<span style={{color:C.accent}}>Movel</span></div>
        <div style={{fontSize:13,color:C.muted,marginTop:6}}>{modoRecuperar ? "Recuperar senha" : "Acesse sua plataforma"}</div>
      </div>
      {erro&&<div style={{background:C.accent+"18",border:`1px solid ${C.accent}44`,borderRadius:8,padding:"10px 14px",fontSize:13,color:C.accent,marginBottom:16}}>{erro}</div>}
      {aviso&&<div style={{background:C.blue+"18",border:`1px solid ${C.blue}44`,borderRadius:8,padding:"10px 14px",fontSize:13,color:C.blue,marginBottom:16}}>{aviso}</div>}
      <Inp label="E-mail" value={email} onChange={setEmail} type="email" placeholder="seu@email.com" required/>
      {!modoRecuperar && <Inp label="Senha" value={senha} onChange={setSenha} type="password" placeholder="••••••••" required/>}
      {modoRecuperar
        ? <Btn onClick={recuperar} disabled={loading}>{loading?"Enviando...":"Enviar link de recuperação"}</Btn>
        : <Btn onClick={entrar} disabled={loading}>{loading?"Entrando...":"Entrar"}</Btn>}
      <div style={{marginTop:14,textAlign:"center",display:"flex",flexDirection:"column",gap:8}}>
        <button onClick={()=>{setModoRecuperar(!modoRecuperar);setErro("");setAviso("");}} style={{background:"none",border:"none",color:C.blue,cursor:"pointer",fontSize:12}}>
          {modoRecuperar ? "Voltar para o login" : "Esqueci minha senha"}
        </button>
        {!modoRecuperar && <button onClick={onCriarConta} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:12}}>Não tem conta? Comece seu trial de 60 dias</button>}
      </div>
    </div>
  </div>;
};
