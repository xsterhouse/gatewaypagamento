# 📋 Estrutura de Roles do Sistema

## **Tipos de Usuários**

### **1. Admin (Administrador)**
- **Role:** `admin`
- **Acesso:** Painel Admin completo
- **Permissões:**
  - ✅ Gerenciar todos os usuários (clientes)
  - ✅ Criar e gerenciar Gerentes
  - ✅ Acessar Configurações Avançadas
  - ✅ Gerenciar carteiras de todos
  - ✅ Gerenciar faturas de todos
  - ✅ Ver logs e relatórios completos
  - ✅ Impersonar clientes
- **Onde aparece:**
  - Apenas em Configurações Avançadas (se houver lista de admins)

### **2. Manager (Gerente)**
- **Role:** `manager`
- **Acesso:** Painel Admin (mesmas rotas do admin)
- **Permissões:**
  - ✅ Gerenciar clientes atribuídos
  - ✅ Acessar todas as funcionalidades do painel admin
  - ✅ Ver e gerenciar carteiras dos clientes
  - ✅ Ver e gerenciar faturas dos clientes
  - ✅ Impersonar clientes
  - ❌ NÃO pode criar outros gerentes
  - ❌ NÃO pode acessar Configurações Avançadas
- **Onde aparece:**
  - **Apenas** em Configurações Avançadas (lista de gerentes)
  - **NÃO aparece** na lista de Usuários (Clientes)

### **3. User/Cliente**
- **Role:** `user` (ou sem role definida)
- **Acesso:** Painel Cliente
- **Permissões:**
  - ✅ Ver e gerenciar suas próprias carteiras
  - ✅ Ver suas faturas
  - ✅ Fazer depósitos e transferências
  - ✅ Ver seu extrato
  - ❌ NÃO tem acesso ao painel admin
- **Onde aparece:**
  - **Apenas** na lista de Usuários (Clientes) no painel admin
  - **NÃO aparece** em Configurações Avançadas

## **Filtros Implementados**

### **AdminPanel (Gerenciar Usuários)**
```typescript
// Carrega APENAS clientes (exclui admin e manager)
.neq('role', 'admin')
.neq('role', 'manager')
```

### **ConfiguracoesAvancadas (Gerenciar Gerentes)**
```typescript
// Carrega APENAS gerentes
.eq('role', 'manager')
```

## **Rotas e Permissões**

### **Rotas do Cliente:**
- `/` - Dashboard
- `/gerente` - Gerente
- `/financeiro` - Financeiro
- `/relatorios` - Relatórios
- `/premiacoes` - Premiações
- `/checkout` - Checkout
- `/wallets` - Carteiras
- `/exchange` - Exchange
- `/deposits` - Depósitos
- `/extrato` - Extrato

### **Rotas do Admin/Gerente:**
- `/admin` - Gerenciar Usuários (Clientes)
- `/admin/dashboard` - Dashboard Admin
- `/admin/settings` - Configurações
- `/admin/configuracoes-avancadas` - Gerenciar Gerentes (APENAS ADMIN)
- `/admin/tickets` - Tickets de Suporte
- `/admin/transactions` - Transações
- `/admin/logs` - Logs
- `/admin/wallets` - Gerenciar Carteiras
- `/admin/exchange` - Exchange Admin
- `/admin/deposits` - Depósitos Admin
- `/admin/invoices` - Gerenciar Faturas
- `/kyc` - Gerenciar KYC

## **Fluxo de Autenticação**

### **Admin/Gerente tenta acessar rota de cliente:**
```
1. ProtectedRoute detecta role = admin ou manager
2. Verifica se está impersonando
3. Se NÃO está impersonando:
   - Redireciona para /admin/dashboard
4. Se ESTÁ impersonando:
   - Permite acesso (vê como cliente)
```

### **Cliente tenta acessar rota de admin:**
```
1. ProtectedRoute detecta role = user
2. Bloqueia acesso
3. Mantém na rota atual ou redireciona para dashboard cliente
```

## **Criação de Gerentes**

### **Processo:**
1. Admin acessa Configurações Avançadas
2. Clica em "Criar Gerente"
3. Preenche dados:
   - Nome
   - Email
   - CPF
   - WhatsApp
   - Senha
   - Foto (opcional)
   - Máximo de clientes
4. Sistema cria:
   - Usuário no Auth (supabase.auth)
   - Registro na tabela users com role='manager'
5. Gerente pode fazer login e acessar painel admin

## **Logs de Debug**

### **AdminPanel:**
```
📋 Carregando apenas CLIENTES (excluindo admin e manager)...
✅ Clientes carregados: 5
```

### **ProtectedRoute:**
```
👤 Tipo de usuário: Admin
👤 Tipo de usuário: Gerente
👤 Tipo de usuário: Cliente
🔀 Admin/Gerente acessando rota cliente, redirecionando...
```

## **Resumo Visual**

```
┌─────────────────────────────────────────────────────┐
│                    ADMIN                            │
│  • Acessa tudo                                      │
│  • Cria gerentes                                    │
│  • Gerencia clientes                                │
│  • Aparece: Config. Avançadas                       │
└─────────────────────────────────────────────────────┘
                        │
                        ├─────────────────────────────┐
                        │                             │
┌───────────────────────▼───────┐   ┌────────────────▼──────────┐
│         GERENTE                │   │        CLIENTE            │
│  • Acessa painel admin         │   │  • Acessa painel cliente  │
│  • Gerencia clientes           │   │  • Gerencia suas carteiras│
│  • Não cria gerentes           │   │  • Vê suas faturas        │
│  • Aparece: Config. Avançadas  │   │  • Aparece: Usuários      │
└────────────────────────────────┘   └───────────────────────────┘
```
