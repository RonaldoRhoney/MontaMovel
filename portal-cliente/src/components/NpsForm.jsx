import { useState } from "react";
import { C } from "../theme";
import { Btn, Card } from "./ui";

export const NpsForm = ({ onSubmit }) => {
  const [score, setScore] = useState(null);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    if (score === null) return;
    setEnviando(true);
    await onSubmit(score, comentario);
    setEnviando(false);
  };

  return (
    <Card>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>Como foi sua experiência?</div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>De 0 a 10, qual a chance de você recomendar a MontaMovel?</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6, marginBottom: 14 }}>
        {Array.from({ length: 11 }, (_, i) => i).map(n => (
          <button key={n} onClick={() => setScore(n)} style={{
            padding: "10px 0", borderRadius: 8, border: `1px solid ${score === n ? C.accent : C.border}`,
            background: score === n ? C.accent : C.surface, color: score === n ? C.white : C.text,
            fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}>{n}</button>
        ))}
      </div>
      <textarea value={comentario} onChange={e => setComentario(e.target.value)} placeholder="Quer contar mais alguma coisa? (opcional)" rows={3}
        style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 14, marginBottom: 14, resize: "vertical" }} />
      <Btn onClick={enviar} disabled={score === null || enviando} full>{enviando ? "Enviando..." : "Enviar Avaliação"}</Btn>
    </Card>
  );
};
