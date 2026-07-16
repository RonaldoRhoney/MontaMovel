import { useState, useEffect } from "react";
import { Factory } from "lucide-react";
import { C, STATUS_DEF } from "../theme";
import { supabase } from "../lib/supabase";
import { useDB, useRT } from "../lib/hooks";
import { Badge, Avatar, KpiCard, Sec, Pill, Btn, Inp, Sel, Txta, DTable, Modal, Toast, Empty } from "../components/ui";

// Ranking de assistências por fabricante — a origem real do problema é o que
// o montador aponta no local (ver montador-pwa/OSDetalhe), não o catálogo.
const AssistenciasPorFabricante = () => {
  const [periodo,setPeriodo] = useState("Este mês");
  const [dados,setDados]     = useState([]);
  const [loading,setLoading] = useState(false);

  const buscar = async() => {
    setLoading(true);
    const hoje = new Date();
    const ranges = {
      "Esta semana": [new Date(new Date().setDate(hoje.getDate()-hoje.getDay()+1)).toISOString().split("T")[0], new Date().toISOString().split("T")[0]],
      "Este mês":    [new Date(hoje.getFullYear(),hoje.getMonth(),1).toISOString().split("T")[0], new Date().toISOString().split("T")[0]],
      "Este ano":    [new Date(hoje.getFullYear(),0,1).toISOString().split("T")[0], new Date().toISOString().split("T")[0]],
    };
    const [ini,fim] = ranges[periodo];
    const {data} = await supabase.rpc("relatorio_assistencias_por_fabricante",{p_data_ini:ini,p_data_fim:fim});
    setDados(data||[]);
    setLoading(false);
  };
  useEffect(()=>{buscar();},[periodo]);

  const max = Math.max(1,...dados.map(d=>Number(d.total)));

  return (
    <div className="mm-animate-in" style={{background:C.gradSurface,border:`1px solid ${C.border}`,borderRadius:14,padding:20,marginBottom:22,boxShadow:C.shadowSm}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{width:28,height:28,borderRadius:8,background:C.accent+"1c",display:"flex",alignItems:"center",justifyContent:"center",color:C.accent}}><Factory size={14}/></span>
          <span style={{fontSize:14,fontWeight:700,color:C.text}}>Assistências por Fabricante</span>
        </div>
        <div style={{display:"flex",gap:6}}>{["Esta semana","Este mês","Este ano"].map(p=><Pill key={p} label={p} active={periodo===p} onClick={()=>setPeriodo(p)}/>)}</div>
      </div>
      {loading&&<div className="mm-skeleton" style={{height:100,borderRadius:10}}/>}
      {!loading&&dados.length===0&&<div style={{fontSize:13,color:C.muted,textAlign:"center",padding:"20px 0"}}>Nenhuma assistência registrada nesse período.</div>}
      {!loading&&dados.length>0&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {dados.map(d=>(
            <div key={d.fabricante_id||d.fabricante_nome}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                <span style={{color:C.text,fontWeight:600}}>{d.fabricante_nome}</span>
                <span style={{color:C.muted,fontWeight:700}}>{d.total}</span>
              </div>
              <div style={{height:8,borderRadius:5,background:C.surface,overflow:"hidden"}}>
                <div style={{width:`${(Number(d.total)/max)*100}%`,height:"100%",borderRadius:5,background:C.gradAccent,transition:"width 0.4s ease"}}/>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// RELATÓRIOS
export const Relatorios = () => {
  const [periodo,setPeriodo] = useState("Este mês");
  const [status,setStatus]   = useState("Todos");
  const [montId,setMontId]   = useState("");
  const [dataIni,setDataIni] = useState("");
  const [dataFim,setDataFim] = useState("");
  const [res,setRes]         = useState([]);
  const [loading,setLoading] = useState(false);
  const {data:monts} = useDB("montadores",q=>q.select("id,nome").eq("ativo",true).order("nome"));

  const buscar = async() => {
    setLoading(true);
    const n=new Date();
    const ranges={
      "Hoje":[n.toISOString().split("T")[0],n.toISOString().split("T")[0]],
      "Esta semana":[new Date(n.setDate(n.getDate()-n.getDay()+1)).toISOString().split("T")[0],new Date().toISOString().split("T")[0]],
      "Este mês":[new Date(n.getFullYear(),n.getMonth(),1).toISOString().split("T")[0],new Date().toISOString().split("T")[0]],
      "Mês passado":[new Date(n.getFullYear(),n.getMonth()-1,1).toISOString().split("T")[0],new Date(n.getFullYear(),n.getMonth(),0).toISOString().split("T")[0]],
      "Últimos 90 dias":[new Date(Date.now()-90*864e5).toISOString().split("T")[0],new Date().toISOString().split("T")[0]],
    };
    const [ini,fim]=dataIni?[dataIni,dataFim||new Date().toISOString().split("T")[0]]:(ranges[periodo]||[null,null]);
    const {data} = await supabase.rpc("buscar_os",{p_status:status==="Todos"?null:status,p_montador_id:montId||null,p_data_ini:ini,p_data_fim:fim,p_resultado:null,p_limit:500,p_offset:0});
    setRes(data||[]);
    setLoading(false);
  };
  useEffect(()=>{buscar();},[periodo,status,montId]);
  const conc=res.filter(r=>r.status==="Concluída com Sucesso").length;
  const assis=res.filter(r=>r.status==="Em Assistência").length;
  const canc=res.filter(r=>r.status==="Cancelada").length;

  return <div style={{padding:24}}>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:18,marginBottom:20}}>
      <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14}}>Central de Filtros</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14}}>
        <div>
          <div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:8}}>PERÍODO</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{["Hoje","Esta semana","Este mês","Mês passado","Últimos 90 dias"].map(p=><Pill key={p} label={p} active={periodo===p} onClick={()=>setPeriodo(p)}/>)}</div>
        </div>
        <Sel label="Status OS" value={status} onChange={setStatus} options={["Todos","Agendada","Confirmada","Em Rota","Em Montagem","Concluída com Sucesso","Em Assistência","Reagendada","Cancelada","Atrasada"]}/>
        <Sel label="Montador" value={montId} onChange={setMontId} options={[{value:"",label:"Todos"},...monts.map(m=>({value:m.id,label:m.nome}))]}/>
        <div>
          <div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:8}}>INTERVALO CUSTOMIZADO</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:8}}>
            <Inp label="De" value={dataIni} onChange={setDataIni} type="date"/>
            <Inp label="Até" value={dataFim} onChange={setDataFim} type="date"/>
          </div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:14,borderTop:`1px solid ${C.border}`,paddingTop:14}}>
        <Btn variant="ghost" onClick={buscar}>🔍 Aplicar</Btn>
        <Btn variant="ghost">⬇ Excel</Btn>
        <Btn variant="ghost">⬇ PDF</Btn>
        <Btn variant="ghost">📧 Agendar Envio</Btn>
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:22}}>
      {[["Total OS",res.length,C.blue,"📋"],["Concluídas",conc,C.green,"✅"],["Assistências",assis,C.accent,"⚠️"],["Canceladas",canc,C.muted,"🚫"],["Taxa Sucesso",res.length?Math.round(conc/res.length*100)+"%":"—",C.yellow,"📊"]].map(([l,v,c,i])=><KpiCard key={l} label={l} value={v} color={c} icon={i}/>)}
    </div>
    <AssistenciasPorFabricante/>
    <Sec>Resultados ({res.length} OS)</Sec>
    <DTable loading={loading} cols={["OS","Cliente","Produto","Montador","Bairro","Data","Status"]}
      rows={res.slice(0,100).map(r=>({_raw:r,cells:[
        <span style={{color:C.accent,fontWeight:700,fontSize:12}}>{r.numero}</span>,
        r.cliente_nome,
        <span style={{fontSize:12,color:C.muted}}>{r.produto_descricao||"—"}</span>,
        <span style={{fontSize:12}}>{r.montador_nome?.split(" ")[0]||"—"}</span>,
        <span style={{fontSize:12,color:C.muted}}>{r.bairro||"—"}</span>,
        <span style={{fontSize:12,color:C.muted}}>{r.data_agendada}</span>,
        <Badge status={r.status}/>,
      ]}))}
    />
  </div>;
};
