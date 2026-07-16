import {
  LayoutGrid, ReceiptText, ClipboardList, CalendarDays, Users, HardHat,
  Armchair, Factory, Route, PackageSearch, Clock, BarChart3, MessageCircle, Settings,
} from "lucide-react";
import { C } from "../theme";
import { Avatar } from "./ui";
import { useIsMobile } from "../lib/useIsMobile";

const NAV = [
  {id:"dashboard",   Icon:LayoutGrid,     label:"Dashboard"},
  {id:"pedidos",     Icon:ReceiptText,    label:"Pedidos"},
  {id:"os",          Icon:ClipboardList,  label:"Ordens de Serviço"},
  {id:"agendamento", Icon:CalendarDays,   label:"Agendamentos"},
  {id:"clientes",    Icon:Users,          label:"Clientes"},
  {id:"montadores",  Icon:HardHat,        label:"Montadores"},
  {id:"produtos",    Icon:Armchair,       label:"Produtos"},
  {id:"fabricantes", Icon:Factory,        label:"Fabricantes"},
  {id:"rotas",       Icon:Route,          label:"Rotas"},
  {id:"estoque",     Icon:PackageSearch,  label:"Estoque"},
  {id:"ponto",       Icon:Clock,          label:"Ponto"},
  {id:"relatorios",  Icon:BarChart3,      label:"Relatórios"},
  {id:"comunicacao", Icon:MessageCircle,  label:"Comunicação"},
  {id:"configuracoes",Icon:Settings,      label:"Configurações"},
];

export const Sidebar = ({ativo,setAtivo,col,setCol,user,mobileOpen,onCloseMobile}) => {
  const isMobile = useIsMobile();
  const largura = isMobile ? 250 : (col?68:250);
  const escolher = (id) => { setAtivo(id); if(isMobile) onCloseMobile(); };

  return <>
    {isMobile && mobileOpen && (
      <div className="mm-fade-in" onClick={onCloseMobile} style={{position:"fixed",inset:0,background:"#0A0B0FCC",backdropFilter:"blur(3px)",zIndex:190}}/>
    )}
    <aside style={{
      width:largura,background:C.gradDark,borderRight:`1px solid ${C.border}`,
      display:"flex",flexDirection:"column",height:"100vh",flexShrink:0,
      transition:"width 0.25s cubic-bezier(0.16,1,0.3,1), transform 0.25s cubic-bezier(0.16,1,0.3,1)",
      ...(isMobile
        ? {position:"fixed",top:0,left:0,zIndex:200,transform:mobileOpen?"translateX(0)":"translateX(-100%)",boxShadow:mobileOpen?C.shadowLg:"none"}
        : {position:"sticky",top:0}),
    }}>
      <div style={{padding:col&&!isMobile?"20px 0":"20px 20px",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid ${C.border}`,justifyContent:col&&!isMobile?"center":"flex-start"}}>
        <span style={{width:32,height:32,borderRadius:9,background:C.gradAccent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,color:C.white,flexShrink:0,boxShadow:C.glowAccent}}>M</span>
        {(!col||isMobile)&&<span style={{fontSize:15,fontWeight:800,color:C.text,letterSpacing:-0.2}}>Monta<span style={{color:C.accent}}>Movel</span></span>}
      </div>
      <nav style={{flex:1,padding:"14px 10px",overflow:"auto",display:"flex",flexDirection:"column",gap:2}}>
        {NAV.map(n=>{
          const isAtivo = ativo===n.id;
          return <button key={n.id} onClick={()=>escolher(n.id)} style={{
            position:"relative",width:"100%",display:"flex",alignItems:"center",gap:12,
            padding:col&&!isMobile?"10px 0":"10px 12px",justifyContent:col&&!isMobile?"center":"flex-start",
            borderRadius:10,background:isAtivo?C.accent+"16":"transparent",border:"none",
            color:isAtivo?C.accent:C.muted,cursor:"pointer",fontSize:13,fontWeight:isAtivo?700:500,
            transition:"background 0.15s, color 0.15s",
          }}
          onMouseEnter={e=>{if(!isAtivo)e.currentTarget.style.background=C.card;}}
          onMouseLeave={e=>{if(!isAtivo)e.currentTarget.style.background="transparent";}}>
            {isAtivo&&<span style={{position:"absolute",left:col&&!isMobile?"50%":0,top:col&&!isMobile?-2:"20%",bottom:col&&!isMobile?"auto":"20%",width:col&&!isMobile?"60%":3,height:col&&!isMobile?3:"60%",transform:col&&!isMobile?"translateX(-50%)":"none",background:C.gradAccent,borderRadius:3,boxShadow:C.glowAccent}}/>}
            <n.Icon size={17} strokeWidth={2} style={{flexShrink:0}}/>
            {(!col||isMobile)&&<span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.label}</span>}
          </button>;
        })}
      </nav>
      {!isMobile&&<button onClick={()=>setCol(!col)} style={{margin:"10px 10px",padding:8,borderRadius:9,background:C.card,border:`1px solid ${C.border}`,color:C.muted,cursor:"pointer",fontSize:13,display:"flex",justifyContent:"center"}}>{col?"▶":"◀"}</button>}
      <div style={{padding:col&&!isMobile?"12px 0":"12px 16px",borderTop:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:9,justifyContent:col&&!isMobile?"center":"flex-start"}}>
        <Avatar i={(user?.nome||"U").substring(0,2).toUpperCase()} size={32} color={C.blue}/>
        {(!col||isMobile)&&<div style={{overflow:"hidden"}}><div style={{fontSize:12,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.nome||"—"}</div><div style={{fontSize:10,color:C.muted}}>{user?.role||"—"}</div></div>}
      </div>
      {(!col||isMobile)&&<div style={{padding:"6px 14px 14px",fontSize:9,color:C.muted,textAlign:"center",opacity:0.6}}>© 2026 RhoneyInc</div>}
    </aside>
  </>;
};
