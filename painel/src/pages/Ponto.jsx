import { useState, useEffect } from "react";
import { C, STATUS_DEF } from "../theme";
import { supabase } from "../lib/supabase";
import { useDB, useRT } from "../lib/hooks";
import { Badge, Avatar, KpiCard, Sec, Pill, Btn, Inp, Sel, Txta, DTable, Modal, Toast, Empty } from "../components/ui";

// PONTO
export const Ponto = () => {
  const hoje = new Date().toISOString().split("T")[0];
  const {data,loading} = useDB("ponto_registros",q=>q.select("*,montadores(nome)").eq("data",hoje).order("hora_registro"));
  const map = {};
  data.forEach(r=>{
    const n=r.montadores?.nome||r.montador_id;
    if(!map[n]) map[n]={nome:n,e:null,si:null,ri:null,s:null,lat:null};
    if(r.tipo==="entrada"){map[n].e=r.hora_registro;map[n].lat=r.latitude;}
    if(r.tipo==="saida_intervalo") map[n].si=r.hora_registro;
    if(r.tipo==="retorno_intervalo") map[n].ri=r.hora_registro;
    if(r.tipo==="saida") map[n].s=r.hora_registro;
  });
  const linhas = Object.values(map);
  const fmt = ts=>ts?new Date(ts).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}):"—";
  const hrs = m=>{
    if(!m.e) return "0h";
    const e=new Date(m.e),s=m.s?new Date(m.s):new Date();
    const p=m.si&&m.ri?(new Date(m.ri)-new Date(m.si))/60000:0;
    const mn=Math.round((s-e)/60000-p);
    return `${Math.floor(mn/60)}h ${mn%60}m`;
  };
  return <div style={{padding:24}}>
    <div style={{background:"#1B2A1A",border:`1px solid ${C.green}33`,borderRadius:10,padding:"11px 16px",marginBottom:18,fontSize:12,color:C.green}}>
      ✅ <strong>Portaria MTE 671/2021 (REP-P):</strong> Registros imutáveis com GPS, hash AFD e assinatura PAdES. Dados exportáveis para eSocial.
    </div>
    <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginBottom:14}}>
      <Btn variant="ghost">⬇ Espelho PDF</Btn>
      <Btn variant="ghost">⬇ AFD</Btn>
      <Btn variant="ghost">⬇ AEJ</Btn>
    </div>
    {linhas.filter(m=>!m.e).length>0&&<div style={{background:"#2A1000",border:`1px solid ${C.orange}33`,borderRadius:10,padding:"11px 16px",marginBottom:14,fontSize:13,color:C.orange}}>
      ⏱ <strong>Sem check-in:</strong> {linhas.filter(m=>!m.e).map(m=>m.nome.split(" ")[0]).join(", ")}
    </div>}
    <DTable loading={loading} cols={["Montador","Check-in","Pausa","Retorno","Check-out","Total","GPS","Status"]}
      rows={linhas.map(m=>({_raw:m,cells:[
        <span style={{fontWeight:600}}>{m.nome}</span>,
        <span style={{color:m.e?C.green:C.accent,fontWeight:700}}>{fmt(m.e)}</span>,
        <span style={{fontSize:12,color:C.muted}}>{fmt(m.si)}</span>,
        <span style={{fontSize:12,color:C.muted}}>{fmt(m.ri)}</span>,
        <span style={{fontSize:12,color:C.muted}}>{fmt(m.s)}</span>,
        <span style={{fontWeight:700}}>{hrs(m)}</span>,
        <span style={{fontSize:10,fontFamily:"monospace",color:C.muted}}>{m.lat?m.lat.toFixed(4)+"...":"—"}</span>,
        <Badge status={m.e?"Em Montagem":"Atrasada"}/>,
      ]}))}
    />
  </div>;
};

