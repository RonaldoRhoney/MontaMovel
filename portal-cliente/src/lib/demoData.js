// Dados fictícios só pro modo demo (VITE_DEMO_MODE=true) — ver ./supabase.js.
// As RPCs portal_* retornam TABLE (array) de verdade, então os mocks abaixo
// também são arrays de 1 item, igual ao formato real do Supabase.
export const DEMO_RPC = {
  portal_get_os: [{
    numero: "OS-1042", status: "Em Rota", prioridade: "Normal",
    data_agendada: new Date().toISOString().split("T")[0], hora_agendada: "09:00:00",
    logradouro: "Av. Nazaré", numero_end: "1200", complemento: "Apto 302", bairro: "Nazaré", cidade: "Belém",
    cliente_nome: "Fernanda Lima", produto_nome: "Guarda-Roupa 6 Portas",
    resultado: null, nps_score: null,
    token_expira_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
  }],
  portal_get_eventos: [
    { tipo: "criacao", created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString() },
    { tipo: "confirmacao", created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
    { tipo: "saida_rota", created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
  ],
  portal_get_meus_dados: [{
    nome: "Fernanda Lima", telefone: "(91) 98888-1111", email: "fernanda@exemplo.com",
    endereco: "Av. Nazaré 1200, Nazaré, Belém, PA",
  }],
};
