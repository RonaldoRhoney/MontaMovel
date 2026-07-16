// Parser de CSV mínimo (sem dependência externa) — suficiente pro caso de uso:
// exportações simples de ERP/planilha, sem vírgulas dentro de campos entre aspas
// complexos demais. Se o provedor de origem exportar algo mais exótico, é mais
// simples pedir pra reexportar em CSV padrão do que arrastar uma lib inteira.
export function parseCsv(texto) {
  const linhas = texto.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (linhas.length < 2) return [];
  const cols = linhas[0].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
  return linhas.slice(1).map((linha) => {
    const valores = linha.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const obj = {};
    cols.forEach((c, i) => { obj[c] = valores[i] ?? ""; });
    return obj;
  });
}
