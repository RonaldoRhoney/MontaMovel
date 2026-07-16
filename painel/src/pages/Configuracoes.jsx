import { useState, useEffect } from "react";
import { C, STATUS_DEF } from "../theme";
import { supabase } from "../lib/supabase";
import { useDB, useRT } from "../lib/hooks";
import { Badge, Avatar, KpiCard, Sec, Pill, Btn, Inp, Sel, Txta, DTable, Modal, Toast, Empty } from "../components/ui";

// CONFIGURAÇÕES
export const Configuracoes = ({user,toast,onLogout}) => {
  const [sec,setSec]       = useState("empresa");
  const [tenant,setTenant] = useState({});
  const [saving,setSaving] = useState(false);

  useEffect(()=>{
    if(!user?.tenant_id) return;
    supabase.from("tenants").select("*").eq("id",user.tenant_id).single().then(({data})=>data&&setTenant(data));
  },[user]);

  const salvarEmpresa = async() => {
    setSaving(true);
    await supabase.from("tenants").update({
      razao_social:tenant.razao_social,cnpj:tenant.cnpj,
      email:tenant.email,telefone:tenant.telefone,
      cidade:tenant.cidade,estado:tenant.estado,
      updated_at:new Date().toISOString()
    }).eq("id",tenant.id);
    toast("Dados salvos!","success"); setSaving(false);
  };

  const SECS = [
    {id:"empresa",label:"Empresa"},{id:"planos",label:"Planos e Faturamento"},
    {id:"usuarios",label:"Usuários e Permissões"},{id:"regioes",label:"Regiões de Atuação"},
    {id:"whatsapp",label:"Templates WhatsApp"},{id:"integracoes",label:"Integrações (n8n / API)"},
    {id:"lgpd",label:"Segurança e LGPD"},{id:"juridico",label:"Documentos Jurídicos"},
    {id:"suporte",label:"Suporte"},
  ];

  return <div style={{padding:24}}>
    <div style={{display:"grid",gridTemplateColumns:"220px 1fr",gap:22}}>
      <div style={{display:"flex",flexDirection:"column",gap:3}}>
        {SECS.map(s=><button key={s.id} onClick={()=>setSec(s.id)}
          style={{padding:"9px 13px",borderRadius:8,border:"none",background:sec===s.id?C.accent+"18":"transparent",color:sec===s.id?C.accent:C.muted,textAlign:"left",cursor:"pointer",fontSize:13,fontWeight:sec===s.id?700:500}}>{s.label}</button>)}
        <div style={{marginTop:16,borderTop:`1px solid ${C.border}`,paddingTop:14}}>
          <button onClick={async()=>{await supabase.auth.signOut();onLogout();}}
            style={{width:"100%",padding:"9px 13px",borderRadius:8,border:"none",background:"transparent",color:C.accent,textAlign:"left",cursor:"pointer",fontSize:13,fontWeight:600}}>
            ⎋ Sair da Conta
          </button>
        </div>
      </div>

      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:26}}>
        {sec==="empresa"&&<>
          <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:22}}>Dados da Empresa</div>
          <Inp label="Razão Social" value={tenant.razao_social||""} onChange={v=>setTenant({...tenant,razao_social:v})}/>
          <Inp label="CNPJ" value={tenant.cnpj||""} onChange={v=>setTenant({...tenant,cnpj:v})}/>
          <Inp label="E-mail Comercial" value={tenant.email||""} onChange={v=>setTenant({...tenant,email:v})} type="email"/>
          <Inp label="Telefone" value={tenant.telefone||""} onChange={v=>setTenant({...tenant,telefone:v})}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Inp label="Cidade Principal" value={tenant.cidade||""} onChange={v=>setTenant({...tenant,cidade:v})}/>
            <Inp label="Estado" value={tenant.estado||""} onChange={v=>setTenant({...tenant,estado:v})} placeholder="PA"/>
          </div>
          <Btn onClick={salvarEmpresa} disabled={saving}>{saving?"Salvando...":"Salvar Alterações"}</Btn>
        </>}

        {sec==="planos"&&<>
          <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:14}}>Plano Atual</div>
          <div style={{background:C.accent+"11",border:`1px solid ${C.accent}33`,borderRadius:10,padding:18,marginBottom:18}}>
            <div style={{fontSize:20,fontWeight:800,color:C.accent}}>{(tenant.plano||"trial").toUpperCase()}</div>
            <div style={{fontSize:13,color:C.text,marginTop:4}}>
              {{trial:"Trial gratuito (60 dias)",starter:"Starter — R$ 299/mês",pro:"Pro — R$ 699/mês",enterprise:"Enterprise — Customizado"}[tenant.plano]||"—"}
            </div>
            {tenant.trial_fim&&<div style={{fontSize:12,color:C.muted,marginTop:6}}>Expira em: {new Date(tenant.trial_fim).toLocaleDateString("pt-BR")}</div>}
          </div>
          <Btn variant="ghost">Fazer Upgrade</Btn>
        </>}

        {sec==="lgpd"&&<>
          <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:18}}>Segurança e Conformidade LGPD</div>
          {[
            ["DPO (Encarregado)",tenant.dpo_email||"dpo@montamovel.com.br","✅"],
            ["RIPD — Última revisão",tenant.ripd_atualizado||"Não configurado","📅"],
            ["MFA Gestores/Admins","Configurar em Supabase Auth → MFA","🔒"],
            ["Logs de auditoria","Ativos — tabela audit_log (imutável)","✅"],
            ["Criptografia","AES-256 em CPF e dados sensíveis","✅"],
            ["Backups","Supabase Cloud — diários, retenção 30 dias","✅"],
            ["Isolamento multi-tenant","RLS ativo em todas as tabelas","✅"],
            ["Registro INPI (REP-P)","Em processo de registro","⏳"],
          ].map(([k,v,ic])=><div key={k} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${C.border}22`}}>
            <span style={{fontSize:12,color:C.muted}}>{k}</span>
            <span style={{fontSize:12,color:C.text,fontWeight:600}}>{ic} {v}</span>
          </div>)}
          <div style={{marginTop:18,display:"flex",gap:10}}>
            <Btn variant="ghost">Política de Privacidade</Btn>
            <Btn variant="ghost">Termos de Uso</Btn>
            <Btn variant="ghost">DPA (Enterprise)</Btn>
          </div>
        </>}

        {sec==="integracoes"&&<>
          <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:18}}>Integrações</div>
          {[
            {nome:"n8n (Automação WhatsApp/E-mail)",status:"Configurar",cor:C.yellow},
            {nome:"Evolution API / Z-API (WhatsApp)",status:"Configurar",cor:C.yellow},
            {nome:"Google Maps API (Rotas)",status:"Configurar",cor:C.yellow},
            {nome:"eSocial (Ponto REP-P)",status:"Configurar",cor:C.yellow},
            {nome:"API Pública MontaMovel (ERP parceiros)",status:"Em breve",cor:C.muted},
          ].map((int,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${C.border}22`}}>
            <span style={{fontSize:13,color:C.text}}>{int.nome}</span>
            <Btn variant="ghost" small>{int.status}</Btn>
          </div>)}
        </>}

        {!["empresa","planos","lgpd","integracoes"].includes(sec)&&
          <Empty icon="⚙️" msg={`Seção "${SECS.find(s=>s.id===sec)?.label}" — disponível em breve.`} action="Contatar Suporte" onAction={()=>setSec("suporte")}/>}
      </div>
    </div>
  </div>;
};

