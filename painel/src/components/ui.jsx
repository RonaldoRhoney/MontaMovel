import { useEffect } from "react";
import { C, STATUS_DEF } from "../theme";

export const Badge = ({status}) => {
  const s = STATUS_DEF[status]||{bg:C.card,text:C.muted,dot:C.muted};
  return <span style={{background:s.bg,color:s.text,border:`1px solid ${s.dot}22`,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:600,display:"inline-flex",alignItems:"center",gap:5,whiteSpace:"nowrap"}}>
    <span style={{width:6,height:6,borderRadius:"50%",background:s.dot,flexShrink:0}}/>{status}
  </span>;
};

export const Avatar = ({i,size=36,color=C.accent}) => (
  <div style={{width:size,height:size,borderRadius:"50%",background:color+"22",border:`2px solid ${color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.33,fontWeight:700,color,flexShrink:0}}>{i}</div>
);

export const KpiCard = ({label,value,sub,color=C.accent,icon}) => (
  <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"18px 22px",display:"flex",flexDirection:"column",gap:5}}>
    <div style={{display:"flex",justifyContent:"space-between"}}>
      <span style={{fontSize:12,color:C.muted,fontWeight:500}}>{label}</span>
      <span style={{fontSize:18}}>{icon}</span>
    </div>
    <span style={{fontSize:30,fontWeight:800,color,letterSpacing:-1}}>{value}</span>
    {sub&&<span style={{fontSize:11,color:C.muted}}>{sub}</span>}
  </div>
);

export const Sec = ({children}) => (
  <h2 style={{fontSize:17,fontWeight:700,color:C.text,margin:"24px 0 14px",display:"flex",alignItems:"center",gap:10}}>
    <span style={{width:3,height:18,background:C.accent,borderRadius:2,display:"inline-block"}}/>{children}
  </h2>
);

export const Pill = ({label,active,onClick}) => (
  <button onClick={onClick} style={{padding:"6px 13px",borderRadius:20,border:`1px solid ${active?C.accent:C.border}`,background:active?C.accent+"22":"transparent",color:active?C.accent:C.muted,fontSize:12,fontWeight:600,cursor:"pointer"}}>{label}</button>
);

export const Btn = ({children,onClick,variant="primary",small,disabled}) => (
  <button onClick={onClick} disabled={disabled} style={{padding:small?"5px 12px":"8px 18px",borderRadius:8,border:variant==="ghost"?`1px solid ${C.border}`:"none",background:variant==="primary"?C.accent:variant==="ghost"?C.card:"transparent",color:variant==="primary"?C.white:variant==="danger"?C.accent:C.text,fontSize:small?12:13,fontWeight:600,cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.5:1}}>
    {children}
  </button>
);

export const Inp = ({label,value,onChange,placeholder,type="text",required}) => (
  <div style={{marginBottom:14}}>
    {label&&<label style={{fontSize:11,color:C.muted,fontWeight:700,display:"block",marginBottom:5}}>{label.toUpperCase()}{required&&<span style={{color:C.accent}}> *</span>}</label>}
    <input type={type} value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      style={{width:"100%",padding:"8px 13px",borderRadius:8,border:`1px solid ${C.border}`,background:C.surface,color:C.text,fontSize:13,outline:"none",boxSizing:"border-box"}}/>
  </div>
);

export const Sel = ({label,value,onChange,options,required}) => (
  <div style={{marginBottom:14}}>
    {label&&<label style={{fontSize:11,color:C.muted,fontWeight:700,display:"block",marginBottom:5}}>{label.toUpperCase()}{required&&<span style={{color:C.accent}}> *</span>}</label>}
    <select value={value||""} onChange={e=>onChange(e.target.value)}
      style={{width:"100%",padding:"8px 13px",borderRadius:8,border:`1px solid ${C.border}`,background:C.surface,color:C.text,fontSize:13,outline:"none"}}>
      {options.map(o=><option key={typeof o==="object"?o.value:o} value={typeof o==="object"?o.value:o}>{typeof o==="object"?o.label:o}</option>)}
    </select>
  </div>
);

export const Txta = ({label,value,onChange,placeholder}) => (
  <div style={{marginBottom:14}}>
    {label&&<label style={{fontSize:11,color:C.muted,fontWeight:700,display:"block",marginBottom:5}}>{label.toUpperCase()}</label>}
    <textarea value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={3}
      style={{width:"100%",padding:"8px 13px",borderRadius:8,border:`1px solid ${C.border}`,background:C.surface,color:C.text,fontSize:13,outline:"none",resize:"vertical",boxSizing:"border-box"}}/>
  </div>
);

export const DTable = ({cols,rows,onRowClick,loading}) => (
  <div style={{background:C.card,borderRadius:12,border:`1px solid ${C.border}`,overflow:"hidden"}}>
    {loading&&<div style={{padding:32,textAlign:"center",color:C.muted,fontSize:13}}>Carregando...</div>}
    {!loading&&(
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr style={{background:C.surface}}>
          {cols.map(c=><th key={c} style={{padding:"11px 14px",textAlign:"left",fontSize:11,color:C.muted,fontWeight:700,borderBottom:`1px solid ${C.border}`}}>{c}</th>)}
        </tr></thead>
        <tbody>
          {rows.map((r,i)=>(
            <tr key={i} onClick={()=>onRowClick&&onRowClick(r._raw)} style={{background:i%2===0?"transparent":C.surface+"50",cursor:onRowClick?"pointer":"default"}}>
              {r.cells.map((c,j)=><td key={j} style={{padding:"11px 14px",fontSize:13,color:C.text}}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    )}
    {!loading&&rows.length===0&&<div style={{padding:32,textAlign:"center",color:C.muted,fontSize:13}}>Nenhum registro encontrado.</div>}
  </div>
);

export const Modal = ({title,onClose,children,wide}) => (
  <div style={{position:"fixed",inset:0,background:"#00000088",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:28,width:wide?720:520,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 16px 48px #00000099"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:22}}>
        <span style={{fontSize:16,fontWeight:700,color:C.text}}>{title}</span>
        <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:18,cursor:"pointer"}}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

export const Toast = ({msg,type,onClose}) => {
  useEffect(()=>{const t=setTimeout(onClose,3500);return()=>clearTimeout(t);},[]);
  const col={success:C.green,error:C.accent,info:C.blue}[type]||C.blue;
  return <div style={{position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",background:C.card,border:`1px solid ${col}`,borderRadius:10,padding:"12px 20px",color:C.text,fontSize:13,fontWeight:600,boxShadow:"0 4px 20px #00000066",zIndex:300,display:"flex",alignItems:"center",gap:10}}>
    <span style={{color:col}}>{type==="success"?"✅":type==="error"?"❌":"ℹ️"}</span>{msg}
  </div>;
};

export const Empty = ({icon,msg,action,onAction}) => (
  <div style={{padding:"48px 24px",textAlign:"center"}}>
    <div style={{fontSize:40,marginBottom:12}}>{icon}</div>
    <div style={{fontSize:14,color:C.muted,marginBottom:16}}>{msg}</div>
    {action&&<Btn onClick={onAction}>{action}</Btn>}
  </div>
);
