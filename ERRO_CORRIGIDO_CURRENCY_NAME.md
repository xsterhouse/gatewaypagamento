# ✅ Erro Corrigido: currency_name

## 🔧 Problema:
```
ERROR: 42703: column "currency_name" of relation "wallets" does not exist
```

## ✅ Solução:
A coluna `currency_name` foi removida de todos os SQLs porque **a tabela já existe** no seu banco sem essa coluna.

---

## 📁 Arquivos Corrigidos:

### 1. **POPULAR_WALLETS_TESTE.sql**
- ✅ Removido `currency_name` de todos os INSERTs
- ✅ Estrutura compatível com tabela existente

### 2. **CRIAR_TABELA_WALLETS.sql**
- ✅ Removido `currency_name` da estrutura
- ✅ Removido da função `create_default_wallet()`

---

## 🚀 Execute Agora:

### **SQL Corrigido para Popular:**
```sql
-- 1. Criar carteira BRL
INSERT INTO public.wallets (
  user_id,
  currency_code,
  currency_type,
  balance,
  available_balance,
  blocked_balance,
  is_active
) VALUES (
  auth.uid(),
  'BRL',
  'fiat',
  10000.00,
  9500.00,
  500.00,
  true
);

-- 2. Verificar
SELECT * FROM wallets WHERE user_id = auth.uid();
```

---

## ✅ Teste Agora:

```
1. Abra: POPULAR_WALLETS_TESTE.sql (corrigido)
2. Copie TODO o conteúdo
3. Supabase → SQL Editor
4. Execute (Ctrl+Enter)
5. ✅ Deve funcionar sem erros!
```

---

## 📊 Estrutura Real da Tabela:

```sql
CREATE TABLE wallets (
  id UUID,
  user_id UUID,
  currency_code TEXT,     -- BRL, BTC, etc
  currency_type TEXT,     -- fiat ou crypto
  balance DECIMAL,
  available_balance DECIMAL,
  blocked_balance DECIMAL,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

**Sem currency_name!**

---

## 🎯 Resultado Esperado:

Após executar o SQL corrigido, os cards mostrarão:

```
┌─────────────────┬────────────────────┬─────────────────┐
│ Total Carteiras │ Saldo Total (BRL)  │ Usuários Ativos │
│       3         │   R$ 10.000,00     │       1         │
└─────────────────┴────────────────────┴─────────────────┘
```

---

**✅ Erro corrigido! Execute o SQL novamente! ✅**
