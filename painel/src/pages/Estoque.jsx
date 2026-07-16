import { useState, useEffect } from "react";
import { C, STATUS_DEF } from "../theme";
import { supabase } from "../lib/supabase";
import { useDB, useRT } from "../lib/hooks";
import { Badge, Avatar, KpiCard, Sec, Pill, Btn, Inp, Sel, Txta, DTable, Modal, Toast, Empty } from "../components/ui";

// ESTOQUE
export const Estoque = ({toast}) => {
  const [modal,setModal]   = useState(false);
  const [modalMov,setModalMov] = useState(false);
  const [sel,setSel]       = useState(null);
  const [filtro,setFiltro] = useState("Todos");
  const [saving,setSaving] = useState(false);
  const blank = {nome:"",sku:"",categoria:"Fixação",qtd_atual:0,qtd_minima:0,unidade:"unid",fornecedor:"",preco_unitario:"",localizacao:""};
  const [form,setForm]     = useState(blank);
  const [mov,setMov]       = useState({estoque_id:"",tipo:"entrada",quantidade:1,motivo:""});
  const {data,loading,refetch} = useDB("estoque_status",q=>q.select("*").order("nome"));
  const rows = data.filter(e=>filtro==="Todos"||e.status===filtro||e.categoria===filtro);
  const f = v=>({...form,...v});
  const criticos = data.filter(e=>e.status==="Crítico").length;
  const alertas  = data.filter(e=>e.status==="Alerta").length;

  const salvar = async() => {
    if(!form.nome) return toast("Nome obrigatório.","error");
    setSaving(true);
    const pay = {...form,qtd_atual:parseInt(form.qtd_atual)||0,qtd_minima:parseInt(form.qtd_minima)||0,preco_unitario:form.preco_unitario?parseFloat(form.preco_unitario):null};
    const {error} = sel
      ? await supabase.from("estoque").update({...pay,updated_at:new Date().toISOString()}).eq("id",sel.id)
      : await supabase.from("estoque").insert([pay]);
    if(error) toast("Erro: "+error.message,"error");
    else { toast("Salvo!","success"); setModal(false); setSel(null); setForm(blank); refetch(); }
    setSaving(false);
  };

  const regMov = async() => {
    if(!mov.estoque_id||!mov.quantidade) return toast("Selecione item e quantidade.","error");
    setSaving(true);
    const {error} = await supabase.from("estoque_movimentos").insert([{...mov,quantidade:parseInt(mov.quantidade)}]);
    if(error) toast("Erro: "+error.message,"error");
    else { toast("Movimentação registrada!","success"); setModalMov(false); setMov({estoque_id:"",tipo:"entrada",quantidade:1,motivo:""}); refetch(); }
    setSaving(false);
  };

  return <div style={{padding:24}}>
    {modal&&<Modal title={sel?"Editar Item":"Novo Item de Estoque"} onClose={()=>{setModal(false);setSel(null);}}>
      <Inp label="Nome do Item" value={form.nome} onChange={v=>setForm(f({nome:v}))} required/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}>
        <Inp label="SKU / Código" value={form.sku} onChange={v=>setForm(f({sku:v}))}/>
        <Sel label="Categoria" value={form.categoria} onChange={v=>setForm(f({categoria:v}))} options={["Fixação","Ferragem","Suporte","Ferramenta","Consumível","Outro"]}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:12}}>
        <Inp label="Qtd. Atual" value={form.qtd_atual.toString()} onChange={v=>setForm(f({qtd_atual:v}))} type="number"/>
        <Inp label="Qtd. Mínima" value={form.qtd_minima.toString()} onChange={v=>setForm(f({qtd_minima:v}))} type="number"/>
        <Inp label="Unidade" value={form.unidade} onChange={v=>setForm(f({unidade:v}))} placeholder="unid, kg..."/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}>
        <Inp label="Fornecedor" value={form.fornecedor} onChange={v=>setForm(f({fornecedor:v}))}/>
        <Inp label="Preço Unit. (R$)" value={form.preco_unitario} onChange={v=>setForm(f({preco_unitario:v}))} type="number"/>
      </div>
      <Inp label="Localização (prateleira)" value={form.localizacao} onChange={v=>setForm(f({localizacao:v}))} placeholder="Ex: Prateleira A3"/>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <Btn variant="ghost" onClick={()=>{setModal(false);setSel(null);}}>Cancelar</Btn>
        <Btn onClick={salvar} disabled={saving}>{saving?"Salvando...":"Salvar"}</Btn>
      </div>
    </Modal>}
    {modalMov&&<Modal title="Registrar Movimentação" onClose={()=>setModalMov(false)}>
      <Sel label="Item" value={mov.estoque_id} onChange={v=>setMov({...mov,estoque_id:v})} required options={[{value:"",label:"Selecione..."},...data.map(e=>({value:e.id,label:e.nome}))]}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}>
        <Sel label="Tipo" value={mov.tipo} onChange={v=>setMov({...mov,tipo:v})} options={["entrada","saida","ajuste","perda"]}/>
        <Inp label="Quantidade" value={mov.quantidade.toString()} onChange={v=>setMov({...mov,quantidade:v})} type="number"/>
      </div>
      <Inp label="Motivo" value={mov.motivo} onChange={v=>setMov({...mov,motivo:v})} placeholder="Ex: Reposição, OS-XXXX..."/>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <Btn variant="ghost" onClick={()=>setModalMov(false)}>Cancelar</Btn>
        <Btn onClick={regMov} disabled={saving}>{saving?"Salvando...":"Confirmar"}</Btn>
      </div>
    </Modal>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14,marginBottom:22}}>
      <KpiCard label="Total de Itens" value={data.length} color={C.blue} icon="📦"/>
      <KpiCard label="Críticos" value={criticos} sub="Abaixo do mínimo" color={C.accent} icon="⚠️"/>
      <KpiCard label="Em Alerta" value={alertas} sub="Próximo do mínimo" color={C.yellow} icon="🔔"/>
    </div>
    {criticos>0&&<div style={{background:"#2A1520",border:`1px solid ${C.accent}33`,borderRadius:10,padding:"11px 16px",marginBottom:14,fontSize:13,color:C.accent}}>⚠️ <strong>Crítico:</strong> {data.filter(e=>e.status==="Crítico").map(e=>e.nome).join(" · ")}</div>}
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
      <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
        {["Todos","OK","Alerta","Crítico","Zerado","Fixação","Ferragem","Suporte","Ferramenta"].map(c=><Pill key={c} label={c} active={filtro===c} onClick={()=>setFiltro(c)}/>)}
      </div>
      <div style={{display:"flex",gap:8}}>
        <Btn variant="ghost" onClick={()=>setModalMov(true)}>± Movimentar</Btn>
        <Btn onClick={()=>{setSel(null);setForm(blank);setModal(true);}}>+ Novo Item</Btn>
      </div>
    </div>
    <DTable loading={loading} cols={["Produto","SKU","Categoria","Qtd.","Mínimo","Cobertura","Status","Ações"]}
      rows={rows.map(e=>({_raw:e,cells:[
        <span style={{fontWeight:600}}>{e.nome}</span>,
        <span style={{fontFamily:"monospace",fontSize:12,color:C.muted}}>{e.sku||"—"}</span>,
        <span style={{fontSize:12,color:C.muted}}>{e.categoria}</span>,
        <span style={{fontWeight:700,color:["Crítico","Zerado"].includes(e.status)?C.accent:e.status==="Alerta"?C.yellow:C.green}}>{e.qtd_atual}</span>,
        <span style={{fontSize:12,color:C.muted}}>{e.qtd_minima}</span>,
        <span style={{fontSize:12,color:C.muted}}>{e.cobertura_dias||0} dias</span>,
        <Badge status={e.status}/>,
        <Btn variant="ghost" small onClick={ev=>{ev.stopPropagation();setSel(e);setForm({nome:e.nome,sku:e.sku||"",categoria:e.categoria,qtd_atual:e.qtd_atual,qtd_minima:e.qtd_minima,unidade:e.unidade||"unid",fornecedor:e.fornecedor||"",preco_unitario:e.preco_unitario?.toString()||"",localizacao:e.localizacao||""});setModal(true);}}>Editar</Btn>
      ]}))}
    />
  </div>;
};

