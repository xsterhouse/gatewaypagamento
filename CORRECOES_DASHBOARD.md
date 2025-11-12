# 🔧 Correções Necessárias no Dashboard

## 📊 Problemas Identificados:

### 1. ❌ "Recebido Hoje" mostra R$ 0,00
**Causa:** Dashboard busca em `wallet_transactions` com status `'approved'`, mas PIX está em `pix_transactions` com status `'completed'`

### 2. ❌ "Conversão" não está calculando corretamente
**Causa:** Precisa integrar dados de PIX + outras transações

---

## ✅ Soluções:

### Solução 1: Criar View Unificada (Recomendado)

Criar uma view que une `pix_transactions` + `wallet_transactions`:

```sql
-- Criar view unificada de todas as transações
CREATE OR REPLACE VIEW all_transactions_view AS
SELECT 
  id,
  user_id,
  'pix' as source,
  'deposit' as type,
  amount,
  CASE 
    WHEN status = 'completed' THEN 'approved'
    WHEN status = 'pending' THEN 'pending'
    WHEN status = 'failed' THEN 'rejected'
    ELSE status
  END as status,
  'pix' as payment_method,
  created_at,
  completed_at as processed_at,
  description
FROM pix_transactions
WHERE status IN ('completed', 'pending')

UNION ALL

SELECT 
  id,
  user_id,
  'wallet' as source,
  transaction_type as type,
  amount,
  status,
  payment_method,
  created_at,
  processed_at,
  description
FROM wallet_transactions
WHERE status IN ('approved', 'pending');

-- Verificar se funcionou
SELECT 
  source,
  type,
  status,
  SUM(amount) as total,
  COUNT(*) as count
FROM all_transactions_view
WHERE user_id = '619c17c8-091c-458e-a083-9b2f67cfcee6'
GROUP BY source, type, status;
```

### Solução 2: Atualizar Dashboard para Buscar PIX

Modificar `Dashboard.tsx` para buscar também de `pix_transactions`:

```typescript
// Buscar transações PIX
const { data: pixTransactions } = await supabase
  .from('pix_transactions')
  .select('*')
  .eq('user_id', effectiveUserId)
  .in('status', ['completed', 'pending'])

// Normalizar PIX para formato de wallet_transactions
const normalizedPix = pixTransactions?.map(pix => ({
  id: pix.id,
  user_id: pix.user_id,
  type: 'deposit',
  amount: pix.amount,
  status: pix.status === 'completed' ? 'approved' : pix.status,
  payment_method: 'pix',
  created_at: pix.created_at,
  processed_at: pix.completed_at,
  description: pix.description
})) || []

// Combinar com wallet_transactions
const allTransactions = [...(transactions || []), ...normalizedPix]
```

### Solução 3: Inserir em wallet_transactions (Mais Simples)

Quando PIX for aprovado, criar registro em `wallet_transactions`:

```sql
-- Inserir transação PIX em wallet_transactions
INSERT INTO wallet_transactions (
  user_id,
  wallet_id,
  transaction_type,
  amount,
  status,
  payment_method,
  description,
  reference_id,
  processed_at
)
SELECT 
  pt.user_id,
  w.id as wallet_id,
  'deposit' as transaction_type,
  pt.amount,
  'approved' as status,
  'pix' as payment_method,
  pt.description,
  pt.id as reference_id,
  pt.completed_at as processed_at
FROM pix_transactions pt
JOIN wallets w ON w.user_id = pt.user_id
WHERE pt.id = 'c825e573-72c2-4d9d-b9e1-91bbd6a5e945'
AND NOT EXISTS (
  SELECT 1 FROM wallet_transactions 
  WHERE reference_id = pt.id
);

-- Verificar
SELECT * FROM wallet_transactions 
WHERE reference_id = 'c825e573-72c2-4d9d-b9e1-91bbd6a5e945';
```

---

## 🎯 Recomendação:

**Use a Solução 3** (mais simples) para corrigir agora:

1. Execute o SQL acima para criar o registro em `wallet_transactions`
2. Recarregue o dashboard
3. "Recebido Hoje" deve mostrar R$ 10,00

**Para produção**, implemente a **Solução 1** (view unificada) ou **Solução 2** (buscar PIX no código).

---

## 📊 Cards do Dashboard:

### Card 1: Saldo Disponível ✅
- **Status:** Funcionando
- **Fonte:** `wallets.available_balance`
- **Valor atual:** R$ 9,05

### Card 2: Recebido Hoje ❌
- **Status:** Mostrando R$ 0,00
- **Problema:** Não busca `pix_transactions`
- **Correção:** Solução 3 acima

### Card 3: Saldo Bloqueado ✅
- **Status:** Funcionando
- **Fonte:** `balance_locks` ou `wallets.blocked_balance`

### Card 4: Faturamento Total ❌
- **Status:** Pode estar incorreto
- **Problema:** Não conta PIX
- **Correção:** Mesma solução 3

### Card 5: Ticket Médio ❌
- **Status:** Pode estar incorreto
- **Problema:** Não conta PIX
- **Correção:** Mesma solução 3

### Card 6: Média Diária ❌
- **Status:** Pode estar incorreto
- **Problema:** Não conta PIX
- **Correção:** Mesma solução 3

### Card 7: Conversão ❓
- **Status:** Precisa verificar o que calcula
- **Fonte:** Depende da lógica implementada

---

## 🚀 Execute Agora:

```sql
-- Corrigir dashboard inserindo PIX em wallet_transactions
INSERT INTO wallet_transactions (
  user_id,
  wallet_id,
  transaction_type,
  amount,
  status,
  payment_method,
  description,
  reference_id,
  processed_at
)
SELECT 
  pt.user_id,
  w.id as wallet_id,
  'deposit' as transaction_type,
  pt.amount,
  'approved' as status,
  'pix' as payment_method,
  COALESCE(pt.description, 'Depósito via PIX') as description,
  pt.id::text as reference_id,
  pt.completed_at as processed_at
FROM pix_transactions pt
JOIN wallets w ON w.user_id = pt.user_id
WHERE pt.id = 'c825e573-72c2-4d9d-b9e1-91bbd6a5e945'
AND NOT EXISTS (
  SELECT 1 FROM wallet_transactions 
  WHERE reference_id = pt.id::text
);
```

Depois **recarregue o dashboard (F5)** e todos os cards devem atualizar! ✅
