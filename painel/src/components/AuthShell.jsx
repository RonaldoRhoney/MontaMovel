import { Sparkles, Zap, ShieldCheck, MapPinned } from "lucide-react";
import { C } from "../theme";
import { useIsMobile } from "../lib/useIsMobile";

const PROPS = [
  { Icon: Zap, text: "Da OS ao comprovante assinado, tudo num só lugar" },
  { Icon: MapPinned, text: "Rota otimizada e status em tempo real pro cliente" },
  { Icon: ShieldCheck, text: "Multi-tenant com isolamento total entre empresas" },
];

// Layout de auth com painel de marca (some em telas estreitas) — usado por
// Login e Cadastro pra não duplicar o "hero" visual dos dois.
export const AuthShell = ({subtitle,children}) => {
  const isMobile = useIsMobile(980);
  return (
    <div style={{minHeight:"100vh",background:C.gradDark,display:"flex",fontFamily:"'Inter',-apple-system,sans-serif",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:"-15%",left:"-10%",width:480,height:480,borderRadius:"50%",background:C.accent,opacity:0.14,filter:"blur(90px)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:"-20%",right:"-10%",width:520,height:520,borderRadius:"50%",background:C.blue,opacity:0.12,filter:"blur(100px)",pointerEvents:"none"}}/>

      {!isMobile && (
        <div className="mm-animate-in" style={{flex:"0 0 44%",display:"flex",flexDirection:"column",justifyContent:"center",padding:"0 64px",position:"relative"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:28}}>
            <span style={{width:38,height:38,borderRadius:11,background:C.gradAccent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:C.white,boxShadow:C.glowAccent}}>M</span>
            <span style={{fontSize:19,fontWeight:800,color:C.text}}>Monta<span style={{color:C.accent}}>Movel</span></span>
          </div>
          <h1 style={{fontSize:34,fontWeight:800,color:C.text,lineHeight:1.2,letterSpacing:-0.8,margin:"0 0 16px"}}>
            A operação de montagem, <span style={{background:C.gradAccent,WebkitBackgroundClip:"text",backgroundClip:"text",color:"transparent"}}>sem planilha</span>.
          </h1>
          <p style={{fontSize:14,color:C.muted,lineHeight:1.7,maxWidth:400,margin:"0 0 32px"}}>
            Do agendamento à assinatura do cliente — em qualquer lugar do Brasil.
          </p>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {PROPS.map((p,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:12}}>
                <span style={{width:32,height:32,borderRadius:9,background:C.card,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",color:C.accent,flexShrink:0}}>
                  <p.Icon size={15}/>
                </span>
                <span style={{fontSize:13,color:C.text}}>{p.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mm-animate-in" style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:24,position:"relative"}}>
        <div style={{width:"min(92vw,400px)"}}>
          {isMobile && (
            <div style={{textAlign:"center",marginBottom:8}}>
              <span style={{width:38,height:38,borderRadius:11,background:C.gradAccent,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:C.white,boxShadow:C.glowAccent,marginBottom:10}}>M</span>
              <div style={{fontSize:20,fontWeight:800,color:C.text}}>Monta<span style={{color:C.accent}}>Movel</span></div>
            </div>
          )}
          <div style={{background:C.gradSurface,border:`1px solid ${C.border}`,borderRadius:18,padding:"36px 28px",boxShadow:C.shadowLg}}>
            <div style={{textAlign:"center",marginBottom:26,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              <Sparkles size={13} color={C.accent}/>
              <span style={{fontSize:13,color:C.muted}}>{subtitle}</span>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
