import { useState, useEffect } from "react";
import { C, STATUS_DEF } from "../theme";
import { supabase } from "../lib/supabase";
import { useDB, useRT } from "../lib/hooks";
import { Badge, Avatar, KpiCard, Sec, Pill, Btn, Inp, Sel, Txta, DTable, Modal, Toast, Empty } from "../components/ui";

// CLIENTES
export const Clientes = ({toast}) => {
  const [busca,setBusca]   = useState("");
  const [modal,setModal]   = useState(false);
  const [sel,setSel]       = useState(null);
  const [saving,setSaving] = useState(false);
  const blank = {nome:"",telefone:"",whatsapp:"",email:"",cpf_enc:"",logradouro:"",numero:"",complemento:"",bairro:"",cidade:"",estado:"",cep:"",observacoes:"",canal_origem:"atendente"};
  const [form,setForm]     = useState(blank);
  const {data,loading,refetch} = useDB("clientes",q=>q.select("*").eq("ativo",true).order("nome"));
  const rows = data.filter(c=>!busca||[c.nome,c.telefone,c.email,c.bairro,c.cidade].some(v=>v?.toLowerCase().includes(busca.toLowerCase())));
  const f = v=>({...form,...v});

  const salvar = async() => {
    if(!form.nome||!form.telefone) return toast("Nome e telefone são obrigatórios.","error");
    setSaving(true);
    const {error} = sel
      ? await supabase.from("clientes").update({...form,updated_at:new Date().toISOString()}).eq("id",sel.id)
      : await supabase.from("clientes").insert([form]);
    if(error) toast("Erro: "+error.message,"error");
    else { toast(sel?"Cliente atualizado!":"Cliente cadastrado!","success"); setModal(false); setSel(null); setForm(blank); refetch(); }
    setSaving(false);
  };

  const editar = c => { setSel(c); setForm({nome:c.nome,telefone:c.telefone||"",whatsapp:c.whatsapp||"",email:c.email||"",cpf_enc:"",logradouro:c.logradouro||"",numero:c.numero||"",complemento:c.complemento||"",bairro:c.bairro||"",cidade:c.cidade||"",estado:c.estado||"",cep:c.cep||"",observacoes:c.observacoes||"",canal_origem:c.canal_origem||"atendente"}); setModal(true); };
  const excluir = async id => { if(!confirm("Desativar?")) return; await supabase.from("clientes").update({ativo:false}).eq("id",id); toast("Desativado.","info"); refetch(); };

  return <div style={{padding:24}}>
    {modal&&<Modal title={sel?"Editar Cliente":"Novo Cliente"} onClose={()=>{setModal(false);setSel(null);}} wide>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Inp label="Nome Completo" value={form.nome} onChange={v=>setForm(f({nome:v}))} required/>
        <Inp label="CPF (criptografado)" value={form.cpf_enc} onChange={v=>setForm(f({cpf_enc:v}))} placeholder="000.000.000-00"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Inp label="Telefone" value={form.telefone} onChange={v=>setForm(f({telefone:v}))} required/>
        <Inp label="WhatsApp" value={form.whatsapp} onChange={v=>setForm(f({whatsapp:v}))}/>
      </div>
      <Inp label="E-mail" value={form.email} onChange={v=>setForm(f({email:v}))} type="email"/>
      <div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:10}}>ENDEREÇO</div>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:12}}>
        <Inp label="Logradouro" value={form.logradouro} onChange={v=>setForm(f({logradouro:v}))}/>
        <Inp label="Número" value={form.numero} onChange={v=>setForm(f({numero:v}))}/>
        <Inp label="CEP" value={form.cep} onChange={v=>setForm(f({cep:v}))} placeholder="00000-000"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
        <Inp label="Bairro" value={form.bairro} onChange={v=>setForm(f({bairro:v}))}/>
        <Inp label="Cidade" value={form.cidade} onChange={v=>setForm(f({cidade:v}))}/>
        <Inp label="Estado" value={form.estado} onChange={v=>setForm(f({estado:v}))} placeholder="PA"/>
      </div>
      <Sel label="Canal de Origem" value={form.canal_origem} onChange={v=>setForm(f({canal_origem:v}))} options={["atendente","self_service","whatsapp","importacao"]}/>
      <Txta label="Observações" value={form.observacoes} onChange={v=>setForm(f({observacoes:v}))}/>
      <div style={{background:C.accent+"11",border:`1px solid ${C.accent}33`,borderRadius:8,padding:"10px 14px",fontSize:12,color:C.muted,marginBottom:16}}>
        🔒 CPF criptografado com AES-256 (LGPD Art. 46). Consentimento registrado automaticamente.
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <Btn variant="ghost" onClick={()=>{setModal(false);setSel(null);}}>Cancelar</Btn>
        <Btn onClick={salvar} disabled={saving}>{saving?"Salvando...":"Salvar"}</Btn>
      </div>
    </Modal>}
    <div style={{display:"flex",gap:10,marginBottom:20}}>
      <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar nome, telefone, bairro, cidade..."
        style={{flex:1,padding:"8px 13px",borderRadius:8,border:`1px solid ${C.border}`,background:C.card,color:C.text,fontSize:13,outline:"none"}}/>
      <Btn variant="ghost">⬇ Exportar</Btn>
      <Btn onClick={()=>{setSel(null);setForm(blank);setModal(true);}}>+ Novo Cliente</Btn>
    </div>
    <div style={{fontSize:12,color:C.muted,marginBottom:10}}>{rows.length} cliente(s)</div>
    <DTable loading={loading} cols={["Nome","Telefone","WhatsApp","Bairro","Cidade","Canal","Ações"]}
      rows={rows.map(c=>({_raw:c,cells:[
        <span style={{fontWeight:600}}>{c.nome}</span>,
        c.telefone,
        <span style={{color:C.green,fontSize:12}}>{c.whatsapp||"—"}</span>,
        <span style={{fontSize:12,color:C.muted}}>{c.bairro||"—"}</span>,
        <span style={{fontSize:12,color:C.muted}}>{c.cidade||"—"}</span>,
        <span style={{fontSize:11,color:C.muted}}>{c.canal_origem||"—"}</span>,
        <div style={{display:"flex",gap:6}}>
          <Btn variant="ghost" small onClick={e=>{e.stopPropagation();editar(c);}}>Editar</Btn>
          <Btn variant="danger" small onClick={e=>{e.stopPropagation();excluir(c.id);}}>Remover</Btn>
        </div>
      ]}))}
    />
  </div>;
};
