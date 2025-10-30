# 🚀 Funcionalidades Conectadas ao Banco de Dados

## ✅ Páginas do Cliente Conectadas

### 📊 Dashboard (Dashboard.tsx)
**Status:** ✅ Totalmente conectado

**Dados Reais:**
- ✅ Saldo Disponível - busca de `wallets.available_balance`
- ✅ Saldo Bloqueado - busca de `wallets.blocked_balance`
- ✅ Recebido Hoje - soma de transações do dia
- ✅ Faturamento Total - soma de todas transações aprovadas
- ✅ Ticket Médio - média de valor por transação
- ✅ Quantidade de Transações - contagem total

**Queries:**
```sql
-- Busca carteira BRL do usuário
SELECT balance, available_balance, blocked_balance 
FROM wallets 
WHERE user_id = $userId 
AND currency_code = 'BRL' 
AND is_active = true

-- Busca transações do usuário
SELECT * FROM transactions 
WHERE user_id = $userId
```

### 💰 Wallets (Wallets.tsx)
**Status:** ✅ Totalmente conectado

**Dados Reais:**
- ✅ Lista todas as carteiras do usuário (BRL, USD, BTC, ETH, etc.)
- ✅ Mostra saldo total, disponível e bloqueado
- ✅ Filtra por tipo (fiat ou crypto)
- ✅ Botão de atualização funcional

**Queries:**
```sql
SELECT * FROM wallets 
WHERE user_id = $userId 
AND is_active = true
ORDER BY currency_type ASC, currency_code ASC
```

### 📜 Extrato (Extrato.tsx)
**Status:** ✅ Totalmente conectado e filtrado

**Dados Reais:**
- ✅ Lista transações do usuário logado
- ✅ Paginação funcional
- ✅ Filtros por status, data e valor
- ✅ Busca por descrição ou método
- ✅ Métricas calculadas (total, taxas, ticket médio)

**Queries:**
```sql
SELECT * FROM transactions 
WHERE user_id = $userId
ORDER BY created_at DESC
LIMIT $pageSize OFFSET $offset
```

### 💳 Deposits (Deposits.tsx)
**Status:** ✅ Conectado ao useAuth

**Dados Reais:**
- ✅ Lista depósitos do usuário
- ✅ Mostra status (pendente, aprovado, rejeitado)
- ✅ Ordenado por data

**Queries:**
```sql
SELECT * FROM deposits 
WHERE user_id = $userId
ORDER BY created_at DESC
```

### 🔄 Exchange (Exchange.tsx)
**Status:** ✅ Conectado com preços reais

**Funcionalidades:**
- ✅ Busca pares de trading do banco
- ✅ Integração com CoinGecko para preços em tempo real
- ✅ Atualização automática a cada 5 minutos
- ✅ Suporte para múltiplas criptomoedas

## 📋 Estrutura de Tabelas Utilizadas

### `wallets` (Carteiras)
```sql
- id (uuid)
- user_id (uuid) → users.id
- currency_code (text) -- BRL, USD, BTC, ETH, etc
- currency_type (text) -- 'fiat' ou 'crypto'
- balance (numeric) -- Saldo total
- available_balance (numeric) -- Saldo disponível
- blocked_balance (numeric) -- Saldo bloqueado
- is_active (boolean)
- created_at, updated_at
```

### `transactions` (Transações)
```sql
- id (uuid)
- user_id (uuid) → users.id
- amount (numeric)
- status (text) -- 'pending', 'approved', 'rejected'
- payment_method (text) -- 'pix', 'credit_card', etc
- description (text)
- created_at
```

### `deposits` (Depósitos)
```sql
- id (uuid)
- user_id (uuid) → users.id
- amount (numeric)
- method (text) -- 'pix', 'ted', 'boleto'
- status (text) -- 'pending', 'approved', 'rejected'
- created_at
- processed_at
```

### `trading_pairs` (Pares de Exchange)
```sql
- id (uuid)
- base_currency (text) -- ex: BTC
- quote_currency (text) -- ex: BRL
- fee_percentage (numeric)
- is_active (boolean)
```

## 🔐 Autenticação e Segurança

### Context de Autenticação
Todas as páginas usam `useAuth()` que fornece:
- `effectiveUserId` - ID do usuário (ou usuário personificado para admins)
- `userData` - Dados completos do usuário
- `user` - Sessão do Supabase

### Row Level Security (RLS)
As tabelas devem ter políticas RLS configuradas:
```sql
-- Exemplo para wallets
CREATE POLICY "Users can view own wallets"
ON wallets FOR SELECT
USING (auth.uid() = user_id);

-- Exemplo para transactions
CREATE POLICY "Users can view own transactions"
ON transactions FOR SELECT
USING (auth.uid() = user_id);
```

## 🎨 Temas

### Suporte a Tema Claro
✅ Todas as páginas foram atualizadas para funcionar em tema claro e escuro:
- Dashboard
- Financeiro
- Relatórios
- Premiações
- Checkout
- Configurações
- Central de Ajuda
- Modais (Gerar PIX, Solicitar Saque)

### Classes Utilizadas
- `text-foreground` (textos principais)
- `text-muted-foreground` (textos secundários)
- `bg-card` (fundo de cards)
- `bg-background` (fundo de inputs)
- `border-border` (bordas)
- `bg-accent` (backgrounds alternativos)

## 🔧 Hooks Customizados

### `usePagination`
Para gerenciar paginação nas listagens:
```typescript
const { currentPage, pageSize, offset, goToPage, getTotalPages } = usePagination(1, 10)
```

### `useCryptoPrices`
Para buscar preços de criptomoedas:
```typescript
const { prices, loading, lastUpdate, updateFromAPI } = useCryptoPrices({ 
  autoUpdate: true, 
  updateInterval: 5 
})
```

## 📱 Responsividade

Todas as páginas são responsivas e usam:
- Grid responsivo: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
- Tailwind breakpoints: `sm:`, `md:`, `lg:`, `xl:`
- Elementos ocultos em mobile: `hidden md:block`

## 🚨 Logs de Debug

Todas as páginas principais incluem logs no console:
- 📊 Dashboard Stats
- 💰 Depósitos carregados
- 📜 Transações carregadas
- 🪙 Preços de criptomoedas

Para debug, abra o Console do navegador (F12).

## 🎯 Próximos Passos Sugeridos

1. **Implementar ações reais nos modais:**
   - GerarPixModal: Criar transação de depósito
   - SolicitarSaqueModal: Criar transação de saque

2. **Criar políticas RLS completas**
3. **Implementar webhooks para atualização em tempo real**
4. **Adicionar testes automatizados**
5. **Implementar sistema de notificações**

## 📝 Notas Importantes

- Todos os valores monetários usam `numeric` no banco
- Datas usam `timestamptz` (timezone aware)
- IDs são `uuid` gerados automaticamente
- Use `effectiveUserId` para queries (suporta impersonation)
- Sempre trate erros e mostre feedback ao usuário com `toast`

---

**Última atualização:** 29 de Outubro de 2025
**Versão:** 1.0
