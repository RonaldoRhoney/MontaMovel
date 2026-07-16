// Dados fictícios só pro modo demo (VITE_DEMO_MODE=true) — ver ./supabase.js.
// Nada aqui é persistido de verdade; serve pra navegar pela interface sem um Supabase real.
export const DEMO = {
  users: [
    { id: "demo-user", tenant_id: "demo-tenant", nome: "Ana Ferreira",  email: "ana@montamovel.demo",     telefone: "(91) 98000-0001", role: "gestor",    ativo: true },
    { id: "u2",        tenant_id: "demo-tenant", nome: "Bruno Tavares", email: "bruno@montamovel.demo",   telefone: "(91) 98000-0002", role: "atendente", ativo: true },
    { id: "u3",        tenant_id: "demo-tenant", nome: "Camila Souza",  email: "camila@montamovel.demo",  telefone: "(91) 98000-0003", role: "admin",     ativo: true },
  ],
  tenants: [{
    id: "demo-tenant", razao_social: "MontaMovel Demo Ltda", cnpj: "12.345.678/0001-90",
    email: "contato@montamovel.demo", telefone: "(91) 3000-0000",
    plano: "pro", cidade: "Belém", estado: "PA",
    n8n_webhook_url: "", webhook_secret: "8f2c1a9d3e7b4f6081c5a2d9e0f4b7c3a1d6e8f",
  }],
  montadores: [
    { id: "m1", nome: "Carlos Silva",  telefone: "(91) 99111-2233", cidade: "Belém",      tipo_contrato: "CLT",      status: "Em Campo",    nps_medio: 9.2, total_os: 148, ativo: true },
    { id: "m2", nome: "João Pereira",  telefone: "(91) 99222-3344", cidade: "Belém",      tipo_contrato: "PJ",       status: "Em Rota",     nps_medio: 8.7, total_os: 96,  ativo: true },
    { id: "m3", nome: "Marcos Souza",  telefone: "(91) 99333-4455", cidade: "Ananindeua", tipo_contrato: "CLT",      status: "Disponível",  nps_medio: 9.5, total_os: 210, ativo: true },
    { id: "m4", nome: "Rafael Costa",  telefone: "(91) 99444-5566", cidade: "Belém",      tipo_contrato: "Autonomo", status: "Atrasado",    nps_medio: 7.8, total_os: 64,  ativo: true },
  ],
  clientes: [
    { id: "c1", nome: "Fernanda Lima",   telefone: "(91) 98888-1111", whatsapp: "(91) 98888-1111", bairro: "Nazaré",         cidade: "Belém", canal_origem: "self_service", ativo: true },
    { id: "c2", nome: "Roberto Alves",   telefone: "(91) 98888-2222", whatsapp: "(91) 98888-2222", bairro: "Marco",          cidade: "Belém", canal_origem: "atendente",   ativo: true },
    { id: "c3", nome: "Juliana Cardoso", telefone: "(91) 98888-3333", whatsapp: "(91) 98888-3333", bairro: "Umarizal",       cidade: "Belém", canal_origem: "whatsapp",    ativo: true },
  ],
  produtos: [
    { id: "p1", nome: "Guarda-Roupa 6 Portas", sku: "GR-001", categoria: "quarto",  complexidade: "complexa", tempo_estimado: 120, ativo: true },
    { id: "p2", nome: "Cama Box Casal",        sku: "CB-014", categoria: "quarto",  complexidade: "simples",  tempo_estimado: 45,  ativo: true },
    { id: "p3", nome: "Armário de Cozinha",    sku: "AC-009", categoria: "cozinha", complexidade: "media",    tempo_estimado: 90,  ativo: true },
  ],
  ordens_servico: [
    { id: "os1", numero: "OS-1042", status: "Em Montagem",           prioridade: "Normal",  hora_agendada: "09:00", bairro: "Nazaré",          clientes: { nome: "Fernanda Lima" },   produtos: { nome: "Guarda-Roupa 6 Portas" }, montadores: { nome: "Carlos Silva" } },
    { id: "os2", numero: "OS-1043", status: "Em Rota",               prioridade: "Urgente", hora_agendada: "10:30", bairro: "Marco",           clientes: { nome: "Roberto Alves" },   produtos: { nome: "Cama Box Casal" },        montadores: { nome: "João Pereira" } },
    { id: "os3", numero: "OS-1044", status: "Agendada",              prioridade: "Normal",  hora_agendada: "14:00", bairro: "Umarizal",        clientes: { nome: "Juliana Cardoso" }, produtos: { nome: "Armário de Cozinha" },    montadores: { nome: "Marcos Souza" } },
    { id: "os4", numero: "OS-1039", status: "Concluída com Sucesso", prioridade: "Normal",  hora_agendada: "08:00", bairro: "Batista Campos",  clientes: { nome: "Fernanda Lima" },   produtos: { nome: "Cama Box Casal" },        montadores: { nome: "Rafael Costa" } },
    { id: "os5", numero: "OS-1040", status: "Em Assistência",        prioridade: "Urgente", hora_agendada: "11:00", bairro: "Pedreira",        clientes: { nome: "Roberto Alves" },   produtos: { nome: "Guarda-Roupa 6 Portas" }, montadores: { nome: "Carlos Silva" } },
  ],
  notificacoes: [
    { id: "n1", tipo: "alerta",  mensagem: "OS-1040 em assistência — peça faltante.", lida: false, created_at: new Date().toISOString() },
    { id: "n2", tipo: "sucesso", mensagem: "OS-1039 concluída com NPS 10.",           lida: false, created_at: new Date().toISOString() },
  ],
  estoque: [
    { id: "e1", nome: "Dobradiça Reforçada", quantidade: 12,  minimo: 20,  unidade: "un" },
    { id: "e2", nome: "Parafuso 6x40",       quantidade: 340, minimo: 100, unidade: "un" },
  ],
  comunicacoes_log: [
    { id: "cl1", canal: "whatsapp", tipo: "confirmacao", status: "lido", created_at: new Date().toISOString(), ordens_servico: { numero: "OS-1042" }, clientes: { nome: "Fernanda Lima" } },
  ],
};

export const DEMO_RPC = {
  dashboard_resumo: {
    os_hoje: 5, concluidas: 1, assistencias: 1, nps_medio: 8.9,
    montadores_ativos: 4, atrasadas: 1, em_andamento: 2, estoque_critico: 1,
  },
};
