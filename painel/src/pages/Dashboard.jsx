import { useState, useEffect } from "react";
import {
  ClipboardList, CheckCircle2, AlertTriangle, Star, HardHat,
  Timer, RefreshCcw, PackageX,
} from "lucide-react";
import { C, STATUS_DEF } from "../theme";
import { supabase } from "../lib/supabase";
import { useRT } from "../lib/hooks";
import { Badge, Avatar, KpiCard, Sec, DTable } from "../components/ui";

const StatusBreakdown = ({ osHoje, loading }) => {
  const contagem = {};
  osHoje.forEach(o => { contagem[o.status] = (contagem[o.status]||0)+1; });
  const total = osHoje.length;
  const entradas = Object.entries(contagem).sort((a,b)=>b[1]-a[1]);

  if (loading) return <div className="mm-skeleton" style={{height:64,borderRadius:14}}/>;
  if (total===0) return null;

  return (
    <div className="mm-animate-in" style={{background:C.gradSurface,border:`1px solid ${C.border}`,borderRadius:14,padding:"18px 20px",marginBottom:22,boxShadow:C.shadowSm}}>
      <div style={{fontSize:12,color:C.muted,fontWeight:600,marginBottom:12}}>Status das OS de hoje ({total})</div>
      <div style={{display:"flex",height:8,borderRadius:6,overflow:"hidden",gap:2,marginBottom:14}}>
        {entradas.map(([status,n])=>{
          const cor = (STATUS_DEF[status]||{}).dot || C.muted;
          return <div key={status} title={`${status}: ${n}`} style={{width:`${(n/total)*100}%`,background:cor,minWidth:3,transition:"width 0.4s ease"}}/>;
        })}
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:"8px 18px"}}>
        {entradas.map(([status,n])=>{
          const cor = (STATUS_DEF[status]||{}).dot || C.muted;
          return <div key={status} style={{display:"flex",alignItems:"center",gap:6,fontSize:12}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:cor,boxShadow:`0 0 5px ${cor}`}}/>
            <span style={{color:C.text,fontWeight:600}}>{n}</span>
            <span style={{color:C.muted}}>{status}</span>
          </div>;
        })}
      </div>
    </div>
  );
};

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
    {label:"OS Hoje",       value:loading?"—":resumo.os_hoje||0,         sub:"Ordens do dia",        color:C.blue,  icon:ClipboardList},
    {label:"Concluídas",    value:loading?"—":resumo.concluidas||0,       sub:"Com sucesso",           color:C.green, icon:CheckCircle2},
    {label:"Em Assistência",value:loading?"—":resumo.assistencias||0,     sub:"Requerem ação",        color:C.accent,icon:AlertTriangle},
    {label:"NPS Médio",     value:loading?"—":resumo.nps_medio||"—",      sub:"Últimos 30 dias",      color:C.yellow,icon:Star},
    {label:"Montadores",    value:loading?"—":resumo.montadores_ativos||0, sub:"Ativos hoje",          color:C.purple,icon:HardHat},
    {label:"Atrasadas",     value:loading?"—":resumo.atrasadas||0,        sub:"Sem check-in",         color:C.orange,icon:Timer},
    {label:"Em Andamento",  value:loading?"—":resumo.em_andamento||0,     sub:"Em rota ou montagem",  color:C.blue,  icon:RefreshCcw},
    {label:"Estoque Crítico",value:loading?"—":resumo.estoque_critico||0, sub:"Abaixo do mínimo",     color:C.accent,icon:PackageX},
  ];

  return <div style={{padding:24}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14,marginBottom:14}}>
      {kpis.slice(0,4).map((k,i)=><div key={k.label} style={{animationDelay:`${i*40}ms`}}><KpiCard {...k}/></div>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14,marginBottom:22}}>
      {kpis.slice(4).map((k,i)=><div key={k.label} style={{animationDelay:`${(i+4)*40}ms`}}><KpiCard {...k}/></div>)}
    </div>

    <StatusBreakdown osHoje={osHoje} loading={loading}/>

    {(resumo.atrasadas>0||resumo.assistencias>0||resumo.estoque_critico>0)&&(
      <div className="mm-animate-in" style={{background:"linear-gradient(135deg,#2A1000,#1c0d02)",border:`1px solid ${C.orange}33`,borderRadius:12,padding:"12px 18px",marginBottom:22,display:"flex",gap:12,alignItems:"center",boxShadow:C.shadowSm}}>
        <span style={{width:32,height:32,borderRadius:9,background:C.orange+"1c",display:"flex",alignItems:"center",justifyContent:"center",color:C.orange,flexShrink:0}}><AlertTriangle size={16}/></span>
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
      {loading&&[0,1,2,3].map(i=><div key={i} className="mm-skeleton" style={{height:120,borderRadius:12}}/>)}
      {!loading&&monts.map(m=>{
        const cor=m.status==="Atrasado"?C.accent:m.status==="Em Campo"?C.green:m.status==="Em Rota"?C.yellow:C.muted;
        return <div key={m.id} className="mm-card-hover mm-animate-in" style={{background:C.gradSurface,border:`1px solid ${m.status==="Atrasado"?C.accent+"55":C.border}`,borderRadius:14,padding:16,display:"flex",flexDirection:"column",alignItems:"center",gap:7,boxShadow:C.shadowSm}}>
          <Avatar i={m.nome.substring(0,2).toUpperCase()} size={44} color={cor}/>
          <div style={{fontSize:12,fontWeight:700,color:C.text,textAlign:"center"}}>{m.nome.split(" ")[0]}</div>
          <div style={{fontSize:11,color:C.muted}}>{m.total_os||0} OS · NPS {m.nps_medio||"—"}</div>
          <span style={{fontSize:10,color:cor,fontWeight:700,background:cor+"18",padding:"2px 9px",borderRadius:20}}>{m.status}</span>
        </div>;
      })}
    </div>
  </div>;
};
