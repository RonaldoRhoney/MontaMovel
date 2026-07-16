import { useState } from "react";
import { C } from "../theme";
import { supabase } from "../lib/supabase";
import { Inp, Btn } from "../components/ui";

export const Login = ({onLogin}) => {
  const [email,setEmail]   = useState("");
  const [senha,setSenha]   = useState("");
  const [loading,setLoading] = useState(false);
  const [erro,setErro]     = useState("");

  const entrar = async() => {
    if(!email||!senha) return setErro("Preencha e-mail e senha.");
    setLoading(true); setErro("");
    const {error} = await supabase.auth.signInWithPassword({email,password:senha});
    if(error) setErro("Credenciais inválidas.");
    else onLogin();
    setLoading(false);
  };

  return <div style={{minHeight:"100vh",background:C.dark,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',-apple-system,sans-serif"}}>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:40,width:380,boxShadow:"0 8px 40px #00000088"}}>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{fontSize:28,fontWeight:900,color:C.text}}>Monta<span style={{color:C.accent}}>Movel</span></div>
        <div style={{fontSize:13,color:C.muted,marginTop:6}}>Acesse sua plataforma</div>
      </div>
      {erro&&<div style={{background:C.accent+"18",border:`1px solid ${C.accent}44`,borderRadius:8,padding:"10px 14px",fontSize:13,color:C.accent,marginBottom:16}}>{erro}</div>}
      <Inp label="E-mail" value={email} onChange={setEmail} type="email" placeholder="seu@email.com" required/>
      <Inp label="Senha" value={senha} onChange={setSenha} type="password" placeholder="••••••••" required/>
      <Btn onClick={entrar} disabled={loading}>{loading?"Entrando...":"Entrar"}</Btn>
      <div style={{marginTop:14,textAlign:"center"}}>
        <button style={{background:"none",border:"none",color:C.blue,cursor:"pointer",fontSize:12}}>Esqueci minha senha</button>
      </div>
    </div>
  </div>;
};
