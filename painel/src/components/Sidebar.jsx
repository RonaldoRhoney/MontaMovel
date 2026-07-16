import { C } from "../theme";
import { Avatar } from "./ui";

const NAV = [
  {id:"dashboard",   icon:"◈",label:"Dashboard"},
  {id:"os",          icon:"≡",label:"Ordens de Serviço"},
  {id:"agendamento", icon:"▦",label:"Agendamentos"},
  {id:"clientes",    icon:"👤",label:"Clientes"},
  {id:"montadores",  icon:"◉",label:"Montadores"},
  {id:"produtos",    icon:"🪑",label:"Produtos"},
  {id:"rotas",       icon:"⊕",label:"Rotas"},
  {id:"estoque",     icon:"◧",label:"Estoque"},
  {id:"ponto",       icon:"◷",label:"Ponto"},
  {id:"relatorios",  icon:"⊞",label:"Relatórios"},
  {id:"comunicacao", icon:"💬",label:"Comunicação"},
  {id:"configuracoes",icon:"⊙",label:"Configurações"},
];

export const Sidebar = ({ativo,setAtivo,col,setCol,user}) => (
  <aside style={{width:col?64:240,background:C.surface,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",height:"100vh",position:"sticky",top:0,transition:"width 0.2s",flexShrink:0}}>
    <div style={{padding:col?"18px 0":"18px 18px",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid ${C.border}`,justifyContent:col?"center":"flex-start"}}>
      <span style={{fontSize:22,color:C.accent,fontWeight:900}}>⬡</span>
      {!col&&<span style={{fontSize:15,fontWeight:800,color:C.text}}>Monta<span style={{color:C.accent}}>Movel</span></span>}
    </div>
    <nav style={{flex:1,padding:"10px 7px",overflow:"auto"}}>
      {NAV.map(n=><button key={n.id} onClick={()=>setAtivo(n.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:11,padding:col?"10px 0":"10px 11px",justifyContent:col?"center":"flex-start",borderRadius:8,background:ativo===n.id?C.accent+"18":"transparent",border:"none",color:ativo===n.id?C.accent:C.muted,cursor:"pointer",fontSize:13,fontWeight:ativo===n.id?700:500,marginBottom:2}}>
        <span style={{fontSize:15}}>{n.icon}</span>{!col&&n.label}
      </button>)}
    </nav>
    <button onClick={()=>setCol(!col)} style={{margin:"10px 7px",padding:8,borderRadius:8,background:C.card,border:`1px solid ${C.border}`,color:C.muted,cursor:"pointer",fontSize:13,display:"flex",justifyContent:"center"}}>{col?"▶":"◀"}</button>
    <div style={{padding:col?"10px 0":"10px 14px",borderTop:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:9,justifyContent:col?"center":"flex-start"}}>
      <Avatar i={(user?.nome||"U").substring(0,2).toUpperCase()} size={32} color={C.blue}/>
      {!col&&<div><div style={{fontSize:12,fontWeight:700,color:C.text}}>{user?.nome||"—"}</div><div style={{fontSize:10,color:C.muted}}>{user?.role||"—"}</div></div>}
    </div>
    {!col&&<div style={{padding:"6px 14px 12px",fontSize:9,color:C.muted,textAlign:"center"}}>© 2026 RhoneyInc. Todos os direitos reservados.</div>}
  </aside>
);
