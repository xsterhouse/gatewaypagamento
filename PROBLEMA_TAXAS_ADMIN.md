# 🚨 PROBLEMA: Taxas do Admin Não Estão Sendo Contabilizadas

## 📊 Situação Atual (INCORRETO):

### Fluxo do Pagamento:
```
Cliente paga PIX: R$ 10,00
├─ Taxa (9,5%): R$ 0,95
└─ Líquido: R$ 9,05 → Carteira do CLIENTE

❌ PROBLEMA: Taxa de R$ 0,95 está SUMINDO!
```

### O que está acontecendo:

1. **Cliente paga:** R$ 10,00
2. **Sistema calcula:**
   - `amount`: R$ 10,00
   - `fee_amount`: R$ 0,95 (9,5%)
   - `net_amount`: R$ 9,05
3. **Sistema credita:** R$ 9,05 na carteira do cliente
4. **❌ Taxa de R$ 0,95 NÃO vai para lugar nenhum!**

### Admin Dashboard:
```sql
-- Linha 303 do AdminDashboard.tsx
gatewayBalance: totalBalance  // ❌ Soma TODOS os saldos dos clientes!
```

**Resultado:** Admin vê o mesmo saldo que o cliente (R$ 9,05) porque está somando as carteiras dos clientes, não uma carteira própria!

---

## ✅ SOLUÇÃO: Criar Carteira do Admin

### 1. Criar Carteira "Conta Mãe" (Admin)

```sql
-- Criar carteira do admin para receber taxas
INSERT INTO wallets (
  user_id,
  currency_type,
  currency_code,
  balance,
  available_balance,
  blocked_balance,
  is_active,
  wallet_name
)
SELECT 
  u.id,
  'fiat',
  'BRL',
  0,
  0,
  0,
  true,
  'Conta Mãe - Taxas Gateway'
FROM users u
WHERE u.role = 'admin'
LIMIT 1;
```

### 2. Modificar Fluxo de Pagamento

Quando PIX é aprovado:

```typescript
// 1. Creditar líquido para cliente
UPDATE wallets
SET balance = balance + 9.05
WHERE user_id = 'cliente_id';

// 2. Creditar taxa para admin
UPDATE wallets
SET balance = balance + 0.95
WHERE user_id = 'admin_id' AND wallet_name = 'Conta Mãe - Taxas Gateway';

// 3. Registrar ambas transações
INSERT INTO wallet_transactions (...)
VALUES 
  ('cliente_id', 'credit', 9.05, 'Depósito PIX'),
  ('admin_id', 'credit', 0.95, 'Taxa Gateway - PIX');
```

### 3. Atualizar AdminDashboard

```typescript
// Buscar carteira específica do admin
const { data: adminWallet } = await supabase
  .from('wallets')
  .select('balance, available_balance')
  .eq('wallet_name', 'Conta Mãe - Taxas Gateway')
  .single()

setStats({
  ...stats,
  gatewayBalance: adminWallet.balance,  // ✅ Saldo real das taxas
  gatewayAvailableBalance: adminWallet.available_balance
})
```

---

## 📋 Fluxo Correto:

```
Cliente paga PIX: R$ 10,00
│
├─ R$ 9,05 (Líquido) → Carteira do CLIENTE
│  └─ wallet_transactions: credit, R$ 9,05
│
└─ R$ 0,95 (Taxa) → Carteira do ADMIN (Conta Mãe)
   └─ wallet_transactions: credit, R$ 0,95, 'Taxa Gateway'
```

### Resultado:
- **Cliente:** R$ 9,05 disponível ✅
- **Admin (Conta Mãe):** R$ 0,95 de taxas ✅
- **Total no sistema:** R$ 10,00 ✅

---

## 🔧 Implementação:

### Passo 1: Criar Carteira Admin
Execute SQL acima no Supabase

### Passo 2: Modificar `vite-api-plugin.ts`
Adicionar lógica para creditar taxa ao admin quando PIX for aprovado

### Passo 3: Modificar `AdminDashboard.tsx`
Buscar saldo da carteira "Conta Mãe - Taxas Gateway"

### Passo 4: Criar Webhook Handler
Quando Mercado Pago notificar pagamento aprovado:
1. Creditar líquido ao cliente
2. Creditar taxa ao admin
3. Registrar ambas transações

---

## 📊 Exemplo Real:

### Transação 1: Cliente paga R$ 10,00
```
Cliente:
  Antes: R$ 0,00
  Depois: R$ 9,05 (+R$ 9,05)

Admin (Conta Mãe):
  Antes: R$ 0,00
  Depois: R$ 0,95 (+R$ 0,95)
```

### Transação 2: Cliente paga R$ 50,00
```
Cliente:
  Antes: R$ 9,05
  Depois: R$ 54,30 (+R$ 45,25)
  Taxa: R$ 4,75 (9,5%)

Admin (Conta Mãe):
  Antes: R$ 0,95
  Depois: R$ 5,70 (+R$ 4,75)
```

### Dashboard Admin:
```
Conta Mãe - Saldo: R$ 5,70
Taxas Hoje: R$ 5,70
Total de Clientes: R$ 54,30
```

---

## ⚠️ IMPORTANTE:

**Atualmente, as taxas estão sendo "perdidas"!**

Cada pagamento que entra:
- ✅ Cliente recebe o líquido
- ❌ Taxa não vai para ninguém
- ❌ Admin não acumula receita

**Isso precisa ser corrigido URGENTEMENTE!**
