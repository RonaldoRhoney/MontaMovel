import { C } from "../theme";
import { supabase } from "../lib/supabase";
import { Btn, Card } from "../components/ui";

export const Perfil = ({ montador }) => (
  <div style={{ padding: "16px 16px 90px" }}>
    <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 16 }}>Perfil</div>
    <Card style={{ marginBottom: 16, textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.accent + "22", border: `2px solid ${C.accent}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: C.accent, margin: "0 auto 12px" }}>
        {(montador?.nome || "?").substring(0, 2).toUpperCase()}
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, color: C.text }}>{montador?.nome}</div>
      <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{montador?.telefone}</div>
      <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{montador?.tipo_contrato} · {montador?.cidade}</div>
    </Card>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
      <Card style={{ textAlign: "center" }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.yellow }}>{montador?.nps_medio || "—"}</div>
        <div style={{ fontSize: 11, color: C.muted }}>NPS Médio</div>
      </Card>
      <Card style={{ textAlign: "center" }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.blue }}>{montador?.total_os || 0}</div>
        <div style={{ fontSize: 11, color: C.muted }}>OS Concluídas</div>
      </Card>
    </div>
    <Btn variant="ghost" full onClick={() => supabase.auth.signOut()}>Sair</Btn>
  </div>
);
