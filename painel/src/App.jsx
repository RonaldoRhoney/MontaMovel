import { useState, useEffect } from "react";
import { C } from "./theme";
import { supabase } from "./lib/supabase";
import { Login } from "./pages/Login";
import { Cadastro } from "./pages/Cadastro";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { AgenteIA } from "./components/AgenteIA";
import { Toast } from "./components/ui";
import { Dashboard } from "./pages/Dashboard";
import { Pedidos } from "./pages/Pedidos";
import { OS } from "./pages/OS";
import { Agendamento } from "./pages/Agendamento";
import { Clientes } from "./pages/Clientes";
import { Montadores } from "./pages/Montadores";
import { Produtos } from "./pages/Produtos";
import { Rotas } from "./pages/Rotas";
import { Estoque } from "./pages/Estoque";
import { Ponto } from "./pages/Ponto";
import { Relatorios } from "./pages/Relatorios";
import { Comunicacao } from "./pages/Comunicacao";
import { Configuracoes } from "./pages/Configuracoes";

export default function App() {
  const [session,setSession]   = useState(null);
  const [user,setUser]         = useState(null);
  const [ativo,setAtivo]       = useState("dashboard");
  const [col,setCol]           = useState(false);
  const [notifOpen,setNotifOpen] = useState(false);
  const [notifs,setNotifs]     = useState([]);
  const [toastState,setToast]  = useState(null);
  const [authLoading,setAuthLoading] = useState(true);
  const [userLoading,setUserLoading] = useState(true);
  const [tela,setTela]         = useState("login"); // "login" | "cadastro"

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session:s}})=>{ setSession(s); setAuthLoading(false); });
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_,s)=>setSession(s));
    return ()=>subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if(!session) return setUser(null);
    setUserLoading(true);
    supabase.from("users").select("*").eq("id",session.user.id).single()
      .then(({data})=>{ setUser(data||null); setUserLoading(false); });
  },[session]);

  useEffect(()=>{
    if(!session) return;
    const ch=supabase.channel("notif_global")
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"notificacoes"},({new:n})=>setNotifs(p=>[n,...p].slice(0,20)))
      .subscribe();
    supabase.from("notificacoes").select("*").eq("lida",false).order("created_at",{ascending:false}).limit(10)
      .then(({data})=>setNotifs(data||[]));
    return ()=>supabase.removeChannel(ch);
  },[session]);

  const showToast=(msg,type="info")=>setToast({msg,type});

  const TITULOS = {
    dashboard:"Dashboard",pedidos:"Pedidos",os:"Ordens de Serviço",agendamento:"Agendamentos",
    clientes:"Clientes",montadores:"Montadores",produtos:"Produtos",
    rotas:"Rotas e Otimização",estoque:"Estoque",ponto:"Registro de Ponto (REP-P)",
    relatorios:"Relatórios e Filtros",comunicacao:"Comunicação — n8n",configuracoes:"Configurações",
  };

  const VIEWS = {
    dashboard:     <Dashboard/>,
    pedidos:       <Pedidos user={user} toast={showToast}/>,
    os:            <OS toast={showToast} user={user}/>,
    agendamento:   <Agendamento toast={showToast}/>,
    clientes:      <Clientes toast={showToast}/>,
    montadores:    <Montadores toast={showToast}/>,
    produtos:      <Produtos toast={showToast}/>,
    rotas:         <Rotas/>,
    estoque:       <Estoque toast={showToast}/>,
    ponto:         <Ponto/>,
    relatorios:    <Relatorios/>,
    comunicacao:   <Comunicacao/>,
    configuracoes: <Configuracoes user={user} toast={showToast} onLogout={()=>setSession(null)}/>,
  };

  if(authLoading) return (
    <div style={{minHeight:"100vh",background:C.dark,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',-apple-system,sans-serif"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:28,fontWeight:900,color:C.text,marginBottom:12}}>Monta<span style={{color:C.accent}}>Movel</span></div>
        <div style={{fontSize:13,color:C.muted}}>Carregando...</div>
      </div>
    </div>
  );

  if(!session) {
    return tela==="cadastro"
      ? <Cadastro onConcluido={()=>window.location.reload()} onVoltarLogin={()=>setTela("login")}/>
      : <Login onLogin={()=>{}} onCriarConta={()=>setTela("cadastro")}/>;
  }

  // Sessão válida mas sem linha em `users` ainda: signUp aconteceu, falta o
  // passo 2 do cadastro (dados da empresa) — ex.: usuário recarregou no meio.
  if(!userLoading && !user) {
    return <Cadastro contaCriada onConcluido={()=>window.location.reload()} onVoltarLogin={()=>supabase.auth.signOut()}/>;
  }

  return (
    <div style={{display:"flex",minHeight:"100vh",background:C.dark,fontFamily:"'Inter',-apple-system,sans-serif",color:C.text}}
      onClick={()=>notifOpen&&setNotifOpen(false)}>
      <Sidebar ativo={ativo} setAtivo={setAtivo} col={col} setCol={setCol} user={user}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,maxHeight:"100vh",overflowY:"auto"}}>
        <Topbar titulo={TITULOS[ativo]} notifOpen={notifOpen} setNotifOpen={setNotifOpen} notifs={notifs} onNovaOS={()=>setAtivo("os")}/>
        <main style={{flex:1}}>{VIEWS[ativo]}</main>
      </div>
      <AgenteIA modulo={ativo} ctx={`Usuário: ${user?.nome||"—"} (${user?.role||"—"})`}/>
      {toastState&&<Toast msg={toastState.msg} type={toastState.type} onClose={()=>setToast(null)}/>}
    </div>
  );
}

