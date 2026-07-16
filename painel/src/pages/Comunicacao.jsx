import { useState, useEffect } from "react";
import { C, STATUS_DEF } from "../theme";
import { supabase } from "../lib/supabase";
import { useDB, useRT } from "../lib/hooks";
import { Badge, Avatar, KpiCard, Sec, Pill, Btn, Inp, Sel, Txta, DTable, Modal, Toast, Empty } from "../components/ui";

// COMUNICAÇÃO
export const Comunicacao = () => {
  const [tab,setTab] = useState("fluxos");
  const {data:logs,loading} = useDB("comunicacoes_log",q=>
    q.select("*,ordens_servico(numero),clientes(nome)").order("created_at",{ascending:false}).limit(100)
  );
  const total=logs.length;
  const entregues=logs.filter(l=>l.status==="entregue"||l.status==="lido").length;
  const taxa=total?Math.round(entregues/total*100):0;
  const fluxos=[
    {n:"Confirmação de Agendamento",t:"WhatsApp",d:247,e:"99.2%",s:"Ativo"},
    {n:"Lembrete 24h antes",t:"WhatsApp",d:198,e:"98.8%",s:"Ativo"},
    {n:"Montador em Rota",t:"WhatsApp",d:180,e:"99.4%",s:"Ativo"},
    {n:"NPS pós-montagem",t:"WhatsApp",d:156,e:"97.1%",s:"Ativo"},
    {n:"Fluxo de Assistência",t:"WhatsApp",d:31,e:"98.0%",s:"Ativo"},
    {n:"Agendamento Self-service (Bot)",t:"WhatsApp",d:44,e:"95.5%",s:"Beta"},
    {n:"Comprovante de Conclusão",t:"E-mail",d:198,e:"99.8%",s:"Ativo"},
    {n:"Relatório Gerencial Semanal",t:"E-mail",d:4,e:"100%",s:"Ativo"},
    {n:"Alerta OS Crítica (Gestor)",t:"E-mail",d:12,e:"100%",s:"Ativo"},
    {n:"Lembrete Confirmação Pendente",t:"WhatsApp",d:22,e:"96.3%",s:"Ativo"},
  ];
  return <div style={{padding:24}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:22}}>
      <KpiCard label="Mensagens (mês)" value={total||"—"} sub="WhatsApp + E-mail" color={C.green} icon="📤"/>
      <KpiCard label="Taxa de Entrega" value={total?taxa+"%":"—"} sub="Meta: 95%" color={C.blue} icon="✅"/>
      <KpiCard label="Respostas Bot" value="—" sub="n8n automático" color={C.purple} icon="💬"/>
    </div>
    <div style={{display:"flex",gap:8,marginBottom:18}}>
      {["fluxos","log","templates"].map(t=><Pill key={t} label={t==="fluxos"?"Fluxos n8n":t==="log"?"Log de Envios":"Templates"} active={tab===t} onClick={()=>setTab(t)}/>)}
      <div style={{marginLeft:"auto"}}><Btn>+ Novo Fluxo</Btn></div>
    </div>
    {tab==="fluxos"&&<div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12}}>
      {fluxos.map((f,i)=><div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontSize:13,color:C.text,fontWeight:600}}>{f.n}</div><div style={{fontSize:11,color:C.muted,marginTop:3}}>{f.t} · {f.d} disparos · {f.e} entregues</div></div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}><Badge status={f.s}/><Btn variant="ghost" small>Editar</Btn></div>
      </div>)}
    </div>}
    {tab==="log"&&<DTable loading={loading} cols={["OS","Cliente","Canal","Tipo","Status","Enviado em"]}
      rows={logs.map((l,i)=>({_raw:l,cells:[
        <span style={{color:C.accent,fontWeight:700,fontSize:12}}>{l.ordens_servico?.numero||"—"}</span>,
        l.clientes?.nome||"—",
        <span style={{color:l.canal==="whatsapp"?C.green:C.blue,fontWeight:600}}>{l.canal}</span>,
        <span style={{fontSize:12,color:C.muted}}>{l.tipo}</span>,
        <Badge status={l.status==="entregue"||l.status==="lido"?"Concluída com Sucesso":l.status==="falhou"?"Em Assistência":"Agendada"}/>,
        <span style={{fontSize:12,color:C.muted}}>{new Date(l.created_at).toLocaleString("pt-BR")}</span>,
      ]}))}
    />}
    {tab==="templates"&&<div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14}}>
      {[
        {n:"Confirmação de Agendamento",p:"Olá {nome}! Montagem agendada para {data} às {hora}. Confirme respondendo SIM. 📦"},
        {n:"Montador em Rota",p:"Oi {nome}! {montador} está a caminho. ETA: {eta} min. 🚚"},
        {n:"NPS pós-montagem",p:"Olá {nome}! Como foi sua experiência? De 0 a 10, qual nota daria?"},
        {n:"Assistência Aberta",p:"{nome}, identificamos um problema: {motivo}. Reagendaremos para {data}. Pedimos desculpas!"},
      ].map((t,i)=><div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:18}}>
        <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:10}}>{t.n}</div>
        <div style={{background:C.surface,borderRadius:8,padding:12,fontSize:12,color:C.text,lineHeight:1.7,fontStyle:"italic"}}>{t.p}</div>
        <div style={{display:"flex",gap:8,marginTop:12}}><Btn variant="ghost" small>Editar</Btn><Btn variant="ghost" small>Testar</Btn></div>
      </div>)}
    </div>}
  </div>;
};
