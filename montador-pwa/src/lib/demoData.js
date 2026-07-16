// Dados fictícios só pro modo demo (VITE_DEMO_MODE=true) — ver ./supabase.js.
export const DEMO = {
  montadores: [
    { id: "m1", nome: "Carlos Silva", telefone: "(91) 99111-2233", tenant_id: "demo-tenant", cidade: "Belém", tipo_contrato: "CLT", status: "Em Campo", nps_medio: 9.2, total_os: 148, ativo: true },
  ],
  ordens_servico: [
    { id: "os1", numero: "OS-1042", status: "Em Rota", prioridade: "Normal", hora_agendada: "09:00", logradouro: "Av. Nazaré", numero_end: "1200", complemento: "Apto 302", bairro: "Nazaré", cidade: "Belém", observacoes: "Portão azul, interfone 302.",
      clientes: { nome: "Fernanda Lima", telefone: "9188881111", whatsapp: "9188881111" }, produtos: { nome: "Guarda-Roupa 6 Portas", descricao: "6 portas, 3 gavetas" } },
    { id: "os2", numero: "OS-1043", status: "Agendada", prioridade: "Urgente", hora_agendada: "13:00", logradouro: "Tv. Padre Eutíquio", numero_end: "540", complemento: "", bairro: "Marco", cidade: "Belém", observacoes: "",
      clientes: { nome: "Roberto Alves", telefone: "9188882222", whatsapp: "9188882222" }, produtos: { nome: "Cama Box Casal", descricao: "" } },
    { id: "os3", numero: "OS-1044", status: "Concluída com Sucesso", prioridade: "Normal", hora_agendada: "07:30", logradouro: "Rua dos Mundurucus", numero_end: "88", complemento: "", bairro: "Umarizal", cidade: "Belém", observacoes: "",
      clientes: { nome: "Juliana Cardoso", telefone: "9188883333", whatsapp: "9188883333" }, produtos: { nome: "Armário de Cozinha", descricao: "" } },
  ],
  os_eventos: [],
  ponto_registros: [],
};

export const DEMO_RPC = {};
