export const C = {
  dark:"#0F1117",surface:"#181C27",card:"#1E2336",cardHi:"#242A40",border:"#2A2F45",
  accent:"#E94560",blue:"#3B82F6",green:"#22C55E",
  yellow:"#F59E0B",purple:"#8B5CF6",orange:"#FB923C",
  text:"#F0F2F7",muted:"#8891AA",white:"#FFFFFF",

  // Camada de profundidade — o app parecia chapado sem isso. Gradientes sutis
  // (nunca berrantes) + sombras coloridas fazem os elementos primários
  // "flutuarem" em vez de serem só um retângulo com borda.
  gradAccent:"linear-gradient(135deg,#F2597A 0%,#E94560 45%,#C81E4A 100%)",
  gradBlue:"linear-gradient(135deg,#60A5FA 0%,#3B82F6 100%)",
  gradGreen:"linear-gradient(135deg,#4ADE80 0%,#22C55E 100%)",
  gradPurple:"linear-gradient(135deg,#A78BFA 0%,#8B5CF6 100%)",
  gradSurface:"linear-gradient(165deg,#1E2336 0%,#181C27 100%)",
  gradDark:"radial-gradient(circle at 20% -10%,#1E2336 0%,#0F1117 55%)",

  shadowSm:"0 1px 2px #00000033",
  shadowMd:"0 4px 16px #00000044",
  shadowLg:"0 16px 48px #00000066",
  glowAccent:"0 0 0 1px #E9456022, 0 8px 24px -8px #E9456066",
  glowBlue:"0 0 0 1px #3B82F622, 0 8px 24px -8px #3B82F666",
};

export const STATUS_DEF = {
  "Agendada":             {bg:"#1E2F50",text:C.blue,   dot:C.blue},
  "Confirmada":           {bg:"#1B3040",text:"#38BDF8",dot:"#38BDF8"},
  "Pendente Confirmação": {bg:"#1A1A2E",text:"#8B5CF6",dot:"#8B5CF6"},
  "Em Rota":              {bg:"#2A2010",text:"#F59E0B",dot:"#F59E0B"},
  "Em Montagem":          {bg:"#1A2A1A",text:"#22C55E",dot:"#22C55E"},
  "Concluída com Sucesso":{bg:"#0F2A1A",text:"#4ADE80",dot:"#4ADE80"},
  "Em Assistência":       {bg:"#2A1520",text:"#E94560",dot:"#E94560"},
  "Reagendada":           {bg:"#1E1B2A",text:"#8B5CF6",dot:"#8B5CF6"},
  "Cancelada":            {bg:"#1E1E1E",text:"#8891AA",dot:"#8891AA"},
  "Atrasada":             {bg:"#2A1000",text:"#FB923C",dot:"#FB923C"},
  "Crítico":              {bg:"#2A1520",text:"#E94560",dot:"#E94560"},
  "Alerta":               {bg:"#2A1A00",text:"#F59E0B",dot:"#F59E0B"},
  "OK":                   {bg:"#0F2A1A",text:"#4ADE80",dot:"#4ADE80"},
  "Ativo":                {bg:"#0F2A1A",text:"#4ADE80",dot:"#4ADE80"},
  "Inativo":              {bg:"#1E1E1E",text:"#8891AA",dot:"#8891AA"},
  "Beta":                 {bg:"#1E1B2A",text:"#8B5CF6",dot:"#8B5CF6"},
  "Zerado":               {bg:"#2A1520",text:"#E94560",dot:"#E94560"},
  "Disponível":           {bg:"#0F2A1A",text:"#4ADE80",dot:"#4ADE80"},
  "Utilizado":            {bg:"#1E1E1E",text:"#8891AA",dot:"#8891AA"},
};
