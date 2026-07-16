// Mesma identidade visual do painel (docs/MontaMovel_Planejamento_v3.docx §14.2),
// com componentes redimensionados para toque/mobile.
export const C = {
  dark: "#0F1117", surface: "#181C27", card: "#1E2336", border: "#2A2F45",
  accent: "#E94560", blue: "#3B82F6", green: "#22C55E",
  yellow: "#F59E0B", purple: "#8B5CF6", orange: "#FB923C",
  text: "#F0F2F7", muted: "#8891AA", white: "#FFFFFF",
};

export const STATUS_DEF = {
  "Agendada":              { bg: "#1E2F50", text: C.blue,    dot: C.blue },
  "Confirmada":            { bg: "#1B3040", text: "#38BDF8", dot: "#38BDF8" },
  "Em Rota":               { bg: "#2A2010", text: C.yellow,  dot: C.yellow },
  "Em Montagem":           { bg: "#1A2A1A", text: C.green,   dot: C.green },
  "Concluída com Sucesso": { bg: "#0F2A1A", text: "#4ADE80",  dot: "#4ADE80" },
  "Em Assistência":        { bg: "#2A1520", text: C.accent,  dot: C.accent },
  "Atrasada":              { bg: "#2A1000", text: C.orange,  dot: C.orange },
};
