import { useEffect, useState, useCallback } from "react";
import { C } from "../theme";
import { supabase } from "../lib/supabase";
import { Badge, Card, Empty } from "../components/ui";

export const Rota = ({ montador, onAbrirOS }) => {
  const [os, setOs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!montador) return;
    setLoading(true);
    const hoje = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("ordens_servico")
      .select("id,numero,status,prioridade,hora_agendada,logradouro,numero_end,bairro,clientes(nome,telefone),produtos(nome)")
      .eq("montador_id", montador.id)
      .eq("data_agendada", hoje)
      .order("hora_agendada");
    setOs(data || []);
    setLoading(false);
  }, [montador]);

  useEffect(() => { load(); }, [load]);

  const concluidas = os.filter(o => o.status === "Concluída com Sucesso" || o.status === "Em Assistência").length;

  return (
    <div style={{ padding: "16px 16px 90px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>Sua rota hoje</div>
          <div style={{ fontSize: 13, color: C.muted }}>{new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</div>
        </div>
        <div style={{ fontSize: 13, color: C.muted, fontWeight: 700 }}>{concluidas}/{os.length}</div>
      </div>

      {loading && <div style={{ textAlign: "center", color: C.muted, padding: 32 }}>Carregando...</div>}
      {!loading && os.length === 0 && <Empty icon="🗓️" msg="Nenhuma OS agendada para hoje." />}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {os.map((o, i) => (
          <Card key={o.id} onClick={() => onAbrirOS(o.id)} style={{ display: "flex", gap: 12 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.surface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: C.muted, flexShrink: 0 }}>{i + 1}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>{o.numero}</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{o.hora_agendada?.slice(0, 5)}</span>
              </div>
              <div style={{ fontSize: 14, color: C.text, fontWeight: 600, marginTop: 2 }}>{o.clientes?.nome}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{o.produtos?.nome || "—"}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{o.logradouro}{o.numero_end ? `, ${o.numero_end}` : ""} · {o.bairro}</div>
              <div style={{ marginTop: 6, display: "flex", gap: 6, alignItems: "center" }}>
                <Badge status={o.status} />
                {o.prioridade === "Urgente" && <span style={{ fontSize: 11, color: C.orange, fontWeight: 700 }}>⚡ Urgente</span>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
