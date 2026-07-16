import { useState, useEffect } from "react";
import { C, STATUS_DEF } from "../theme";
import { supabase } from "../lib/supabase";
import { useDB, useRT } from "../lib/hooks";
import { Badge, Avatar, KpiCard, Sec, Pill, Btn, Inp, Sel, Txta, DTable, Modal, Toast, Empty } from "../components/ui";

export const Dashboard = () => {
  const [resumo,setResumo]     = useState({});
  const [osHoje,setOsHoje]     = useState([]);
  const [monts,setMonts]       = useState([]);
  const [loading,setLoading]   = useState(true);

  const load = async() => {
    setLoading(true);
    const hoje = new Date().toISOString().split("T")[0];
    const [{data:r},{data:os},{data:m}] = await Promise.all([
      supabase.rpc("dashboard_resumo"),
      supabase.from("ordens_servico").select("id,numero,status,prioridade,hora_agendada,bairro,clientes(nome),produtos(nome),montadores(nome)").eq("data_agendada",hoje).order("hora_agendada"),
      supabase.from("montadores").select("id,nome,status,nps_medio,total_os").eq("ativo",true).neq("status","Inativo"),
    ]);
    setResumo(r||{}); setOsHoje(os||[]); setMonts(m||[]);
    setLoading(false);
  };
  useEffect(()=>{load();},[]);
  useRT("ordens_servico",load);
  useRT("montadores",load);

  const kpis=[
    {label:"OS Hoje",       value:loading?"—":resumo.os_hoje||0,         sub:"Ordens do dia",        color:C.blue,  icon:"📋"},
    {label:"Concluídas",    value:loading?"—":resumo.concluidas||0,       sub:"Com sucesso",           color:C.green, icon:"✅"},
    {label:"Em Assistência",value:loading?"—":resumo.assistencias||0,     sub:"Requerem ação",        color:C.accent,icon:"⚠️"},
    {label:"NPS Médio",     value:loading?"—":resumo.nps_medio||"—",      sub:"Últimos 30 dias",      color:C.yellow,icon:"⭐"},
    {label:"Montadores",    value:loading?"—":resumo.montadores_ativos||0, sub:"Ativos hoje",          color:C.purple,icon:"👷"},
    {label:"Atrasadas",     value:loading?"—":resumo.atrasadas||0,        sub:"Sem check-in",         color:C.orange,icon:"⏱"},
    {label:"Em Andamento",  value:loading?"—":resumo.em_andamento||0,     sub:"Em rota ou montagem",  color:C.blue,  icon:"🔄"},
    {label:"Estoque Crítico",value:loading?"—":resumo.estoque_critico||0, sub:"Abaixo do mínimo",     color:C.accent,icon:"📦"},
  ];

  return <div style={{padding:24}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14,marginBottom:14}}>
      {kpis.slice(0,4).map(k=><KpiCard key={k.label} {...k}/>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14,marginBottom:22}}>
      {kpis.slice(4).map(k=><KpiCard key={k.label} {...k}/>)}
    </div>
    {(resumo.atrasadas>0||resumo.assistencias>0||resumo.estoque_critico>0)&&(
      <div style={{background:"#2A1000",border:`1px solid ${C.orange}33`,borderRadius:10,padding:"11px 16px",marginBottom:22,display:"flex",gap:10,alignItems:"center"}}>
        <span style={{fontSize:18}}>⚠️</span>
        <span style={{fontSize:13,color:C.text}}>
          <strong style={{color:C.orange}}>Ação necessária:</strong>
          {resumo.atrasadas>0&&` ${resumo.atrasadas} OS atrasada(s).`}
          {resumo.assistencias>0&&` ${resumo.assistencias} assistência(s) em aberto.`}
          {resumo.estoque_critico>0&&` ${resumo.estoque_critico} item(ns) crítico(s).`}
        </span>
      </div>
    )}
    <Sec>OS em Andamento — Hoje</Sec>
    <DTable loading={loading}
      cols={["OS","Cliente","Produto","Montador","Bairro","Hora","Status"]}
      rows={osHoje.map(o=>({_raw:o,cells:[
        <span style={{color:C.accent,fontWeight:700,fontSize:12}}>{o.numero}</span>,
        o.clientes?.nome||"—",
        <span style={{fontSize:12,color:C.muted}}>{o.produtos?.nome||"—"}</span>,
        <span style={{fontSize:12}}>{o.montadores?.nome?.split(" ")[0]||"—"}</span>,
        <span style={{fontSize:12,color:C.muted}}>{o.bairro||"—"}</span>,
        <span style={{fontWeight:700}}>{o.hora_agendada?.slice(0,5)||"—"}</span>,
        <Badge status={o.status}/>,
      ]}))}
    />
    <Sec>Montadores Hoje</Sec>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12}}>
      {loading&&<div style={{gridColumn:"1/-1",textAlign:"center",color:C.muted,padding:20}}>Carregando...</div>}
      {monts.map(m=>{
        const cor=m.status==="Atrasado"?C.accent:m.status==="Em Campo"?C.green:m.status==="Em Rota"?C.yellow:C.muted;
        return <div key={m.id} style={{background:C.card,border:`1px solid ${m.status==="Atrasado"?C.accent+"55":C.border}`,borderRadius:12,padding:16,display:"flex",flexDirection:"column",alignItems:"center",gap:7}}>
          <Avatar i={m.nome.substring(0,2).toUpperCase()} size={44} color={cor}/>
          <div style={{fontSize:12,fontWeight:700,color:C.text,textAlign:"center"}}>{m.nome.split(" ")[0]}</div>
          <div style={{fontSize:11,color:C.muted}}>{m.total_os||0} OS · NPS {m.nps_medio||"—"}</div>
          <span style={{fontSize:10,color:cor,fontWeight:700,background:cor+"18",padding:"2px 9px",borderRadius:20}}>{m.status}</span>
        </div>;
      })}
    </div>
  </div>;
};
