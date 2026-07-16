import { useRef, useState, useEffect } from "react";
import { C } from "../theme";
import { Btn } from "./ui";

// Assinatura eletrônica avançada (plano §12.3): captura o traço num canvas e
// devolve um Blob PNG; quem chama grava lat/lng/ip/timestamp junto.
export const SignaturePad = ({ onConfirm, onCancel }) => {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [hasStroke, setHasStroke] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = C.text;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
  }, []);

  const pos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return { x: p.clientX - rect.left, y: p.clientY - rect.top };
  };

  const start = (e) => { drawing.current = true; const { x, y } = pos(e); const ctx = canvasRef.current.getContext("2d"); ctx.beginPath(); ctx.moveTo(x, y); };
  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const { x, y } = pos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(x, y); ctx.stroke();
    setHasStroke(true);
  };
  const end = () => { drawing.current = false; };

  const limpar = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStroke(false);
  };

  const confirmar = () => {
    canvasRef.current.toBlob((blob) => onConfirm(blob), "image/png");
  };

  return (
    <div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>Peça para o cliente assinar com o dedo abaixo:</div>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: 180, background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, touchAction: "none" }}
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}
      />
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <Btn variant="ghost" onClick={limpar}>Limpar</Btn>
        <Btn variant="ghost" onClick={onCancel}>Cancelar</Btn>
        <div style={{ flex: 1 }}><Btn onClick={confirmar} disabled={!hasStroke} full>Confirmar assinatura</Btn></div>
      </div>
    </div>
  );
};
