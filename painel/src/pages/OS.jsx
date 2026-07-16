import { useState } from "react";
import { C } from "../theme";
import { supabase } from "../lib/supabase";
import { useDB, useRT } from "../lib/hooks";
import { Badge, Pill, Btn, Inp, Sel, Txta, DTable, Modal } from "../components/ui";

// ORDENS DE SERVIÇO
export const OS = ({toast}) => {
  const [filtro,setFiltro] = useState("Todas");
  const [busca,setBusca]   = useState("");
  const [detalhe,setDetalhe] = useState(null);
  const [modal,setModal]   = useState(false);
  const [saving,setSaving] = useState(false);

  // Passo 1 do modal: achar o pedido (venda já registrada) por número ou CPF —
  // não redigitamos cliente/produto, eles já vêm amarrados à compra.
  const [buscaPedido,setBuscaPedido] = useState("");
  const [buscando,setBuscando]       = useState(false);
  const [resultados,setResultados]   = useState([]);
  const [pedidoSel,setPedidoSel]     = useState(null);

  const blank = {montador_id:"",data_agendada:"",hora_agendada:"",prioridade:"Normal",observacoes:""};
  const [form,setForm]     = useState(blank);
  const STATUS_F = ["Todas","Agendada","Pendente Confirmação","Confirmada","Em Rota","Em Montagem","Concluída com Sucesso","Em Assistência","Reagendada","Atrasada","Cancelada"];

  const {data:ordens,loading,refetch} = useDB("ordens_servico",q=>
    q.select("id,numero,status,prioridade,data_agendada,hora_agendada,bairro,cidade,motivo_assist,nps_score,clientes(nome,telefone),produtos(nome),montadores(nome)").order("data_agendada",{ascending:false}).limit(200)
  );
  const {data:montadores} = useDB("montadores",q=>q.select("id,nome").eq("ativo",true).order("nome"));
  useRT("ordens_servico",refetch);

  const rows = ordens.filter(o=>{
    const mS=filtro==="Todas"||o.status===filtro;
    const mB=!busca||[o.clientes?.nome,o.numero,o.bairro,o.produtos?.nome,o.montadores?.nome].some(v=>v?.toLowerCase().includes(busca.toLowerCase()));
    return mS&&mB;
  });

  const PEDIDO_SELECT = "id,numero_pedido,data_compra,produto_id,produto_descricao,cliente_id,clientes(nome,telefone,logradouro,numero,complemento,bairro,cidade,estado,cep),produtos(nome)";

  const buscarPedido = async() => {
    const termo = buscaPedido.trim();
    if(!termo) return;
    setBuscando(true); setResultados([]);
    const somenteDigitos = termo.replace(/\D/g,"");
    if(somenteDigitos.length>=11){
      const {data:cliente} = await supabase.from("clientes").select("id").eq("cpf_enc",termo).maybeSingle();
      if(!cliente){ toast("Nenhum cliente encontrado com esse CPF.","error"); setBuscando(false); return; }
      const {data} = await supabase.from("pedidos").select(PEDIDO_SELECT).eq("cliente_id",cliente.id).eq("utilizado",false);
      setResultados(data||[]);
      if(!data?.length) toast("Esse cliente não tem pedidos disponíveis pra montagem.","error");
    } else {
      const {data} = await supabase.from("pedidos").select(PEDIDO_SELECT).eq("numero_pedido",termo).eq("utilizado",false);
      setResultados(data||[]);
      if(!data?.length) toast("Pedido não encontrado ou já utilizado.","error");
    }
    setBuscando(false);
  };

  const fecharModal = () => { setModal(false); setBuscaPedido(""); setResultados([]); setPedidoSel(null); setForm(blank); };
  const f = v=>({...form,...v});

  const criar = async() => {
    if(!pedidoSel) return toast("Busque e selecione um pedido primeiro.","error");
    if(!form.data_agendada||!form.hora_agendada) return toast("Data e hora são obrigatórios.","error");
    setSaving(true);
    const c = pedidoSel.clientes||{};
    const {error} = await supabase.from("ordens_servico").insert([{
      numero:"", status:"Agendada",
      cliente_id:pedidoSel.cliente_id, produto_id:pedidoSel.produto_id, produto_descricao:pedidoSel.produto_descricao,
      pedido_id:pedidoSel.id, montador_id:form.montador_id||null,
      logradouro:c.logradouro, numero_end:c.numero, complemento:c.complemento, bairro:c.bairro, cidade:c.cidade, estado:c.estado, cep:c.cep,
      data_agendada:form.data_agendada, hora_agendada:form.hora_agendada, prioridade:form.prioridade, observacoes:form.observacoes,
    }]);
    if(error){ toast("Erro: "+error.message,"error"); setSaving(false); return; }
    await supabase.from("pedidos").update({utilizado:true}).eq("id",pedidoSel.id);
    toast("OS criada!","success"); fecharModal(); refetch();
    setSaving(false);
  };

  const avStatus = async(id,status) => {
    await supabase.from("ordens_servico").update({status,updated_at:new Date().toISOString()}).eq("id",id);
    toast("Status → "+status,"success"); refetch();
    if(detalhe?.id===id) setDetalhe(p=>({...p,status}));
  };

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
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:20}}>
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
    {modal&&<Modal title="Nova Ordem de Serviço" onClose={fecharModal}>
      {!pedidoSel ? <>
        <Inp label="Número do Pedido ou CPF do Cliente" value={buscaPedido} onChange={setBuscaPedido} placeholder="Ex: PED-10234 ou 000.000.000-00"/>
        <Btn onClick={buscarPedido} disabled={buscando||!buscaPedido.trim()} full>{buscando?"Buscando...":"Buscar Pedido"}</Btn>

        {resultados.length>0&&<div style={{marginTop:18}}>
          <div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:8}}>{resultados.length} PEDIDO(S) DISPONÍVEL(EIS)</div>
          {resultados.map(r=>(
            <div key={r.id} onClick={()=>{setPedidoSel(r);setResultados([]);}}
              style={{padding:"10px 14px",borderRadius:8,border:`1px solid ${C.border}`,marginBottom:8,cursor:"pointer"}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{color:C.accent,fontWeight:700,fontSize:13}}>{r.numero_pedido}</span>
                <span style={{fontSize:11,color:C.muted}}>{r.data_compra||"—"}</span>
              </div>
              <div style={{fontSize:13,color:C.text}}>{r.clientes?.nome}</div>
              <div style={{fontSize:12,color:C.muted}}>{r.produtos?.nome||r.produto_descricao||"—"}</div>
            </div>
          ))}
        </div>}

        <div style={{fontSize:12,color:C.muted,marginTop:16,lineHeight:1.6}}>
          Pedido novo ainda não está aqui? Importe-o na tela <strong style={{color:C.text}}>Pedidos</strong> antes de criar a OS — a montagem sempre parte de uma venda já registrada.
        </div>
      </> : <>
        <div style={{background:C.surface,borderRadius:10,padding:14,marginBottom:18}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{color:C.accent,fontWeight:700,fontSize:13}}>{pedidoSel.numero_pedido}</span>
            <button onClick={()=>setPedidoSel(null)} style={{background:"none",border:"none",color:C.blue,fontSize:12,cursor:"pointer"}}>Trocar pedido</button>
          </div>
          <div style={{fontSize:15,fontWeight:700,color:C.text,marginTop:6}}>{pedidoSel.clientes?.nome}</div>
          <div style={{fontSize:12,color:C.muted}}>{pedidoSel.clientes?.telefone}</div>
          <div style={{fontSize:12,color:C.muted,marginTop:2}}>{pedidoSel.produtos?.nome||pedidoSel.produto_descricao}</div>
          <div style={{fontSize:12,color:C.muted,marginTop:2}}>{pedidoSel.clientes?.logradouro}{pedidoSel.clientes?.numero?`, ${pedidoSel.clientes.numero}`:""} — {pedidoSel.clientes?.bairro}, {pedidoSel.clientes?.cidade}</div>
        </div>
        <Sel label="Montador" value={form.montador_id} onChange={v=>setForm(f({montador_id:v}))} options={[{value:"",label:"A definir..."},...montadores.map(m=>({value:m.id,label:m.nome}))]}/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:12}}>
          <Inp label="Data" value={form.data_agendada} onChange={v=>setForm(f({data_agendada:v}))} type="date" required/>
          <Inp label="Hora" value={form.hora_agendada} onChange={v=>setForm(f({hora_agendada:v}))} type="time" required/>
          <Sel label="Prioridade" value={form.prioridade} onChange={v=>setForm(f({prioridade:v}))} options={["Normal","Urgente"]}/>
        </div>
        <Txta label="Observações" value={form.observacoes} onChange={v=>setForm(f({observacoes:v}))}/>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <Btn variant="ghost" onClick={fecharModal}>Cancelar</Btn>
          <Btn onClick={criar} disabled={saving}>{saving?"Criando...":"Criar OS"}</Btn>
        </div>
      </>}
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
