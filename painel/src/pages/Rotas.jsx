import { useState, useEffect } from "react";
import { C, STATUS_DEF } from "../theme";
import { supabase } from "../lib/supabase";
import { useDB, useRT } from "../lib/hooks";
import { Badge, Avatar, KpiCard, Sec, Pill, Btn, Inp, Sel, Txta, DTable, Modal, Toast, Empty } from "../components/ui";

// ROTAS
export const Rotas = () => {
  const {data:monts} = useDB("montadores",q=>q.select("id,nome,status").eq("ativo",true).order("nome"));
  const [sel,setSel] = useState(null);
  useEffect(()=>{ if(monts.length&&!sel) setSel(monts[0]); },[monts]);
  const hoje = new Date().toISOString().split("T")[0];
  const {data:osRota} = useDB("ordens_servico",q=>
    sel?q.select("id,numero,status,hora_agendada,bairro,latitude,longitude,clientes(nome)").eq("montador_id",sel.id).eq("data_agendada",hoje).order("hora_agendada"):q.select("id").limit(0)
  ,[sel?.id]);

  return <div style={{padding:24}}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {monts.map(m=><Pill key={m.id} label={m.nome.split(" ")[0]} active={sel?.id===m.id} onClick={()=>setSel(m)}/>)}
      </div>
      <Btn>⚡ Otimizar Rotas</Btn>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:20}}>
      <div>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20,marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:700,color:C.text}}>{sel?.nome||"—"}</div>
          <div style={{fontSize:12,color:C.muted,marginBottom:16}}>{osRota.length} paradas hoje</div>
          {osRota.length===0&&<Empty icon="🗺️" msg="Nenhuma OS hoje"/>}
          {osRota.map((r,i)=>{
            const cor=r.status==="Concluída com Sucesso"?C.green:r.status==="Em Montagem"||r.status==="Em Assistência"?C.accent:C.border;
            return <div key={r.id} style={{display:"flex",gap:12,marginBottom:8}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                <div style={{width:26,height:26,borderRadius:"50%",background:cor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:C.white,flexShrink:0}}>{i+1}</div>
                {i<osRota.length-1&&<div style={{width:1,height:28,background:C.border}}/>}
              </div>
              <div style={{flex:1,paddingTop:3}}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:12,color:C.accent,fontWeight:700}}>{r.numero}</span>
                  <span style={{fontSize:11,color:C.muted}}>{r.hora_agendada?.slice(0,5)}</span>
                </div>
                <div style={{fontSize:12,color:C.text}}>{r.clientes?.nome}</div>
                <div style={{fontSize:11,color:C.muted}}>{r.bairro}</div>
                <div style={{marginTop:4}}><Badge status={r.status}/></div>
              </div>
            </div>;
          })}
        </div>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:18}}>
          <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:10}}>Resumo do Dia</div>
          {[["OS Total",osRota.length],["Concluídas",osRota.filter(o=>o.status==="Concluída com Sucesso").length],["Em Andamento",osRota.filter(o=>["Em Rota","Em Montagem"].includes(o.status)).length],["Assistências",osRota.filter(o=>o.status==="Em Assistência").length]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${C.border}22`}}>
              <span style={{fontSize:12,color:C.muted}}>{k}</span>
              <span style={{fontSize:13,fontWeight:700,color:C.text}}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
        <div style={{padding:"13px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:13,fontWeight:700,color:C.text}}>Mapa em Tempo Real</span>
          <div style={{display:"flex",gap:8}}>
            <Btn variant="ghost" small>Satélite</Btn>
            <Btn variant="ghost" small>Trânsito</Btn>
          </div>
        </div>
        <div style={{height:420,background:"linear-gradient(135deg,#0F1117 0%,#181C27 100%)",position:"relative",overflow:"hidden"}}>
          {[0,1,2,3,4].map(i=><span key={i}>
            <div style={{position:"absolute",top:`${20+i*16}%`,left:0,right:0,height:1,background:C.border+"44"}}/>
            <div style={{position:"absolute",left:`${15+i*18}%`,top:0,bottom:0,width:1,background:C.border+"44"}}/>
          </span>)}
          {osRota.map((r,i)=>{
            const tops=["20%","44%","60%","18%","72%"][i];
            const lefts=["62%","50%","32%","75%","45%"][i];
            if(!tops) return null;
            const cor=r.status==="Concluída com Sucesso"?C.green:r.status==="Em Montagem"?C.accent:C.blue;
            return <div key={r.id} style={{position:"absolute",top:tops,left:lefts,transform:"translate(-50%,-50%)"}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:cor,border:"2px solid "+C.white,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:C.white,boxShadow:`0 2px 8px ${cor}88`}}>{i+1}</div>
              <div style={{fontSize:9,color:cor,textAlign:"center",marginTop:2,fontWeight:700,textShadow:"0 1px 3px #000"}}>{r.numero}</div>
            </div>;
          })}
          {sel&&<div style={{position:"absolute",top:"41%",left:"55%",transform:"translate(-50%,-50%)"}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:C.blue,border:"3px solid "+C.white,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,boxShadow:`0 0 0 8px ${C.blue}33`}}>👷</div>
          </div>}
          <div style={{position:"absolute",bottom:14,right:14,background:C.surface+"EE",borderRadius:8,padding:"9px 13px",fontSize:11,border:`1px solid ${C.border}`}}>
            <div style={{color:C.blue,fontWeight:700}}>● {sel?.nome||"—"}</div>
            <div style={{color:C.muted,marginTop:2}}>{new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</div>
          </div>
        </div>
      </div>
    </div>
  </div>;
};

