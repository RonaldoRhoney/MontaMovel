import { C } from "../theme";
import { Btn } from "./ui";
import { useIsMobile } from "../lib/useIsMobile";

export const Topbar = ({titulo,notifOpen,setNotifOpen,notifs,onNovaOS,onMenuClick}) => {
  const isMobile = useIsMobile();
  return (
    <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:isMobile?"0 12px":"0 24px",height:58,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:5,gap:8}}>
      <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
        {isMobile&&<button onClick={onMenuClick} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 10px",color:C.text,cursor:"pointer",fontSize:15,flexShrink:0}}>☰</button>}
        <h1 style={{fontSize:16,fontWeight:700,color:C.text,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{titulo}</h1>
      </div>
      <div style={{display:"flex",gap:9,alignItems:"center",flexShrink:0}}>
        <div style={{position:"relative"}}>
          <button onClick={()=>setNotifOpen(!notifOpen)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 12px",color:C.muted,cursor:"pointer",fontSize:15,position:"relative"}}>
            🔔{notifs.length>0&&<span style={{position:"absolute",top:4,right:4,width:7,height:7,borderRadius:"50%",background:C.accent,border:`2px solid ${C.surface}`}}/>}
          </button>
          {notifOpen&&<div style={{position:"absolute",right:0,top:42,width:"min(90vw,350px)",background:C.card,border:`1px solid ${C.border}`,borderRadius:12,boxShadow:"0 8px 32px #00000066",zIndex:100,maxHeight:400,overflowY:"auto"}}>
            <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,fontSize:13,fontWeight:700,color:C.text}}>
              Notificações {notifs.length>0&&<span style={{background:C.accent,color:C.white,borderRadius:10,padding:"1px 7px",fontSize:11,marginLeft:6}}>{notifs.length}</span>}
            </div>
            {notifs.length===0&&<div style={{padding:20,textAlign:"center",color:C.muted,fontSize:13}}>Nenhuma notificação</div>}
            {notifs.map(n=><div key={n.id} style={{padding:"11px 16px",borderBottom:`1px solid ${C.border}11`,display:"flex",gap:9,alignItems:"flex-start"}}>
              <span style={{fontSize:15,marginTop:1}}>{n.tipo==="critico"||n.tipo==="alerta"?"⚠️":n.tipo==="sucesso"?"✅":"ℹ️"}</span>
              <div><div style={{fontSize:12,color:C.text,lineHeight:1.5}}>{n.mensagem}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{new Date(n.created_at).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</div></div>
            </div>)}
          </div>}
        </div>
        <Btn onClick={onNovaOS}>{isMobile?"+ OS":"+ Nova OS"}</Btn>
      </div>
    </div>
  );
};
