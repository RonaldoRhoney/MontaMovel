import { useEffect, useState, useCallback } from "react";
import { C } from "../theme";
import { supabase } from "../lib/supabase";
import { getPosition } from "../lib/geo";
import { writeOrQueue } from "../lib/offlineQueue";
import { actions } from "../lib/actions";
import { Btn, Card } from "../components/ui";

const TIPOS = [
  { tipo: "entrada", label: "Entrada", icon: "🟢" },
  { tipo: "saida_intervalo", label: "Saída p/ Intervalo", icon: "⏸️" },
  { tipo: "retorno_intervalo", label: "Retorno do Intervalo", icon: "▶️" },
  { tipo: "saida", label: "Saída Final", icon: "🔴" },
];

export const Ponto = ({ montador, toast }) => {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!montador) return;
    setLoading(true);
    const hoje = new Date().toISOString().split("T")[0];
    const { data } = await supabase.from("ponto_registros").select("*")
      .eq("montador_id", montador.id).eq("data", hoje).order("hora_registro");
    setRegistros(data || []);
    setLoading(false);
  }, [montador]);

  useEffect(() => { load(); }, [load]);

  const proximoTipo = () => {
    const feitos = registros.map(r => r.tipo);
    for (const t of TIPOS) if (!feitos.includes(t.tipo)) return t.tipo;
    return null;
  };
  const proximo = TIPOS.find(t => t.tipo === proximoTipo());

  const registrar = async () => {
    if (!proximo) return;
    setBusy(true);
    const { lat, lng } = await getPosition();
    const payload = { montadorId: montador.id, tenantId: montador.tenant_id, tipo: proximo.tipo, lat, lng };
    const res = await writeOrQueue("ponto", payload, [], () => actions.ponto(payload));
    setBusy(false);
    toast(res.queued ? "Sem conexão — marcação salva e será enviada depois." : `${proximo.label} registrada!`, res.queued ? "info" : "success");
    if (!res.queued) await load();
  };

  return (
    <div style={{ padding: "16px 16px 90px" }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 4 }}>Registro de Ponto</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>{new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</div>

      {proximo ? (
        <Btn onClick={registrar} disabled={busy} full>{proximo.icon} {busy ? "Registrando..." : proximo.label}</Btn>
      ) : (
        <Card><div style={{ textAlign: "center", color: C.green, fontWeight: 700 }}>✅ Jornada de hoje completa</div></Card>
      )}

      <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, margin: "24px 0 10px" }}>MARCAÇÕES DE HOJE</div>
      {loading && <div style={{ textAlign: "center", color: C.muted, padding: 20 }}>Carregando...</div>}
      {!loading && registros.length === 0 && <div style={{ fontSize: 13, color: C.muted, textAlign: "center", padding: 20 }}>Nenhuma marcação ainda.</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {registros.map(r => {
          const t = TIPOS.find(t => t.tipo === r.tipo);
          return (
            <Card key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, color: C.text }}>{t?.icon} {t?.label}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{new Date(r.hora_registro).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
