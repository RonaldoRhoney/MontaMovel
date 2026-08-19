import { C } from "../theme";

const Section = ({title,children}) => (
  <div style={{marginBottom:16}}>
    <div style={{fontSize:13,fontWeight:700,color:C.accent,marginBottom:6}}>{title}</div>
    <div style={{fontSize:13,color:C.text,lineHeight:1.65}}>{children}</div>
  </div>
);

export const PoliticaPrivacidade = () => (
  <div>
    <div style={{fontSize:11,color:C.muted,marginBottom:16}}>Última atualização: julho de 2026</div>

    <Section title="1. Quem somos">
      O <strong>MontaMovel</strong> é um SaaS de gestão de montagem de móveis, operado pela RhoneyInc. Este documento explica quais dados coletamos no painel administrativo e como usamos.
      <div style={{marginTop:4,color:C.muted}}>Contato: rhoneyinc@gmail.com</div>
    </Section>

    <Section title="2. Quais dados coletamos">
      Dados de conta (nome, e-mail, telefone, papel), dados operacionais que sua empresa cadastra (ordens de serviço, clientes, montadores, produtos, rotas, estoque, ponto), e dados sensíveis como CPF de clientes/montadores — armazenados com criptografia AES-256.
    </Section>

    <Section title="3. Uso de Inteligência Artificial">
      O painel possui um assistente de IA (botão flutuante) por módulo, que processa as mensagens digitadas pelo usuário através de um provedor de IA de terceiro (<strong>Anthropic/Claude</strong>). Dados enviados: o texto digitado na conversa e um contexto mínimo (nome e papel do usuário logado, módulo atual). Antes do primeiro uso desse recurso, mostramos um aviso explicando isso. Esses dados não são usados para treinar modelos. Evite colar CPF ou dados sensíveis de clientes na conversa — o assistente não filtra automaticamente esse tipo de informação.
    </Section>

    <Section title="4. Compartilhamento de dados">
      Não vendemos dados pessoais. Compartilhamos apenas com: <strong>Supabase</strong> (banco de dados e autenticação, com isolamento multi-tenant via RLS), <strong>Anthropic/Claude</strong> (apenas quando o assistente de IA é usado, conforme item 3), e <strong>autoridades</strong> quando exigido por lei.
    </Section>

    <Section title="5. Seus direitos (LGPD — Lei 13.709/2018)">
      Acessar, corrigir e exportar seus dados; revogar consentimento do uso de IA a qualquer momento (basta não usar o recurso); solicitar a exclusão da sua conta e dados vinculados via Configurações → Sua Conta.
    </Section>

    <Section title="6. Retenção e exclusão">
      Dados são mantidos enquanto a conta/empresa estiver ativa. Ao excluir sua conta, seu usuário de autenticação é apagado permanentemente. Registros operacionais de titularidade da empresa (OS, clientes) seguem a política de retenção do tenant, não do usuário individual.
    </Section>

    <Section title="7. Segurança">
      TLS em todas as comunicações, autenticação via Supabase Auth, Row Level Security por tenant, criptografia AES-256 em CPF e dados sensíveis, backups diários.
    </Section>
  </div>
);
