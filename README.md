# Gateway de Pagamento 💳

Sistema completo de gateway de pagamento construído com React, TypeScript, Vite, Tailwind CSS e Supabase.

## 🚀 Tecnologias

- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS
- **shadcn/ui** - Componentes UI
- **Supabase** - Backend as a Service (Auth + Database)
- **React Router** - Roteamento
- **Recharts** - Gráficos
- **Lucide React** - Ícones
- **Zod** - Validação de schemas
- **React Hook Form** - Gerenciamento de formulários
- **Sonner** - Sistema de notificações/toasts

## 📋 Funcionalidades

### ✅ Autenticação e Segurança
- Sistema completo de login/registro
- Autenticação via Supabase Auth
- Proteção de rotas privadas
- Row Level Security (RLS) no banco de dados
- Logout seguro

### ✅ Dashboard
- Métricas em tempo real
- Saldo disponível, recebido hoje, bloqueio cautelar
- Gráfico de faturamento (entradas vs saídas)
- Métricas de conversão por método de pagamento
- Cards de ação rápida

### ✅ Gestão Financeira
- Visualização de transações
- Sistema de faturas
- Relatórios com paginação
- Exportação para CSV
- Filtros por status

### ✅ Checkout
- Criação de links de pagamento
- Gerenciamento de links
- Copiar e compartilhar links
- Status de links (ativo/inativo/expirado)

### ✅ Outros Recursos
- Programa de premiações com pontos
- Central de ajuda com FAQs
- Configurações de conta e perfil
- Comunicação com gerente
- Sistema de notificações toast

## 🛠️ Instalação

1. Clone o repositório
2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:

Crie um arquivo `.env` na raiz do projeto com:

```env
VITE_SUPABASE_URL=https://swokojvoiqowqoyngues.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
```

4. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

## 🗄️ Banco de Dados

O projeto utiliza Supabase com as seguintes tabelas:

- `users` - Usuários do sistema (integrado com Supabase Auth)
- `transactions` - Transações de pagamento
- `invoices` - Faturas
- `rewards` - Premiações
- `checkout_links` - Links de pagamento
- `settings` - Configurações
- `messages` - Mensagens para gerente

### Segurança
- **Row Level Security (RLS)** habilitado em todas as tabelas
- Políticas de acesso baseadas no usuário autenticado
- Dados isolados por usuário

## 📦 Build

Para criar uma build de produção:

```bash
npm run build
```

## 🎨 Design

O design segue o padrão dark theme com cores:
- Background: `#0a0e13` e `#0f1419`
- Primary: Verde esmeralda `#10b981`
- Cards: `#1a1f2e`

## 👤 Como Usar

### Primeiro Acesso

1. Acesse a aplicação em `http://localhost:5173`
2. Clique em "Criar conta" na tela de login
3. Preencha seus dados (nome, email e senha)
4. Faça login com as credenciais criadas

### Funcionalidades Principais

- **Dashboard**: Visualize todas as métricas e gráficos
- **Transações**: Gerencie pagamentos recebidos
- **Checkout**: Crie links de pagamento personalizados
- **Relatórios**: Exporte dados em CSV
- **Configurações**: Personalize sua conta

## 🔐 Recursos de Segurança

- ✅ Autenticação JWT via Supabase
- ✅ Validação de formulários com Zod
- ✅ Proteção de rotas privadas
- ✅ RLS (Row Level Security) no banco
- ✅ Sanitização de inputs
- ✅ HTTPS em produção (via Supabase)

## 📄 Licença

MIT
