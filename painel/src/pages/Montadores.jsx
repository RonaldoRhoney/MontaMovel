import { useState, useEffect } from "react";
import { C, STATUS_DEF } from "../theme";
import { supabase } from "../lib/supabase";
import { useDB, useRT } from "../lib/hooks";
import { Badge, Avatar, KpiCard, Sec, Pill, Btn, Inp, Sel, Txta, DTable, Modal, Toast, Empty } from "../components/ui";

// MONTADORES
export const Montadores = ({toast}) => {
  const [modal,setModal]   = useState(false);
  const [sel,setSel]       = useState(null);
  const [detalhe,setDetalhe] = useState(null);
  const [saving,setSaving] = useState(false);
  const blank = {nome:"",telefone:"",cpf_enc:"",data_nascimento:"",tipo_contrato:"CLT",data_admissao:"",bairro:"",cidade:"",estado:"PA",cep:""};
  const [form,setForm]     = useState(blank);
  const {data,loading,refetch} = useDB("montadores",q=>q.select("*").eq("ativo",true).order("nome"));
  const {data:osDetalhe}   = useDB("ordens_servico",q=>detalhe?q.select("id,numero,status,data_agendada,hora_agendada,bairro,clientes(nome),produtos(nome)").eq("montador_id",detalhe.id).order("data_agendada",{ascending:false}).limit(20):q.select("id").limit(0),[detalhe?.id]);
  const f = v=>({...form,...v});

  const salvar = async() => {
    if(!form.nome||!form.telefone) return toast("Nome e telefone são obrigatórios.","error");
    setSaving(true);
    const {error} = sel
      ? await supabase.from("montadores").update({...form,updated_at:new Date().toISOString()}).eq("id",sel.id)
      : await supabase.from("montadores").insert([form]);
    if(error) toast("Erro: "+error.message,"error");
    else { toast(sel?"Atualizado!":"Cadastrado!","success"); setModal(false); setSel(null); setForm(blank); refetch(); }
    setSaving(false);
  };
  const editar = m => { setSel(m); setForm({nome:m.nome,telefone:m.telefone||"",cpf_enc:"",data_nascimento:m.data_nascimento||"",tipo_contrato:m.tipo_contrato,data_admissao:m.data_admissao||"",bairro:m.bairro||"",cidade:m.cidade||"",estado:m.estado||"PA",cep:m.cep||""}); setModal(true); };
  const excluir = async id => { if(!confirm("Desativar?")) return; await supabase.from("montadores").update({ativo:false,status:"Inativo"}).eq("id",id); toast("Desativado.","info"); refetch(); };

  const MForm = () => <Modal title={sel?"Editar Montador":"Cadastrar Montador"} onClose={()=>{setModal(false);setSel(null);}}>
    <Inp label="Nome Completo" value={form.nome} onChange={v=>setForm(f({nome:v}))} required/>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}>
      <Inp label="Telefone" value={form.telefone} onChange={v=>setForm(f({telefone:v}))} placeholder="(91) 99000-0000" required/>
      <Inp label="CPF (criptografado)" value={form.cpf_enc} onChange={v=>setForm(f({cpf_enc:v}))} placeholder="000.000.000-00"/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}>
      <Sel label="Tipo Contrato" value={form.tipo_contrato} onChange={v=>setForm(f({tipo_contrato:v}))} options={["CLT","PJ","Autonomo"]} required/>
      <Inp label="Data Admissão" value={form.data_admissao} onChange={v=>setForm(f({data_admissao:v}))} type="date"/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:12}}>
      <Inp label="Bairro" value={form.bairro} onChange={v=>setForm(f({bairro:v}))}/>
      <Inp label="Cidade" value={form.cidade} onChange={v=>setForm(f({cidade:v}))}/>
      <Inp label="Estado" value={form.estado} onChange={v=>setForm(f({estado:v}))} placeholder="PA"/>
    </div>
    <div style={{background:C.accent+"11",border:`1px solid ${C.accent}33`,borderRadius:8,padding:"10px 14px",fontSize:12,color:C.muted,marginBottom:16}}>
      🔒 CPF criptografado AES-256. Montador receberá convite WhatsApp para aceitar rastreio GPS (LGPD).
    </div>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
      <Btn variant="ghost" onClick={()=>{setModal(false);setSel(null);}}>Cancelar</Btn>
      <Btn onClick={salvar} disabled={saving}>{saving?"Salvando...":"Salvar"}</Btn>
    </div>
  </Modal>;

  if(detalhe) return <div style={{padding:24}}>
    {modal&&<MForm/>}
    <Btn variant="ghost" onClick={()=>setDetalhe(null)}>← Voltar</Btn>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:20,marginTop:18}}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:22,textAlign:"center"}}>
          <Avatar i={detalhe.nome.substring(0,2).toUpperCase()} size={72} color={C.accent}/>
          <div style={{fontSize:18,fontWeight:800,color:C.text,marginTop:12}}>{detalhe.nome}</div>
          <div style={{fontSize:12,color:C.muted}}>{detalhe.bairro||"—"} · {detalhe.cidade||"—"}</div>
          <div style={{fontSize:12,color:C.muted}}>{detalhe.telefone}</div>
          <div style={{fontSize:11,color:C.muted,marginTop:2}}>{detalhe.tipo_contrato} · desde {detalhe.data_admissao||"—"}</div>
          <span style={{display:"inline-block",marginTop:10,fontSize:10,color:C.green,fontWeight:700,background:C.green+"18",padding:"2px 10px",borderRadius:20}}>{detalhe.status}</span>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10,marginTop:18}}>
            {[["NPS",detalhe.nps_medio||"—",C.yellow],["OS Total",detalhe.total_os||0,C.blue]].map(([k,v,c])=>(
              <div key={k} style={{background:C.surface,borderRadius:8,padding:10}}><div style={{fontSize:20,fontWeight:800,color:c}}>{v}</div><div style={{fontSize:10,color:C.muted}}>{k}</div></div>
            ))}
          </div>
          <div style={{marginTop:14,display:"flex",gap:8,justifyContent:"center"}}>
            <Btn variant="ghost" small onClick={()=>editar(detalhe)}>Editar</Btn>
            <Btn variant="danger" small onClick={()=>excluir(detalhe.id)}>Desativar</Btn>
          </div>
        </div>
      </div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:22}}>
        <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:16}}>Histórico de OS</div>
        {osDetalhe.length===0?<Empty icon="📋" msg="Nenhuma OS encontrada"/>:osDetalhe.map(o=>(
          <div key={o.id} style={{padding:"10px 0",borderBottom:`1px solid ${C.border}22`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <span style={{fontSize:13,color:C.accent,fontWeight:700}}>{o.numero} </span>
              <span style={{fontSize:13,color:C.text}}>{o.clientes?.nome}</span>
              <div style={{fontSize:12,color:C.muted}}>{o.produtos?.nome||"—"} · {o.bairro||"—"} · {o.data_agendada}</div>
            </div>
            <Badge status={o.status}/>
          </div>
        ))}
      </div>
    </div>
  </div>;

  return <div style={{padding:24}}>
    {modal&&<MForm/>}
    <div style={{display:"flex",justifyContent:"flex-end",marginBottom:18}}>
      <Btn onClick={()=>{setSel(null);setForm(blank);setModal(true);}}>+ Cadastrar Montador</Btn>
    </div>
    {loading&&<div style={{textAlign:"center",color:C.muted,padding:32}}>Carregando...</div>}
    {!loading&&data.length===0&&<Empty icon="👷" msg="Nenhum montador cadastrado." action="Cadastrar" onAction={()=>setModal(true)}/>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14}}>
      {data.map(m=>{
        const cor=m.status==="Atrasado"?C.accent:m.status==="Em Campo"?C.green:m.status==="Em Rota"?C.yellow:C.muted;
        return <div key={m.id} style={{background:C.card,border:`1px solid ${m.status==="Atrasado"?C.accent+"55":C.border}`,borderRadius:12,padding:18,cursor:"pointer"}} onClick={()=>setDetalhe(m)}>
          <div style={{display:"flex",gap:12,marginBottom:12}}>
            <Avatar i={m.nome.substring(0,2).toUpperCase()} size={48} color={cor}/>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:C.text}}>{m.nome}</div>
              <div style={{fontSize:12,color:C.muted}}>{m.cidade||"—"} · {m.telefone}</div>
              <div style={{fontSize:11,color:C.muted}}>{m.tipo_contrato}</div>
              <span style={{display:"inline-block",marginTop:4,fontSize:10,color:cor,fontWeight:700,background:cor+"18",padding:"2px 9px",borderRadius:20}}>{m.status}</span>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:8}}>
            {[["OS Total",m.total_os||0],["NPS",m.nps_medio||"—"],[m.tipo_contrato,m.data_admissao?.split("-")[0]||"—"]].map(([k,v])=>(
              <div key={k} style={{background:C.surface,borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                <div style={{fontSize:14,fontWeight:700,color:C.text}}>{v}</div>
                <div style={{fontSize:10,color:C.muted}}>{k}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:6,marginTop:12}}>
            <Btn variant="ghost" small onClick={e=>{e.stopPropagation();editar(m);}}>Editar</Btn>
            <Btn variant="danger" small onClick={e=>{e.stopPropagation();excluir(m.id);}}>Desativar</Btn>
          </div>
        </div>;
      })}
    </div>
  </div>;
};

