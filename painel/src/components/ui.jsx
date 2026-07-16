import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { C, STATUS_DEF } from "../theme";

export const Badge = ({status}) => {
  const s = STATUS_DEF[status]||{bg:C.card,text:C.muted,dot:C.muted};
  return <span style={{background:s.bg,color:s.text,border:`1px solid ${s.dot}33`,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:600,display:"inline-flex",alignItems:"center",gap:5,whiteSpace:"nowrap"}}>
    <span style={{width:6,height:6,borderRadius:"50%",background:s.dot,flexShrink:0,boxShadow:`0 0 6px ${s.dot}`}}/>{status}
  </span>;
};

export const Avatar = ({i,size=36,color=C.accent}) => (
  <div style={{width:size,height:size,borderRadius:"50%",background:`linear-gradient(150deg,${color}33,${color}14)`,border:`1.5px solid ${color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.33,fontWeight:700,color,flexShrink:0}}>{i}</div>
);

export const KpiCard = ({label,value,sub,color=C.accent,icon}) => {
  const Icon = typeof icon==="function" ? icon : null;
  return (
    <div className="mm-animate-in mm-card-hover" style={{position:"relative",background:C.gradSurface,border:`1px solid ${C.border}`,borderRadius:14,padding:"18px 20px",display:"flex",flexDirection:"column",gap:8,overflow:"hidden",boxShadow:C.shadowSm}}>
      <div style={{position:"absolute",top:-30,right:-30,width:90,height:90,borderRadius:"50%",background:color,opacity:0.10,filter:"blur(20px)"}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",position:"relative"}}>
        <span style={{fontSize:12,color:C.muted,fontWeight:600,letterSpacing:0.2}}>{label}</span>
        <span style={{width:30,height:30,borderRadius:9,background:color+"1c",border:`1px solid ${color}33`,display:"flex",alignItems:"center",justifyContent:"center",color,fontSize:15,flexShrink:0}}>
          {Icon?<Icon size={15} strokeWidth={2.25}/>:icon}
        </span>
      </div>
      <span style={{fontSize:29,fontWeight:800,color:C.text,letterSpacing:-0.7,position:"relative"}}>{value}</span>
      {sub&&<span style={{fontSize:11,color:C.muted,position:"relative"}}>{sub}</span>}
    </div>
  );
};

export const Sec = ({children}) => (
  <h2 style={{fontSize:16,fontWeight:700,color:C.text,margin:"26px 0 14px",display:"flex",alignItems:"center",gap:10,letterSpacing:-0.2}}>
    <span style={{width:4,height:16,background:C.gradAccent,borderRadius:3,display:"inline-block",boxShadow:`0 0 8px ${C.accent}66`}}/>{children}
  </h2>
);

export const Pill = ({label,active,onClick}) => (
  <button onClick={onClick} style={{padding:"6px 14px",borderRadius:20,border:`1px solid ${active?"transparent":C.border}`,background:active?C.gradAccent:"transparent",color:active?C.white:C.muted,fontSize:12,fontWeight:600,cursor:"pointer",boxShadow:active?C.glowAccent:"none",whiteSpace:"nowrap"}}>{label}</button>
);

export const Btn = ({children,onClick,variant="primary",small,disabled,full}) => {
  const base = {
    width:full?"100%":undefined,
    padding:small?"6px 13px":"9px 19px",
    borderRadius:9,
    border:variant==="ghost"?`1px solid ${C.border}`:"none",
    background:variant==="primary"?C.gradAccent:variant==="ghost"?C.card:"transparent",
    color:variant==="primary"?C.white:variant==="danger"?C.accent:C.text,
    fontSize:small?12:13,fontWeight:600,
    cursor:disabled?"not-allowed":"pointer",
    opacity:disabled?0.5:1,
    boxShadow:variant==="primary"&&!disabled?C.glowAccent:"none",
    display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,
  };
  return <button onClick={onClick} disabled={disabled} style={base}
    onMouseEnter={e=>{if(!disabled&&variant==="ghost")e.currentTarget.style.borderColor=C.accent+"66";}}
    onMouseLeave={e=>{if(!disabled&&variant==="ghost")e.currentTarget.style.borderColor=C.border;}}>
    {children}
  </button>;
};

export const Inp = ({label,value,onChange,placeholder,type="text",required}) => (
  <div style={{marginBottom:14}}>
    {label&&<label style={{fontSize:11,color:C.muted,fontWeight:700,display:"block",marginBottom:5,letterSpacing:0.3}}>{label.toUpperCase()}{required&&<span style={{color:C.accent}}> *</span>}</label>}
    <input type={type} value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      style={{width:"100%",padding:"9px 13px",borderRadius:9,border:`1px solid ${C.border}`,background:C.surface,color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",transition:"border-color 0.15s, box-shadow 0.15s"}}
      onFocus={e=>{e.target.style.borderColor=C.accent+"88";e.target.style.boxShadow=`0 0 0 3px ${C.accent}1a`;}}
      onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow="none";}}/>
  </div>
);

export const Sel = ({label,value,onChange,options,required}) => (
  <div style={{marginBottom:14}}>
    {label&&<label style={{fontSize:11,color:C.muted,fontWeight:700,display:"block",marginBottom:5,letterSpacing:0.3}}>{label.toUpperCase()}{required&&<span style={{color:C.accent}}> *</span>}</label>}
    <select value={value||""} onChange={e=>onChange(e.target.value)}
      style={{width:"100%",padding:"9px 13px",borderRadius:9,border:`1px solid ${C.border}`,background:C.surface,color:C.text,fontSize:13,outline:"none",transition:"border-color 0.15s"}}
      onFocus={e=>e.target.style.borderColor=C.accent+"88"} onBlur={e=>e.target.style.borderColor=C.border}>
      {options.map(o=><option key={typeof o==="object"?o.value:o} value={typeof o==="object"?o.value:o}>{typeof o==="object"?o.label:o}</option>)}
    </select>
  </div>
);

export const Txta = ({label,value,onChange,placeholder}) => (
  <div style={{marginBottom:14}}>
    {label&&<label style={{fontSize:11,color:C.muted,fontWeight:700,display:"block",marginBottom:5,letterSpacing:0.3}}>{label.toUpperCase()}</label>}
    <textarea value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={3}
      style={{width:"100%",padding:"9px 13px",borderRadius:9,border:`1px solid ${C.border}`,background:C.surface,color:C.text,fontSize:13,outline:"none",resize:"vertical",boxSizing:"border-box",transition:"border-color 0.15s"}}
      onFocus={e=>e.target.style.borderColor=C.accent+"88"} onBlur={e=>e.target.style.borderColor=C.border}/>
  </div>
);

export const DTable = ({cols,rows,onRowClick,loading}) => (
  <div className="mm-animate-in" style={{background:C.card,borderRadius:14,border:`1px solid ${C.border}`,overflow:"hidden",boxShadow:C.shadowSm}}>
    {loading&&(
      <div style={{padding:18}}>
        {[0,1,2,3].map(i=><div key={i} className="mm-skeleton" style={{height:38,marginBottom:8,opacity:1-i*0.15}}/>)}
      </div>
    )}
    {!loading&&(
      <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
        <table style={{width:"100%",minWidth:cols.length*110,borderCollapse:"collapse"}}>
          <thead><tr style={{background:C.surface}}>
            {cols.map(c=><th key={c} style={{padding:"12px 14px",textAlign:"left",fontSize:10.5,color:C.muted,fontWeight:700,letterSpacing:0.4,borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap",textTransform:"uppercase"}}>{c}</th>)}
          </tr></thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={i} onClick={()=>onRowClick&&onRowClick(r._raw)}
                style={{background:"transparent",cursor:onRowClick?"pointer":"default",borderBottom:`1px solid ${C.border}22`,transition:"background 0.12s"}}
                onMouseEnter={e=>e.currentTarget.style.background=C.cardHi}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                {r.cells.map((c,j)=><td key={j} style={{padding:"12px 14px",fontSize:13,color:C.text}}>{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
    {!loading&&rows.length===0&&<div style={{padding:40,textAlign:"center",color:C.muted,fontSize:13}}>Nenhum registro encontrado.</div>}
  </div>
);

export const Modal = ({title,onClose,children,wide}) => (
  <div className="mm-fade-in" style={{position:"fixed",inset:0,background:"#0A0B0FBB",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16,boxSizing:"border-box"}} onClick={onClose}>
    <div className="mm-scale-in" onClick={e=>e.stopPropagation()} style={{background:C.gradSurface,border:`1px solid ${C.border}`,borderRadius:16,padding:24,width:wide?"min(92vw,720px)":"min(92vw,520px)",maxHeight:"90vh",overflowY:"auto",boxShadow:C.shadowLg,boxSizing:"border-box"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:22,gap:12}}>
        <span style={{fontSize:16,fontWeight:700,color:C.text,letterSpacing:-0.2}}>{title}</span>
        <button onClick={onClose} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,width:28,height:28,color:C.muted,fontSize:15,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

export const Toast = ({msg,type,onClose}) => {
  useEffect(()=>{const t=setTimeout(onClose,3500);return()=>clearTimeout(t);},[]);
  const col={success:C.green,error:C.accent,info:C.blue}[type]||C.blue;
  return <div className="mm-animate-in" style={{position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",width:"min(92vw,420px)",boxSizing:"border-box",background:C.gradSurface,border:`1px solid ${col}55`,borderRadius:12,padding:"13px 20px",color:C.text,fontSize:13,fontWeight:600,boxShadow:`${C.shadowMd}, 0 0 0 1px ${col}22`,zIndex:300,display:"flex",alignItems:"center",gap:10}}>
    <span style={{color:col}}>{type==="success"?"✅":type==="error"?"❌":"ℹ️"}</span>{msg}
  </div>;
};

export const Empty = ({icon,msg,action,onAction}) => (
  <div className="mm-fade-in" style={{padding:"56px 24px",textAlign:"center"}}>
    <div style={{fontSize:38,marginBottom:14,opacity:0.7}}>{icon}</div>
    <div style={{fontSize:14,color:C.muted,marginBottom:18}}>{msg}</div>
    {action&&<Btn onClick={onAction}>{action}</Btn>}
  </div>
);

export const Spinner = ({size=16,color}) => <Loader2 size={size} className="mm-spin" color={color||C.muted}/>;
