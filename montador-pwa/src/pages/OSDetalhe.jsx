import { useEffect, useState, useCallback, useRef } from "react";
import { C } from "../theme";
import { supabase } from "../lib/supabase";
import { getPosition } from "../lib/geo";
import { writeOrQueue } from "../lib/offlineQueue";
import { actions } from "../lib/actions";
import { Badge, Btn, Card } from "../components/ui";
import { SignaturePad } from "../components/SignaturePad";

const MOTIVOS = ["Peça Faltante", "Avaria", "Produto Incorreto", "Cliente Ausente", "Acesso Negado", "Outro"];

export const OSDetalhe = ({ osId, montador, session, onVoltar, toast }) => {
  const [os, setOs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [fotos, setFotos] = useState([]);
  const [assinando, setAssinando] = useState(false);
  const [assistindo, setAssistindo] = useState(false);
  const [motivo, setMotivo] = useState(MOTIVOS[0]);
  const [obs, setObs] = useState("");
  const [fabricante, setFabricante] = useState("");
  const [fabricantes, setFabricantes] = useState([]);
  const fileInputRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("ordens_servico")
      .select("id,numero,status,prioridade,hora_agendada,logradouro,numero_end,complemento,bairro,cidade,observacoes,clientes(nome,telefone,whatsapp),produtos(nome,descricao)")
      .eq("id", osId).single();
    setOs(data);
    const { data: eventos } = await supabase.from("os_eventos").select("id,tipo,foto_url").eq("os_id", osId).eq("tipo", "foto");
    setFotos(eventos || []);
    setLoading(false);
  }, [osId]);

  useEffect(() => { load(); }, [load]);

  const ctx = () => ({ osId, tenantId: montador.tenant_id, userId: session.user.id, montadorId: montador.id });

  const run = async (type, extra, files) => {
    setBusy(true);
    const payload = { ...ctx(), ...extra };
    const res = await writeOrQueue(type, payload, files, () => actions[type](payload, files));
    setBusy(false);
    toast(res.queued ? "Sem conexão — ação salva e será enviada depois." : "Feito!", res.queued ? "info" : "success");
    if (!res.queued) await load();
    return res;
  };

  const iniciarRota = async () => {
    const { lat, lng } = await getPosition();
    await run("iniciar_rota", { lat, lng });
  };

  const checkin = async () => {
    const { lat, lng } = await getPosition();
    await run("checkin", { lat, lng });
  };

  const enviarFoto = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const res = await run("foto", {}, [file]);
    if (res.queued) setFotos(f => [...f, { id: crypto.randomUUID(), tipo: "foto", pendente: true }]);
  };

  const confirmarAssinatura = async (blob) => {
    setAssinando(false);
    const { lat, lng } = await getPosition();
    await run("finalizar_sucesso", { lat, lng }, [blob]);
  };

  const abrirAssistencia = async () => {
    setAssistindo(true);
    if (fabricantes.length === 0) {
      const { data } = await supabase.from("fabricantes").select("id,nome").eq("ativo", true).order("nome");
      setFabricantes(data || []);
    }
  };

  const confirmarAssistencia = async () => {
    const { lat, lng } = await getPosition();
    const existente = fabricantes.find(f => f.nome.toLowerCase() === fabricante.trim().toLowerCase());
    await run("finalizar_assistencia", {
      motivo, observacoes: obs, lat, lng,
      fabricanteId: existente?.id || null,
      fabricanteNome: existente ? null : fabricante.trim() || null,
    });
    setAssistindo(false);
  };

  if (loading || !os) return <div style={{ padding: 32, textAlign: "center", color: C.muted }}>Carregando...</div>;

  const finalizada = os.status === "Concluída com Sucesso" || os.status === "Em Assistência";
  const podeIniciarRota = ["Agendada", "Confirmada", "Pendente Confirmação", "Atrasada"].includes(os.status);
  const emRota = os.status === "Em Rota";
  const emMontagem = os.status === "Em Montagem";

  return (
    <div style={{ padding: "16px 16px 32px" }}>
      <Btn variant="ghost" onClick={onVoltar}>← Voltar</Btn>

      <div style={{ marginTop: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>{os.numero}</span>
          <Badge status={os.status} />
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginTop: 6 }}>{os.clientes?.nome}</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{os.produtos?.nome}</div>
      </div>

      <Card style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 6 }}>ENDEREÇO</div>
        <div style={{ fontSize: 14, color: C.text }}>{os.logradouro}{os.numero_end ? `, ${os.numero_end}` : ""}{os.complemento ? ` — ${os.complemento}` : ""}</div>
        <div style={{ fontSize: 13, color: C.muted }}>{os.bairro} · {os.cidade}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          {os.clientes?.telefone && <a href={`tel:${os.clientes.telefone}`} style={{ flex: 1 }}><Btn variant="ghost" full>📞 Ligar</Btn></a>}
          {os.clientes?.whatsapp && <a href={`https://wa.me/55${os.clientes.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" style={{ flex: 1 }}><Btn variant="ghost" full>💬 WhatsApp</Btn></a>}
        </div>
      </Card>

      {os.observacoes && (
        <Card style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 6 }}>OBSERVAÇÕES</div>
          <div style={{ fontSize: 13, color: C.text }}>{os.observacoes}</div>
        </Card>
      )}

      {!finalizada && (
        <Card style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 10 }}>FOTOS ({fotos.length})</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            {fotos.map(f => (
              <div key={f.id} style={{ width: 56, height: 56, borderRadius: 8, background: C.surface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, opacity: f.pendente ? 0.5 : 1 }}>
                {f.pendente ? "⏳" : "📷"}
              </div>
            ))}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={enviarFoto} style={{ display: "none" }} />
          <Btn variant="ghost" full onClick={() => fileInputRef.current?.click()}>📷 Tirar Foto</Btn>
        </Card>
      )}

      {podeIniciarRota && <Btn onClick={iniciarRota} disabled={busy} full>🚚 Iniciar Rota</Btn>}
      {emRota && <Btn onClick={checkin} disabled={busy} full>📍 Cheguei — Check-in</Btn>}

      {emMontagem && !assinando && !assistindo && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Btn variant="success" onClick={() => setAssinando(true)} disabled={busy || fotos.length === 0} full>✅ Concluir com Sucesso</Btn>
          {fotos.length === 0 && <div style={{ fontSize: 12, color: C.muted, textAlign: "center" }}>Tire ao menos 1 foto antes de concluir.</div>}
          <Btn variant="ghost" onClick={abrirAssistencia} disabled={busy} full>⚠️ Registrar Assistência</Btn>
        </div>
      )}

      {assinando && (
        <Card>
          <SignaturePad onConfirm={confirmarAssinatura} onCancel={() => setAssinando(false)} />
        </Card>
      )}

      {assistindo && (
        <Card>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 8 }}>MOTIVO</div>
          <select value={motivo} onChange={e => setMotivo(e.target.value)} style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 14, marginBottom: 12 }}>
            {MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 8 }}>FABRICANTE DO MÓVEL</div>
          <input value={fabricante} onChange={e => setFabricante(e.target.value)} list="lista-fabricantes" placeholder="Ex: DJ Móveis"
            style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 14, marginBottom: 4 }} />
          <datalist id="lista-fabricantes">
            {fabricantes.map(f => <option key={f.id} value={f.nome} />)}
          </datalist>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>Não achou na lista? Digite o nome — cadastra na hora.</div>

          <textarea value={obs} onChange={e => setObs(e.target.value)} placeholder="Detalhes do ocorrido..." rows={3}
            style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 14, marginBottom: 12, resize: "vertical" }} />
          {fotos.length === 0 && <div style={{ fontSize: 12, color: C.orange, marginBottom: 12 }}>⚠ Recomendado: registre fotos como evidência antes de confirmar.</div>}
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="ghost" onClick={() => { setAssistindo(false); setFabricante(""); }}>Cancelar</Btn>
            <div style={{ flex: 1 }}><Btn onClick={confirmarAssistencia} disabled={busy} full>Confirmar Assistência</Btn></div>
          </div>
        </Card>
      )}

      {finalizada && (
        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, color: os.status === "Concluída com Sucesso" ? C.green : C.accent }}>
            {os.status === "Concluída com Sucesso" ? "✅ Montagem concluída com sucesso." : "⚠️ OS convertida em assistência."}
          </div>
        </Card>
      )}
    </div>
  );
};
