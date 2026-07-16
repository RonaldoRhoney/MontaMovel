import { useState, useEffect } from "react";
import { C, STATUS_DEF } from "../theme";
import { supabase } from "../lib/supabase";
import { useDB, useRT } from "../lib/hooks";
import { Badge, Avatar, KpiCard, Sec, Pill, Btn, Inp, Sel, Txta, DTable, Modal, Toast, Empty } from "../components/ui";

// ORDENS DE SERVIÇO
export const OS = ({toast}) => {
  const [filtro,setFiltro] = useState("Todas");
  const [busca,setBusca]   = useState("");
  const [detalhe,setDetalhe] = useState(null);
  const [modal,setModal]   = useState(false);
  const [saving,setSaving] = useState(false);
  const blank = {cliente_id:"",produto_id:"",produto_descricao:"",montador_id:"",logradouro:"",numero_end:"",bairro:"",cidade:"",estado:"",cep:"",data_agendada:"",hora_agendada:"",prioridade:"Normal",observacoes:""};
  const [form,setForm]     = useState(blank);
  const STATUS_F = ["Todas","Agendada","Pendente Confirmação","Confirmada","Em Rota","Em Montagem","Concluída com Sucesso","Em Assistência","Reagendada","Atrasada","Cancelada"];

  const {data:ordens,loading,refetch} = useDB("ordens_servico",q=>
    q.select("id,numero,status,prioridade,data_agendada,hora_agendada,bairro,cidade,motivo_assist,nps_score,clientes(nome,telefone),produtos(nome),montadores(nome)").order("data_agendada",{ascending:false}).limit(200)
  );
  const {data:clientes}   = useDB("clientes",  q=>q.select("id,nome").eq("ativo",true).order("nome"));
  const {data:produtos}   = useDB("produtos",  q=>q.select("id,nome").eq("ativo",true).order("nome"));
  const {data:montadores} = useDB("montadores",q=>q.select("id,nome").eq("ativo",true).order("nome"));
  useRT("ordens_servico",refetch);

  const rows = ordens.filter(o=>{
    const mS=filtro==="Todas"||o.status===filtro;
    const mB=!busca||[o.clientes?.nome,o.numero,o.bairro,o.produtos?.nome,o.montadores?.nome].some(v=>v?.toLowerCase().includes(busca.toLowerCase()));
    return mS&&mB;
  });

  const criar = async() => {
    if(!form.cliente_id||!form.data_agendada||!form.hora_agendada) return toast("Cliente, data e hora são obrigatórios.","error");
    setSaving(true);
    const {error} = await supabase.from("ordens_servico").insert([{...form,numero:"",status:"Agendada"}]);
    if(error) toast("Erro: "+error.message,"error");
    else { toast("OS criada!","success"); setModal(false); setForm(blank); refetch(); }
    setSaving(false);
  };

  const avStatus = async(id,status) => {
    await supabase.from("ordens_servico").update({status,updated_at:new Date().toISOString()}).eq("id",id);
    toast("Status → "+status,"success"); refetch();
    if(detalhe?.id===id) setDetalhe(p=>({...p,status}));
  };
  const f = v=>({...form,...v});

  if(detalhe) {
    const o=detalhe;
    const proxStatus={
      "Agendada":["Confirmada","Cancelada"],"Pendente Confirmação":["Confirmada","Cancelada"],
      "Confirmada":["Em Rota","Cancelada"],"Em Rota":["Em Montagem"],
      "Em Montagem":["Concluída com Sucesso","Em Assistência"],"Em Assistência":["Reagendada"],
    }[o.status]||[];
    return <div style={{padding:24}}>
      <div style={{display:"flex",gap:12,marginBottom:22,alignItems:"center"}}>
        <Btn variant="ghost" onClick={()=>setDetalhe(null)}>← Voltar</Btn>
        <span style={{fontSize:20,fontWeight:800,color:C.accent}}>{o.numero}</span>
        <Badge status={o.status}/>
        {o.prioridade==="Urgente"&&<span style={{fontSize:12,color:C.accent,fontWeight:700,background:C.accent+"18",padding:"3px 10px",borderRadius:20}}>🔴 Urgente</span>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:20}}>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:22}}>
          <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:16}}>Dados da OS</div>
          {[["Cliente",o.clientes?.nome],["Produto",o.produtos?.nome||o.produto_descricao],["Montador",o.montadores?.nome],["Endereço",`${o.bairro||"—"} · ${o.cidade||"—"}`],["Data / Hora",`${o.data_agendada} às ${o.hora_agendada?.slice(0,5)}`],["Prioridade",o.prioridade],o.motivo_assist&&["Motivo Assistência",o.motivo_assist]].filter(Boolean).map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${C.border}22`}}>
              <span style={{fontSize:12,color:C.muted}}>{k}</span>
              <span style={{fontSize:13,color:C.text,fontWeight:600}}>{v||"—"}</span>
            </div>
          ))}
          {o.nps_score!=null&&<div style={{marginTop:14,padding:"11px 14px",background:C.green+"11",borderRadius:8,border:`1px solid ${C.green}33`,fontSize:13,color:C.green,fontWeight:700}}>⭐ NPS: {o.nps_score}/10</div>}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {proxStatus.length>0&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:18}}>
            <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:12}}>Avançar Status</div>
            {proxStatus.map(s=><button key={s} onClick={()=>avStatus(o.id,s)}
              style={{width:"100%",padding:"9px 14px",marginBottom:8,borderRadius:8,border:`1px solid ${["Cancelada","Em Assistência"].includes(s)?C.accent+"44":C.border}`,background:"transparent",color:["Cancelada","Em Assistência"].includes(s)?C.accent:C.text,cursor:"pointer",fontSize:13,textAlign:"left"}}>
              → {s}
            </button>)}
          </div>}
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:18}}>
            <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:10}}>Exportar</div>
            <div style={{display:"flex",gap:8}}><Btn variant="ghost" small>PDF</Btn><Btn variant="ghost" small>Comprovante</Btn></div>
          </div>
        </div>
      </div>
    </div>;
  }

  return <div style={{padding:24}}>
    {modal&&<Modal title="Nova Ordem de Serviço" onClose={()=>setModal(false)} wide>
      <Sel label="Cliente" value={form.cliente_id} onChange={v=>setForm(f({cliente_id:v}))} required options={[{value:"",label:"Selecione o cliente..."},...clientes.map(c=>({value:c.id,label:c.nome}))]}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Sel label="Produto (catálogo)" value={form.produto_id} onChange={v=>setForm(f({produto_id:v}))} options={[{value:"",label:"Selecionar produto..."},...produtos.map(p=>({value:p.id,label:p.nome}))]}/>
        <Inp label="Ou descreva o produto" value={form.produto_descricao} onChange={v=>setForm(f({produto_descricao:v}))} placeholder="Produto customizado..."/>
      </div>
      <Sel label="Montador" value={form.montador_id} onChange={v=>setForm(f({montador_id:v}))} options={[{value:"",label:"A definir..."},...montadores.map(m=>({value:m.id,label:m.nome}))]}/>
      <div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:10}}>ENDEREÇO DA MONTAGEM</div>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:12}}>
        <Inp label="Logradouro" value={form.logradouro} onChange={v=>setForm(f({logradouro:v}))}/>
        <Inp label="Número" value={form.numero_end} onChange={v=>setForm(f({numero_end:v}))}/>
        <Inp label="CEP" value={form.cep} onChange={v=>setForm(f({cep:v}))}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
        <Inp label="Bairro" value={form.bairro} onChange={v=>setForm(f({bairro:v}))}/>
        <Inp label="Cidade" value={form.cidade} onChange={v=>setForm(f({cidade:v}))}/>
        <Inp label="Estado" value={form.estado} onChange={v=>setForm(f({estado:v}))} placeholder="PA"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
        <Inp label="Data" value={form.data_agendada} onChange={v=>setForm(f({data_agendada:v}))} type="date" required/>
        <Inp label="Hora" value={form.hora_agendada} onChange={v=>setForm(f({hora_agendada:v}))} type="time" required/>
        <Sel label="Prioridade" value={form.prioridade} onChange={v=>setForm(f({prioridade:v}))} options={["Normal","Urgente"]}/>
      </div>
      <Txta label="Observações" value={form.observacoes} onChange={v=>setForm(f({observacoes:v}))}/>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <Btn variant="ghost" onClick={()=>setModal(false)}>Cancelar</Btn>
        <Btn onClick={criar} disabled={saving}>{saving?"Criando...":"Criar OS"}</Btn>
      </div>
    </Modal>}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{STATUS_F.map(s=><Pill key={s} label={s} active={filtro===s} onClick={()=>setFiltro(s)}/>)}</div>
      <div style={{display:"flex",gap:8,flexShrink:0}}>
        <Btn variant="ghost">⬇ Excel</Btn><Btn variant="ghost">⬇ PDF</Btn>
        <Btn onClick={()=>setModal(true)}>+ Nova OS</Btn>
      </div>
    </div>
    <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar cliente, OS, montador, bairro..."
      style={{width:"100%",padding:"8px 13px",borderRadius:8,border:`1px solid ${C.border}`,background:C.card,color:C.text,fontSize:13,outline:"none",marginBottom:12,boxSizing:"border-box"}}/>
    <div style={{fontSize:12,color:C.muted,marginBottom:10}}>{rows.length} OS encontrada(s)</div>
    <DTable loading={loading} onRowClick={setDetalhe}
      cols={["OS","Cliente","Produto","Montador","Bairro","Data","Hora","Prioridade","Status"]}
      rows={rows.map(o=>({_raw:o,cells:[
        <span style={{color:C.accent,fontWeight:700,fontSize:12}}>{o.numero}</span>,
        <span style={{fontWeight:500}}>{o.clientes?.nome||"—"}</span>,
        <span style={{fontSize:12,color:C.muted}}>{o.produtos?.nome||o.produto_descricao||"—"}</span>,
        <span style={{fontSize:12}}>{o.montadores?.nome?.split(" ")[0]||"—"}</span>,
        <span style={{fontSize:12,color:C.muted}}>{o.bairro||"—"}</span>,
        <span style={{fontSize:12,color:C.muted}}>{o.data_agendada}</span>,
        <span style={{fontWeight:700}}>{o.hora_agendada?.slice(0,5)||"—"}</span>,
        <span style={{fontSize:11,color:o.prioridade==="Urgente"?C.accent:C.muted,fontWeight:700}}>{o.prioridade==="Urgente"?"🔴 Urgente":"Normal"}</span>,
        <Badge status={o.status}/>,
      ]}))}
    />
  </div>;
};
