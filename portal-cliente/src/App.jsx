import { useState } from "react";
import { C } from "./theme";
import { usePortalOS } from "./lib/usePortalOS";
import { Btn, Card, Toast } from "./components/ui";
import { StatusTimeline } from "./components/StatusTimeline";
import { NpsForm } from "./components/NpsForm";
import { MeusDados } from "./components/MeusDados";

const ReagendarForm = ({ onConfirmar, onCancelar }) => {
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [enviando, setEnviando] = useState(false);
  const hoje = new Date().toISOString().split("T")[0];

  const confirmar = async () => {
    if (!data || !hora) return;
    setEnviando(true);
    await onConfirmar(data, hora);
    setEnviando(false);
  };

  return (
    <Card style={{ marginTop: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 }}>Escolha nova data e horário</div>
      <input type="date" value={data} min={hoje} onChange={e => setData(e.target.value)}
        style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 14, marginBottom: 10 }} />
      <input type="time" value={hora} onChange={e => setHora(e.target.value)}
        style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 14, marginBottom: 14 }} />
      <div style={{ display: "flex", gap: 10 }}>
        <Btn variant="ghost" onClick={onCancelar}>Voltar</Btn>
        <div style={{ flex: 1 }}><Btn onClick={confirmar} disabled={!data || !hora || enviando} full>{enviando ? "Enviando..." : "Confirmar Nova Data"}</Btn></div>
      </div>
    </Card>
  );
};

const CancelarForm = ({ onConfirmar, onCancelar }) => {
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);

  const confirmar = async () => {
    setEnviando(true);
    await onConfirmar(motivo);
    setEnviando(false);
  };

  return (
    <Card style={{ marginTop: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 }}>Por que deseja cancelar?</div>
      <textarea value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Conte o motivo (opcional)" rows={3}
        style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 14, marginBottom: 14, resize: "vertical" }} />
      <div style={{ display: "flex", gap: 10 }}>
        <Btn variant="ghost" onClick={onCancelar}>Voltar</Btn>
        <div style={{ flex: 1 }}><Btn variant="danger" onClick={confirmar} disabled={enviando} full>{enviando ? "Enviando..." : "Confirmar Cancelamento"}</Btn></div>
      </div>
    </Card>
  );
};

export default function App() {
  const { token, os, eventos, loading, erro, confirmar, reagendar, cancelar, responderNps } = usePortalOS();
  const [acao, setAcao] = useState(null); // null | "reagendar" | "cancelar"
  const [toast, setToast] = useState(null);
  const notify = (msg, type = "info") => setToast({ msg, type });

  const wrap = (fn, msgOk) => async (...args) => {
    try { await fn(...args); notify(msgOk, "success"); setAcao(null); }
    catch (e) { notify(e.message, "error"); }
  };

  if (loading) {
    return <div style={{ minHeight: "100dvh", background: C.dark, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: C.text }}>Monta<span style={{ color: C.accent }}>Movel</span></div>
    </div>;
  }

  if (erro || !os) {
    return <div style={{ minHeight: "100dvh", background: C.dark, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Inter',-apple-system,sans-serif" }}>
      <div style={{ textAlign: "center", maxWidth: 320 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔗</div>
        <div style={{ fontSize: 15, color: C.text, fontWeight: 700, marginBottom: 6 }}>Link indisponível</div>
        <div style={{ fontSize: 13, color: C.muted }}>{erro}</div>
      </div>
    </div>;
  }

  const podeAlterar = !["Concluída com Sucesso", "Cancelada", "Em Assistência", "Em Rota", "Em Montagem"].includes(os.status);
  const aguardandoConfirmacao = ["Agendada", "Pendente Confirmação"].includes(os.status);

  return (
    <div style={{ minHeight: "100dvh", background: C.dark, fontFamily: "'Inter',-apple-system,sans-serif", color: C.text, padding: 16, paddingBottom: 40 }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <span style={{ fontSize: 18, fontWeight: 900 }}>Monta<span style={{ color: C.accent }}>Movel</span></span>
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.accent }}>{os.numero}</span>
          {os.prioridade === "Urgente" && <span style={{ fontSize: 11, color: C.yellow, fontWeight: 700 }}>⚡ Urgente</span>}
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginTop: 6 }}>{os.produto_nome || "Montagem"}</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
          📅 {new Date(os.data_agendada + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })} às {os.hora_agendada?.slice(0, 5)}
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>
          📍 {os.logradouro}{os.numero_end ? `, ${os.numero_end}` : ""}{os.complemento ? ` — ${os.complemento}` : ""} · {os.bairro}, {os.cidade}
        </div>

        <StatusTimeline status={os.status} />

        {os.status === "Em Rota" && <div style={{ background: C.yellow + "18", border: `1px solid ${C.yellow}44`, borderRadius: 10, padding: "12px 14px", fontSize: 13, color: C.text, textAlign: "center" }}>🚚 Seu montador está a caminho!</div>}
        {os.status === "Em Montagem" && <div style={{ background: C.green + "18", border: `1px solid ${C.green}44`, borderRadius: 10, padding: "12px 14px", fontSize: 13, color: C.text, textAlign: "center" }}>🔧 Montagem em andamento no seu endereço.</div>}
        {os.status === "Em Assistência" && <div style={{ background: C.accent + "18", border: `1px solid ${C.accent}44`, borderRadius: 10, padding: "12px 14px", fontSize: 13, color: C.text, textAlign: "center" }}>⚠️ Identificamos um problema durante a montagem. Nossa equipe vai entrar em contato para resolver.</div>}
        {os.status === "Cancelada" && <div style={{ background: C.surface, borderRadius: 10, padding: "12px 14px", fontSize: 13, color: C.muted, textAlign: "center" }}>Este agendamento foi cancelado.</div>}
      </Card>

      {aguardandoConfirmacao && acao === null && (
        <div style={{ marginTop: 12 }}>
          <Btn onClick={wrap(confirmar, "Agendamento confirmado!")} full>✅ Confirmar Agendamento</Btn>
        </div>
      )}

      {podeAlterar && acao === null && (
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <div style={{ flex: 1 }}><Btn variant="ghost" onClick={() => setAcao("reagendar")} full>📅 Reagendar</Btn></div>
          <div style={{ flex: 1 }}><Btn variant="ghost" onClick={() => setAcao("cancelar")} full>Cancelar</Btn></div>
        </div>
      )}

      {acao === "reagendar" && <ReagendarForm onConfirmar={wrap(reagendar, "Reagendado com sucesso!")} onCancelar={() => setAcao(null)} />}
      {acao === "cancelar" && <CancelarForm onConfirmar={wrap(cancelar, "Agendamento cancelado.")} onCancelar={() => setAcao(null)} />}

      {os.status === "Concluída com Sucesso" && os.nps_score === null && (
        <div style={{ marginTop: 12 }}>
          <NpsForm onSubmit={wrap(responderNps, "Obrigado pela avaliação!")} />
        </div>
      )}
      {os.status === "Concluída com Sucesso" && os.nps_score !== null && (
        <Card style={{ marginTop: 12, textAlign: "center" }}>
          <div style={{ fontSize: 14, color: C.text }}>🙏 Obrigado por avaliar! Nota: <strong>{os.nps_score}</strong></div>
        </Card>
      )}

      <div style={{ marginTop: 12 }}>
        <MeusDados token={token} />
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
