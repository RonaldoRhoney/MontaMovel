import { C } from "../theme";

export const Btn = ({ children, onClick, variant = "primary", disabled, full }) => (
  <button onClick={onClick} disabled={disabled} style={{
    width: full ? "100%" : undefined, padding: "14px 20px", borderRadius: 12,
    border: variant === "ghost" ? `1px solid ${C.border}` : "none",
    background: variant === "primary" ? C.accent : variant === "danger" ? "transparent" : variant === "success" ? C.green : C.card,
    color: variant === "primary" || variant === "success" ? C.white : variant === "danger" ? C.accent : C.text,
    fontSize: 15, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
  }}>{children}</button>
);

export const Card = ({ children, style }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, ...style }}>{children}</div>
);

export const Toast = ({ msg, type = "info", onClose }) => {
  const col = { success: C.green, error: C.accent, info: C.blue }[type];
  setTimeout(onClose, 3500);
  return (
    <div style={{ position: "fixed", bottom: 24, left: 16, right: 16, background: C.card, border: `1px solid ${col}`, borderRadius: 12, padding: "12px 16px", color: C.text, fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px #00000066", zIndex: 300 }}>
      {type === "success" ? "✅ " : type === "error" ? "❌ " : "ℹ️ "}{msg}
    </div>
  );
};
