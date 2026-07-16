import { C } from "../theme";

const PASSOS = [
  { status: "Confirmada", label: "Confirmado", icon: "✅" },
  { status: "Em Rota", label: "A caminho", icon: "🚚" },
  { status: "Em Montagem", label: "Em montagem", icon: "🔧" },
  { status: "Concluída com Sucesso", label: "Concluído", icon: "🏁" },
];

const ORDEM = ["Agendada", "Pendente Confirmação", "Confirmada", "Reagendada", "Em Rota", "Em Montagem", "Concluída com Sucesso"];

export const StatusTimeline = ({ status }) => {
  if (status === "Cancelada" || status === "Em Assistência") return null;
  const atualIdx = ORDEM.indexOf(status);

  return (
    <div style={{ display: "flex", justifyContent: "space-between", margin: "20px 0" }}>
      {PASSOS.map((p, i) => {
        const passoIdx = ORDEM.indexOf(p.status);
        const feito = atualIdx >= passoIdx && atualIdx >= 0;
        return (
          <div key={p.status} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, position: "relative" }}>
            {i > 0 && <div style={{ position: "absolute", top: 15, right: "50%", width: "100%", height: 2, background: feito ? C.accent : C.border, zIndex: 0 }} />}
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: feito ? C.accent : C.surface, border: `2px solid ${feito ? C.accent : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, zIndex: 1 }}>
              {feito ? p.icon : ""}
            </div>
            <div style={{ fontSize: 10, color: feito ? C.text : C.muted, fontWeight: feito ? 700 : 500, textAlign: "center", marginTop: 6 }}>{p.label}</div>
          </div>
        );
      })}
    </div>
  );
};
