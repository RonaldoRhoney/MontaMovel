import { useState, useEffect } from "react";
import { C, STATUS_DEF } from "../theme";
import { supabase } from "../lib/supabase";
import { useDB, useRT } from "../lib/hooks";
import { Badge, Avatar, KpiCard, Sec, Pill, Btn, Inp, Sel, Txta, DTable, Modal, Toast, Empty } from "../components/ui";

// PRODUTOS
export const Produtos = ({toast}) => {
  const [modal,setModal]   = useState(false);
  const [sel,setSel]       = useState(null);
  const [filtro,setFiltro] = useState("Todos");
  const [saving,setSaving] = useState(false);
  const blank = {nome:"",sku:"",categoria:"guarda-roupa",complexidade:"simples",tempo_estimado:"",descricao:""};
  const [form,setForm]     = useState(blank);
  const {data,loading,refetch} = useDB("produtos",q=>q.select("*").eq("ativo",true).order("nome"));
  const cats = ["Todos","guarda-roupa","cozinha","escritorio","sala","quarto","banheiro","varanda","externo","outro"];
  const rows = data.filter(p=>filtro==="Todos"||p.categoria===filtro);
  const f = v=>({...form,...v});

  const salvar = async() => {
    if(!form.nome) return toast("Nome é obrigatório.","error");
    setSaving(true);
    const pay = {...form,tempo_estimado:form.tempo_estimado?parseInt(form.tempo_estimado):null};
    const {error} = sel
      ? await supabase.from("produtos").update({...pay,updated_at:new Date().toISOString()}).eq("id",sel.id)
      : await supabase.from("produtos").insert([pay]);
    if(error) toast("Erro: "+error.message,"error");
    else { toast(sel?"Atualizado!":"Cadastrado!","success"); setModal(false); setSel(null); refetch(); }
    setSaving(false);
  };
  const editar = p => { setSel(p); setForm({nome:p.nome,sku:p.sku||"",categoria:p.categoria,complexidade:p.complexidade,tempo_estimado:p.tempo_estimado?.toString()||"",descricao:p.descricao||""}); setModal(true); };
  const excluir = async id => { if(!confirm("Desativar?")) return; await supabase.from("produtos").update({ativo:false}).eq("id",id); toast("Desativado.","info"); refetch(); };

  return <div style={{padding:24}}>
    {modal&&<Modal title={sel?"Editar Produto":"Novo Produto"} onClose={()=>{setModal(false);setSel(null);}}>
      <Inp label="Nome do Produto / Móvel" value={form.nome} onChange={v=>setForm(f({nome:v}))} required placeholder="Ex: Guarda-Roupa 6 Portas"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Inp label="SKU / Código" value={form.sku} onChange={v=>setForm(f({sku:v}))} placeholder="GR-001"/>
        <Sel label="Categoria" value={form.categoria} onChange={v=>setForm(f({categoria:v}))} options={["guarda-roupa","cozinha","escritorio","sala","quarto","banheiro","varanda","externo","outro"]} required/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Sel label="Complexidade" value={form.complexidade} onChange={v=>setForm(f({complexidade:v}))} options={["simples","media","complexa","especial"]}/>
        <Inp label="Tempo Estimado (min)" value={form.tempo_estimado} onChange={v=>setForm(f({tempo_estimado:v}))} type="number" placeholder="90"/>
      </div>
      <Txta label="Descrição / Observações" value={form.descricao} onChange={v=>setForm(f({descricao:v}))} placeholder="Instruções, ferramentas necessárias..."/>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <Btn variant="ghost" onClick={()=>{setModal(false);setSel(null);}}>Cancelar</Btn>
        <Btn onClick={salvar} disabled={saving}>{saving?"Salvando...":"Salvar"}</Btn>
      </div>
    </Modal>}
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}>
      <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{cats.map(c=><Pill key={c} label={c.charAt(0).toUpperCase()+c.slice(1)} active={filtro===c} onClick={()=>setFiltro(c)}/>)}</div>
      <Btn onClick={()=>{setSel(null);setForm(blank);setModal(true);}}>+ Novo Produto</Btn>
    </div>
    <DTable loading={loading} cols={["Produto","SKU","Categoria","Complexidade","Tempo Est.","Ações"]}
      rows={rows.map(p=>({_raw:p,cells:[
        <span style={{fontWeight:600}}>{p.nome}</span>,
        <span style={{fontFamily:"monospace",fontSize:12,color:C.muted}}>{p.sku||"—"}</span>,
        <span style={{fontSize:12,color:C.muted}}>{p.categoria}</span>,
        <Badge status={{simples:"OK",media:"Alerta",complexa:"Crítico",especial:"Em Assistência"}[p.complexidade]||"OK"}/>,
        <span style={{fontSize:12,color:C.muted}}>{p.tempo_estimado?p.tempo_estimado+" min":"—"}</span>,
        <div style={{display:"flex",gap:6}}>
          <Btn variant="ghost" small onClick={e=>{e.stopPropagation();editar(p);}}>Editar</Btn>
          <Btn variant="danger" small onClick={e=>{e.stopPropagation();excluir(p.id);}}>Remover</Btn>
        </div>
      ]}))}
    />
  </div>;
};
