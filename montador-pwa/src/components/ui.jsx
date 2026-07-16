import { C, STATUS_DEF } from "../theme";

export const Badge = ({ status }) => {
  const s = STATUS_DEF[status] || { bg: C.card, text: C.muted, dot: C.muted };
  return (
    <span style={{ background: s.bg, color: s.text, border: `1px solid ${s.dot}22`, borderRadius: 20, padding: "4px 11px", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />{status}
    </span>
  );
};

export const Btn = ({ children, onClick, variant = "primary", disabled, full }) => (
  <button onClick={onClick} disabled={disabled} style={{
    width: full ? "100%" : undefined, padding: "14px 20px", borderRadius: 12,
    border: variant === "ghost" ? `1px solid ${C.border}` : "none",
    background: variant === "primary" ? C.accent : variant === "success" ? C.green : variant === "ghost" ? "transparent" : C.card,
    color: variant === "primary" || variant === "success" ? C.white : C.text,
    fontSize: 15, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
  }}>{children}</button>
);

export const Card = ({ children, onClick, style }) => (
  <div onClick={onClick} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, cursor: onClick ? "pointer" : "default", ...style }}>
    {children}
  </div>
);

export const Empty = ({ icon, msg }) => (
  <div style={{ padding: "48px 24px", textAlign: "center" }}>
    <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
    <div style={{ fontSize: 14, color: C.muted }}>{msg}</div>
  </div>
);

export const Toast = ({ msg, type = "info", onClose }) => {
  const col = { success: C.green, error: C.accent, info: C.blue }[type];
  setTimeout(onClose, 3000);
  return (
    <div style={{ position: "fixed", bottom: 90, left: 16, right: 16, background: C.card, border: `1px solid ${col}`, borderRadius: 12, padding: "12px 16px", color: C.text, fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px #00000066", zIndex: 300 }}>
      {type === "success" ? "✅ " : type === "error" ? "❌ " : "ℹ️ "}{msg}
    </div>
  );
};

export const OfflineBar = ({ pending }) => (
  <div style={{ background: C.orange, color: C.dark, fontSize: 12, fontWeight: 700, textAlign: "center", padding: "6px 0" }}>
    ⚠ Sem conexão — {pending > 0 ? `${pending} ação(ões) na fila` : "trabalhando offline"}
  </div>
);
