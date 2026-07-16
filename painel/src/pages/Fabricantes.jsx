import { useState } from "react";
import { Factory, Sparkles } from "lucide-react";
import { C } from "../theme";
import { supabase } from "../lib/supabase";
import { useDB } from "../lib/hooks";
import { Badge, Btn, Inp, Txta, DTable, Modal, Empty } from "../components/ui";

// FABRICANTES
export const Fabricantes = ({toast}) => {
  const [busca,setBusca]     = useState("");
  const [modal,setModal]     = useState(false);
  const [sel,setSel]         = useState(null);
  const [saving,setSaving]   = useState(false);
  const [populando,setPopulando] = useState(false);
  const blank = {nome:"",cnpj:"",site:"",telefone:"",email:"",cidade:"",estado:"",categorias:"",observacoes:""};
  const [form,setForm]       = useState(blank);
  const {data,loading,refetch} = useDB("fabricantes",q=>q.select("*").eq("ativo",true).order("nome"));
  const f = v=>({...form,...v});

  const rows = data.filter(fb=>!busca||[fb.nome,fb.cidade,fb.estado,...(fb.categorias||[])].some(v=>v?.toLowerCase().includes(busca.toLowerCase())));

  const salvar = async() => {
    if(!form.nome) return toast("Nome é obrigatório.","error");
    setSaving(true);
    const pay = {...form,categorias:form.categorias?form.categorias.split(",").map(c=>c.trim()).filter(Boolean):[]};
    const {error} = sel
      ? await supabase.from("fabricantes").update({...pay,updated_at:new Date().toISOString()}).eq("id",sel.id)
      : await supabase.from("fabricantes").insert([pay]);
    if(error) toast("Erro: "+error.message,"error");
    else { toast(sel?"Atualizado!":"Cadastrado!","success"); setModal(false); setSel(null); setForm(blank); refetch(); }
    setSaving(false);
  };

  const editar = fb => { setSel(fb); setForm({nome:fb.nome,cnpj:fb.cnpj||"",site:fb.site||"",telefone:fb.telefone||"",email:fb.email||"",cidade:fb.cidade||"",estado:fb.estado||"",categorias:(fb.categorias||[]).join(", "),observacoes:fb.observacoes||""}); setModal(true); };
  const excluir = async id => { if(!confirm("Desativar?")) return; await supabase.from("fabricantes").update({ativo:false}).eq("id",id); toast("Desativado.","info"); refetch(); };

  const popular = async() => {
    setPopulando(true);
    const {data:n,error} = await supabase.rpc("seed_fabricantes_padrao");
    setPopulando(false);
    if(error) return toast("Erro: "+error.message,"error");
    toast(n>0?`${n} fabricante(s) adicionado(s)!`:"Todos os fabricantes conhecidos já estavam cadastrados.","success");
    refetch();
  };

  return <div style={{padding:24}}>
    {modal&&<Modal title={sel?"Editar Fabricante":"Novo Fabricante"} onClose={()=>{setModal(false);setSel(null);}} wide>
      <Inp label="Nome do Fabricante" value={form.nome} onChange={v=>setForm(f({nome:v}))} required placeholder="Ex: Madesa"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}>
        <Inp label="CNPJ" value={form.cnpj} onChange={v=>setForm(f({cnpj:v}))} placeholder="00.000.000/0001-00"/>
        <Inp label="Site" value={form.site} onChange={v=>setForm(f({site:v}))} placeholder="www.exemplo.com.br"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}>
        <Inp label="Telefone" value={form.telefone} onChange={v=>setForm(f({telefone:v}))}/>
        <Inp label="E-mail" value={form.email} onChange={v=>setForm(f({email:v}))} type="email"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}>
        <Inp label="Cidade" value={form.cidade} onChange={v=>setForm(f({cidade:v}))}/>
        <Inp label="Estado" value={form.estado} onChange={v=>setForm(f({estado:v}))} placeholder="RS"/>
      </div>
      <Inp label="Categorias (separadas por vírgula)" value={form.categorias} onChange={v=>setForm(f({categorias:v}))} placeholder="quarto, cozinha, guarda-roupa"/>
      <Txta label="Observações" value={form.observacoes} onChange={v=>setForm(f({observacoes:v}))}/>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <Btn variant="ghost" onClick={()=>{setModal(false);setSel(null);}}>Cancelar</Btn>
        <Btn onClick={salvar} disabled={saving}>{saving?"Salvando...":"Salvar"}</Btn>
      </div>
    </Modal>}

    <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
      <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar fabricante, cidade, categoria..."
        style={{flex:1,minWidth:200,padding:"9px 13px",borderRadius:9,border:`1px solid ${C.border}`,background:C.card,color:C.text,fontSize:13,outline:"none"}}/>
      <Btn variant="ghost" onClick={popular} disabled={populando}><Sparkles size={14}/>{populando?"Populando...":"Popular com fabricantes conhecidos"}</Btn>
      <Btn onClick={()=>{setSel(null);setForm(blank);setModal(true);}}>+ Novo Fabricante</Btn>
    </div>
    <div style={{fontSize:12,color:C.muted,marginBottom:14}}>
      "Popular com fabricantes conhecidos" cadastra uma lista de partida com os principais fabricantes de móveis planejados do Brasil (polos de Bento Gonçalves/RS e Ubá/MG) — confira e complete CNPJ/contato antes de usar em produção.
    </div>
    <div style={{fontSize:12,color:C.muted,marginBottom:10}}>{rows.length} fabricante(s)</div>

    {!loading&&rows.length===0&&<Empty icon={<Factory size={36}/>} msg="Nenhum fabricante cadastrado ainda." action="Popular com fabricantes conhecidos" onAction={popular}/>}
    {(loading||rows.length>0)&&<DTable loading={loading} cols={["Fabricante","Cidade/UF","Categorias","Contato","Ações"]}
      rows={rows.map(fb=>({_raw:fb,cells:[
        <span style={{fontWeight:600}}>{fb.nome}</span>,
        <span style={{fontSize:12,color:C.muted}}>{fb.cidade?`${fb.cidade}/${fb.estado||"—"}`:"—"}</span>,
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{(fb.categorias||[]).slice(0,3).map(c=><Badge key={c} status={c}/>)}{!fb.categorias?.length&&"—"}</div>,
        <span style={{fontSize:12,color:C.muted}}>{fb.telefone||fb.email||"—"}</span>,
        <div style={{display:"flex",gap:6}}>
          <Btn variant="ghost" small onClick={e=>{e.stopPropagation();editar(fb);}}>Editar</Btn>
          <Btn variant="danger" small onClick={e=>{e.stopPropagation();excluir(fb.id);}}>Remover</Btn>
        </div>
      ]}))}
    />}
  </div>;
};
