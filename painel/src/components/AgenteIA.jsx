import { useState, useEffect, useRef } from "react";
import { C } from "../theme";

const AGENTES = {
  dashboard:    {emoji:"📊",nome:"Agente Dashboard",   desc:"KPIs, gargalos e ações imediatas",      sys:"Você é o Agente Dashboard do MontaMovel. Analise os dados operacionais (OS, montadores, NPS, assistências) e sugira ações concretas em português."},
  os:           {emoji:"📋",nome:"Agente OS",          desc:"Gerencia ordens e assistências",         sys:"Você é o Agente de OS do MontaMovel. Auxilie no gerenciamento de ordens de serviço, padrões de assistência e reagendamentos. Responda em português."},
  agendamento:  {emoji:"📅",nome:"Agente Agenda",      desc:"Otimiza horários e detecta conflitos",   sys:"Você é o Agente de Agendamentos. Sugira janelas ideais, identifique conflitos e otimize capacidade. Responda em português."},
  clientes:     {emoji:"👤",nome:"Agente Clientes",    desc:"Histórico e padrões de clientes",        sys:"Você é o Agente de Clientes do MontaMovel. Analise histórico de OS, identifique clientes críticos e sugira ações de relacionamento. Responda em português."},
  montadores:   {emoji:"👷",nome:"Agente Equipe",      desc:"Performance e gestão de montadores",     sys:"Você é o Agente de Equipe. Monitore NPS, assistências e pontualidade por montador. Identifique quem precisa de suporte. Responda em português."},
  produtos:     {emoji:"🪑",nome:"Agente Produtos",    desc:"Catálogo e complexidade de montagem",    sys:"Você é o Agente de Produtos. Auxilie na categorização, tempo estimado e gestão do catálogo. Responda em português."},
  rotas:        {emoji:"🗺️",nome:"Agente Rotas",      desc:"Otimiza sequências e reduz km",          sys:"Você é o Agente de Rotas. Otimize sequências por proximidade, sugira reagrupamentos e calcule economia. Responda em português."},
  estoque:      {emoji:"📦",nome:"Agente Estoque",     desc:"Níveis críticos e correlação com OS",    sys:"Você é o Agente de Estoque. Monitore peças, correlacione faltas com assistências e sugira reposição. Responda em português."},
  ponto:        {emoji:"⏱️",nome:"Agente Ponto",       desc:"Conformidade MTE 671/2021",              sys:"Você é o Agente de Ponto, especialista na Portaria MTE 671/2021 (REP-P). Valide jornadas, detecte inconsistências e garanta conformidade. Responda em português."},
  relatorios:   {emoji:"📈",nome:"Agente Analytics",   desc:"Tendências e insights estratégicos",     sys:"Você é o Agente Analytics. Interprete dados, identifique tendências e gere insights estratégicos. Responda em português."},
  comunicacao:  {emoji:"💬",nome:"Agente Comunicação", desc:"Fluxos n8n e templates WhatsApp",        sys:"Você é o Agente de Comunicação, especialista em n8n e WhatsApp Business. Configure fluxos e diagnostique falhas. Responda em português."},
  configuracoes:{emoji:"⚙️",nome:"Agente Config",      desc:"LGPD, segurança e integrações",          sys:"Você é o Agente de Configurações, especialista em LGPD, segurança SaaS e integrações. Oriente o administrador. Responda em português."},
};

export const AgenteIA = ({modulo,ctx=""}) => {
  const [open,setOpen]       = useState(false);
  const [msgs,setMsgs]       = useState([]);
  const [input,setInput]     = useState("");
  const [loading,setLoading] = useState(false);
  const endRef = useRef(null);
  const ag = AGENTES[modulo]||AGENTES.dashboard;
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);

  const send = async() => {
    if(!input.trim()||loading) return;
    const txt=input.trim(); setInput(""); setLoading(true);
    setMsgs(p=>[...p,{role:"user",content:txt}]);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,
          system:ag.sys+(ctx?"\n\nContexto: "+ctx:""),
          messages:[...msgs,{role:"user",content:txt}].map(m=>({role:m.role,content:m.content}))})
      });
      const d=await res.json();
      setMsgs(p=>[...p,{role:"assistant",content:d.content?.[0]?.text||"Sem resposta."}]);
    } catch{ setMsgs(p=>[...p,{role:"assistant",content:"Erro de conexão."}]); }
    setLoading(false);
  };

  return <>
    <button onClick={()=>setOpen(true)} title={ag.desc}
      style={{position:"fixed",bottom:24,right:24,zIndex:100,width:52,height:52,borderRadius:"50%",background:C.accent,border:"none",cursor:"pointer",fontSize:22,boxShadow:`0 4px 20px ${C.accent}66`,display:"flex",alignItems:"center",justifyContent:"center"}}>
      {ag.emoji}
    </button>
    {open&&<div style={{position:"fixed",bottom:86,right:24,zIndex:100,width:360,background:C.card,border:`1px solid ${C.border}`,borderRadius:16,boxShadow:"0 8px 40px #00000088",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:"13px 16px",background:C.surface,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontSize:13,fontWeight:700,color:C.text}}>{ag.emoji} {ag.nome}</div><div style={{fontSize:11,color:C.muted}}>{ag.desc}</div></div>
        <button onClick={()=>setOpen(false)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16}}>✕</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:14,display:"flex",flexDirection:"column",gap:10,minHeight:260,maxHeight:340}}>
        {msgs.length===0&&<div style={{textAlign:"center",padding:"24px 16px"}}><div style={{fontSize:28,marginBottom:8}}>{ag.emoji}</div><div style={{fontSize:13,color:C.muted}}>Sou o {ag.nome}.<br/>{ag.desc}</div></div>}
        {msgs.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
          <div style={{maxWidth:"82%",padding:"9px 13px",borderRadius:m.role==="user"?"12px 12px 2px 12px":"12px 12px 12px 2px",background:m.role==="user"?C.accent:C.surface,color:m.role==="user"?C.white:C.text,fontSize:13,lineHeight:1.55,whiteSpace:"pre-wrap"}}>{m.content}</div>
        </div>)}
        {loading&&<div style={{display:"flex"}}><div style={{background:C.surface,borderRadius:"12px 12px 12px 2px",padding:"9px 14px",color:C.muted,fontSize:13}}>digitando...</div></div>}
        <div ref={endRef}/>
      </div>
      <div style={{padding:"10px 12px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Pergunte algo..."
          style={{flex:1,padding:"8px 12px",borderRadius:8,border:`1px solid ${C.border}`,background:C.surface,color:C.text,fontSize:13,outline:"none"}}/>
        <button onClick={send} disabled={loading} style={{padding:"8px 14px",borderRadius:8,border:"none",background:C.accent,color:C.white,cursor:"pointer",fontSize:13,fontWeight:700,opacity:loading?0.6:1}}>↑</button>
      </div>
    </div>}
  </>;
};
