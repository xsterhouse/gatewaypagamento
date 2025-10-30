# 🔧 Erro Foreign Key Resolvido

## ❌ Erro:
```
update or delete on table "wallets" violates foreign key constraint 
"deposits_wallet_id_fkey" on table "deposits"
```

## 🎯 O Que Significa:

Existe uma tabela `deposits` (depósitos) que está **referenciando** as carteiras.

**Estrutura:**
```
wallets (1) ←── deposits (N)
  └── Uma carteira pode ter vários depósitos
```

**Constraint:**
- Cada depósito tem um `wallet_id` que aponta para uma carteira
- Não pode deletar carteira enquanto houver depósitos vinculados

---

## ✅ Solução: Deletar na Ordem Correta

### **Ordem de Limpeza:**
```
1. deposits   ← PRIMEIRO (dependência)
2. wallets    ← DEPOIS (tabela principal)
```

---

## 🚀 Execute Este SQL:

### **PASSO 1: Limpar Depósitos**
```sql
DELETE FROM public.deposits;
```

### **PASSO 2: Limpar Carteiras**
```sql
DELETE FROM public.wallets;
```

### **PASSO 3: Criar Apenas Sua Carteira**
```sql
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'admin@dimpay.com'  -- SEU EMAIL
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.wallets (
      user_id, currency_code, currency_type,
      balance, available_balance, blocked_balance, is_active
    ) VALUES (
      v_user_id, 'BRL', 'fiat',
      0.00, 0.00, 0.00, true
    );
  END IF;
END $$;
```

---

## 📁 Arquivo Criado:

**LIMPAR_TUDO_COM_DEPENDENCIAS.sql** ⭐
- Limpa na ordem correta
- Verifica o que existe
- Remove dependencies primeiro
- Cria carteira limpa

---

## 🔍 Verificar Outras Dependências:

```sql
-- Ver todas as foreign keys que referenciam wallets
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND ccu.table_name = 'wallets';
```

---

## 💡 Alternativa: CASCADE (Automático)

Se quiser que depósitos sejam deletados **automaticamente** quando deletar carteira:

```sql
-- Modificar constraint para ON DELETE CASCADE
ALTER TABLE public.deposits
DROP CONSTRAINT deposits_wallet_id_fkey;

ALTER TABLE public.deposits
ADD CONSTRAINT deposits_wallet_id_fkey
FOREIGN KEY (wallet_id) 
REFERENCES public.wallets(id) 
ON DELETE CASCADE;  -- ⬅️ Deleta depósitos automaticamente

-- Depois disso, pode fazer:
DELETE FROM wallets;  -- ✅ Funciona sem erro
```

**⚠️ CUIDADO:** CASCADE deleta TUDO relacionado automaticamente!

---

## 📊 Possíveis Tabelas com Dependências:

Verifique se existem:
- ✅ `deposits` (depósitos)
- `transactions` (transações)
- `transfers` (transferências)
- `wallet_history` (histórico)
- `orders` (ordens)

Todas podem referenciar `wallets`!

---

## ✅ Ordem de Limpeza Completa:

```sql
-- 1. Limpar tudo que depende de wallets
DELETE FROM public.deposits;
DELETE FROM public.transactions WHERE wallet_id IS NOT NULL;
DELETE FROM public.transfers WHERE wallet_id IS NOT NULL;
DELETE FROM public.orders WHERE wallet_id IS NOT NULL;

-- 2. Agora pode limpar wallets
DELETE FROM public.wallets;

-- 3. Criar carteira limpa
-- (ver SQL acima)
```

---

## 🎯 Execute Agora:

```
1. Abra: LIMPAR_TUDO_COM_DEPENDENCIAS.sql
2. Execute PASSO 2.1 (DELETE deposits)
3. Execute PASSO 2.3 (DELETE wallets)
4. Execute PASSO 4 (criar carteira)
5. ✅ Pronto! Sistema limpo
```

---

**🎉 Erro resolvido! Execute na ordem correta e funcionará! 🎉**
