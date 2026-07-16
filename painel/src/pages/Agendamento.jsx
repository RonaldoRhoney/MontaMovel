import { useState, useEffect } from "react";
import { C, STATUS_DEF } from "../theme";
import { supabase } from "../lib/supabase";
import { useDB, useRT } from "../lib/hooks";
import { Badge, Avatar, KpiCard, Sec, Pill, Btn, Inp, Sel, Txta, DTable, Modal, Toast, Empty } from "../components/ui";

// AGENDAMENTO
export const Agendamento = ({toast}) => {
  const [semana,setSemana] = useState(0);
  const [modal,setModal]   = useState(false);
  const [saving,setSaving] = useState(false);
  const blank = {cliente_id:"",produto_id:"",montador_id:"",data_agendada:"",hora_agendada:"",bairro:"",cidade:"",prioridade:"Normal"};
  const [form,setForm]     = useState(blank);
  const f = v=>({...form,...v});

  const getDias = () => {
    const b=new Date(); b.setDate(b.getDate()-b.getDay()+1+semana*7);
    return Array.from({length:6},(_,i)=>{ const d=new Date(b); d.setDate(d.getDate()+i); return d; });
  };
  const dias = getDias();
  const horarios = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00"];
  const dStr = d=>d.toISOString().split("T")[0];
  const hoje = dStr(new Date());

  const {data:ordens,refetch} = useDB("ordens_servico",q=>
    q.select("id,numero,status,hora_agendada,data_agendada,clientes(nome),montadores(nome)")
      .gte("data_agendada",dStr(dias[0])).lte("data_agendada",dStr(dias[5]))
  ,[semana]);
  const {data:monts}  = useDB("montadores",q=>q.select("id,nome,status").eq("ativo",true).order("nome"));
  const {data:clis}   = useDB("clientes",  q=>q.select("id,nome").eq("ativo",true).order("nome"));
  const {data:prods}  = useDB("produtos",  q=>q.select("id,nome").eq("ativo",true).order("nome"));

  const COR = s=>({
    "Agendada":C.blue,"Confirmada":"#38BDF8","Em Rota":C.yellow,
    "Em Montagem":C.green,"Concluída com Sucesso":"#4ADE80",
    "Em Assistência":C.accent,"Atrasada":C.orange
  }[s]||C.muted);

  const agendar = async() => {
    if(!form.cliente_id||!form.data_agendada||!form.hora_agendada) return toast("Cliente, data e hora são obrigatórios.","error");
    setSaving(true);
    const {error} = await supabase.from("ordens_servico").insert([{...form,numero:"",status:"Agendada"}]);
    if(error) toast("Erro: "+error.message,"error");
    else { toast("Agendado!","success"); setModal(false); setForm(blank); refetch(); }
    setSaving(false);
  };

  return <div style={{padding:24}}>
    {modal&&<Modal title="Novo Agendamento" onClose={()=>setModal(false)} wide>
      <Sel label="Cliente" value={form.cliente_id} onChange={v=>setForm(f({cliente_id:v}))} required options={[{value:"",label:"Selecione..."},...clis.map(c=>({value:c.id,label:c.nome}))]}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Sel label="Produto" value={form.produto_id} onChange={v=>setForm(f({produto_id:v}))} options={[{value:"",label:"Selecionar produto..."},...prods.map(p=>({value:p.id,label:p.nome}))]}/>
        <Sel label="Montador" value={form.montador_id} onChange={v=>setForm(f({montador_id:v}))} options={[{value:"",label:"A definir"},...monts.filter(m=>m.status!=="Inativo").map(m=>({value:m.id,label:m.nome}))]}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
        <Inp label="Data" value={form.data_agendada} onChange={v=>setForm(f({data_agendada:v}))} type="date" required/>
        <Inp label="Hora" value={form.hora_agendada} onChange={v=>setForm(f({hora_agendada:v}))} type="time" required/>
        <Sel label="Prioridade" value={form.prioridade} onChange={v=>setForm(f({prioridade:v}))} options={["Normal","Urgente"]}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Inp label="Bairro" value={form.bairro} onChange={v=>setForm(f({bairro:v}))}/>
        <Inp label="Cidade" value={form.cidade} onChange={v=>setForm(f({cidade:v}))}/>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <Btn variant="ghost" onClick={()=>setModal(false)}>Cancelar</Btn>
        <Btn onClick={agendar} disabled={saving}>{saving?"Agendando...":"Agendar"}</Btn>
      </div>
    </Modal>}

    <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <Btn variant="ghost" onClick={()=>setSemana(s=>s-1)}>◀</Btn>
        <Btn variant="ghost" onClick={()=>setSemana(0)}>Hoje</Btn>
        <Btn variant="ghost" onClick={()=>setSemana(s=>s+1)}>▶</Btn>
        <span style={{fontSize:12,color:C.muted,marginLeft:8}}>{dias[0].toLocaleDateString("pt-BR")} — {dias[5].toLocaleDateString("pt-BR")}</span>
      </div>
      <Btn onClick={()=>setModal(true)}>+ Agendar</Btn>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10,marginBottom:14}}>
      {monts.slice(0,6).map(m=>{
        const cor=m.status==="Em Campo"?C.green:m.status==="Em Rota"?C.yellow:m.status==="Atrasado"?C.accent:C.muted;
        return <div key={m.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 10px",display:"flex",gap:7,alignItems:"center"}}>
          <Avatar i={m.nome.substring(0,2).toUpperCase()} size={26} color={cor}/>
          <div><div style={{fontSize:11,fontWeight:700,color:C.text}}>{m.nome.split(" ")[0]}</div><div style={{fontSize:10,color:cor}}>{m.status}</div></div>
        </div>;
      })}
    </div>

    <div style={{background:C.card,borderRadius:12,border:`1px solid ${C.border}`,overflow:"hidden"}}>
      <div style={{display:"grid",gridTemplateColumns:"72px repeat(6,1fr)",borderBottom:`1px solid ${C.border}`}}>
        <div style={{padding:10,background:C.surface}}/>
        {dias.map(d=>{
          const isH=dStr(d)===hoje;
          return <div key={dStr(d)} style={{padding:"10px 6px",background:isH?C.accent+"22":C.surface,borderLeft:`1px solid ${C.border}`,textAlign:"center"}}>
            <div style={{fontSize:10,color:C.muted,fontWeight:600}}>{d.toLocaleDateString("pt-BR",{weekday:"short"}).toUpperCase()}</div>
            <div style={{fontSize:12,color:isH?C.accent:C.text,fontWeight:700}}>{d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})}</div>
          </div>;
        })}
      </div>
      {horarios.map(h=>(
        <div key={h} style={{display:"grid",gridTemplateColumns:"72px repeat(6,1fr)",borderBottom:`1px solid ${C.border}22`,minHeight:48}}>
          <div style={{padding:"6px 10px",fontSize:11,color:C.muted,fontWeight:600,background:C.surface,borderRight:`1px solid ${C.border}`,display:"flex",alignItems:"flex-start"}}>{h}</div>
          {dias.map(d=>{
            const evs=ordens.filter(o=>dStr(new Date(o.data_agendada))===dStr(d)&&o.hora_agendada?.slice(0,5)===h);
            const isH=dStr(d)===hoje;
            return <div key={dStr(d)} style={{borderLeft:`1px solid ${C.border}22`,padding:3,background:isH?C.accent+"05":"transparent"}}>
              {evs.map(ev=>{
                const cor=COR(ev.status);
                return <div key={ev.id} style={{background:cor+"22",border:`1px solid ${cor}44`,borderLeft:`3px solid ${cor}`,borderRadius:5,padding:"3px 7px",marginBottom:2}}>
                  <div style={{fontSize:9,fontWeight:700,color:cor}}>{ev.numero}</div>
                  <div style={{fontSize:10,color:C.text}}>{ev.clientes?.nome?.split(" ")[0]||"—"}</div>
                  <div style={{fontSize:9,color:C.muted}}>{ev.montadores?.nome?.split(" ")[0]||"—"}</div>
                </div>;
              })}
            </div>;
          })}
        </div>
      ))}
    </div>
  </div>;
};

