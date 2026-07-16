import { C } from "../theme";

const ITEMS = [
  { id: "rota", icon: "🗺️", label: "Rota" },
  { id: "ponto", icon: "⏱️", label: "Ponto" },
  { id: "perfil", icon: "👤", label: "Perfil" },
];

export const BottomNav = ({ ativo, setAtivo }) => (
  <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.surface, borderTop: `1px solid ${C.border}`, display: "flex", paddingBottom: "env(safe-area-inset-bottom)", zIndex: 50 }}>
    {ITEMS.map(it => (
      <button key={it.id} onClick={() => setAtivo(it.id)} style={{
        flex: 1, padding: "10px 0 8px", background: "none", border: "none", cursor: "pointer",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
        color: ativo === it.id ? C.accent : C.muted,
      }}>
        <span style={{ fontSize: 20 }}>{it.icon}</span>
        <span style={{ fontSize: 11, fontWeight: ativo === it.id ? 700 : 500 }}>{it.label}</span>
      </button>
    ))}
  </nav>
);
