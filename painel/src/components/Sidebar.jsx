import { C } from "../theme";
import { Avatar } from "./ui";
import { useIsMobile } from "../lib/useIsMobile";

const NAV = [
  {id:"dashboard",   icon:"◈",label:"Dashboard"},
  {id:"pedidos",     icon:"🧾",label:"Pedidos"},
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

export const Sidebar = ({ativo,setAtivo,col,setCol,user,mobileOpen,onCloseMobile}) => {
  const isMobile = useIsMobile();
  // Em mobile o "colapsado" não existe — ou a gaveta está fechada (fora da tela)
  // ou aberta (largura total de gaveta), nunca no meio-termo dos ícones.
  const largura = isMobile ? 240 : (col?64:240);

  const escolher = (id) => { setAtivo(id); if(isMobile) onCloseMobile(); };

  return <>
    {isMobile && mobileOpen && (
      <div onClick={onCloseMobile} style={{position:"fixed",inset:0,background:"#00000099",zIndex:190}}/>
    )}
    <aside style={{
      width:largura,background:C.surface,borderRight:`1px solid ${C.border}`,
      display:"flex",flexDirection:"column",height:"100vh",flexShrink:0,
      transition:"width 0.2s, transform 0.2s",
      ...(isMobile
        ? {position:"fixed",top:0,left:0,zIndex:200,transform:mobileOpen?"translateX(0)":"translateX(-100%)",boxShadow:mobileOpen?"0 0 30px #00000099":"none"}
        : {position:"sticky",top:0}),
    }}>
      <div style={{padding:col&&!isMobile?"18px 0":"18px 18px",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid ${C.border}`,justifyContent:col&&!isMobile?"center":"flex-start"}}>
        <span style={{fontSize:22,color:C.accent,fontWeight:900}}>⬡</span>
        {(!col||isMobile)&&<span style={{fontSize:15,fontWeight:800,color:C.text}}>Monta<span style={{color:C.accent}}>Movel</span></span>}
      </div>
      <nav style={{flex:1,padding:"10px 7px",overflow:"auto"}}>
        {NAV.map(n=><button key={n.id} onClick={()=>escolher(n.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:11,padding:col&&!isMobile?"10px 0":"10px 11px",justifyContent:col&&!isMobile?"center":"flex-start",borderRadius:8,background:ativo===n.id?C.accent+"18":"transparent",border:"none",color:ativo===n.id?C.accent:C.muted,cursor:"pointer",fontSize:13,fontWeight:ativo===n.id?700:500,marginBottom:2}}>
          <span style={{fontSize:15}}>{n.icon}</span>{(!col||isMobile)&&n.label}
        </button>)}
      </nav>
      {!isMobile&&<button onClick={()=>setCol(!col)} style={{margin:"10px 7px",padding:8,borderRadius:8,background:C.card,border:`1px solid ${C.border}`,color:C.muted,cursor:"pointer",fontSize:13,display:"flex",justifyContent:"center"}}>{col?"▶":"◀"}</button>}
      <div style={{padding:col&&!isMobile?"10px 0":"10px 14px",borderTop:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:9,justifyContent:col&&!isMobile?"center":"flex-start"}}>
        <Avatar i={(user?.nome||"U").substring(0,2).toUpperCase()} size={32} color={C.blue}/>
        {(!col||isMobile)&&<div><div style={{fontSize:12,fontWeight:700,color:C.text}}>{user?.nome||"—"}</div><div style={{fontSize:10,color:C.muted}}>{user?.role||"—"}</div></div>}
      </div>
      {(!col||isMobile)&&<div style={{padding:"6px 14px 12px",fontSize:9,color:C.muted,textAlign:"center"}}>© 2026 RhoneyInc. Todos os direitos reservados.</div>}
    </aside>
  </>;
};
