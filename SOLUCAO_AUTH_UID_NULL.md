# 🔧 Solução: auth.uid() retorna NULL

## ❌ Problema:
```
ERROR: null value in column "user_id" violates not-null constraint
```

**Causa:** `auth.uid()` não funciona no SQL Editor do Supabase porque você não está "logado" no contexto SQL.

---

## ✅ Solução: 3 Opções

### **OPÇÃO 1: Buscar por Email (Mais Fácil)** ⭐

Execute este SQL (substitua o email):

```sql
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Buscar seu user_id pelo email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'admin@dimpay.com'  -- ⬅️ MUDE AQUI
  LIMIT 1;

  -- Inserir carteira BRL
  INSERT INTO public.wallets (
    user_id,
    currency_code,
    currency_type,
    balance,
    available_balance,
    blocked_balance,
    is_active
  ) VALUES (
    v_user_id,
    'BRL',
    'fiat',
    10000.00,
    9500.00,
    500.00,
    true
  )
  ON CONFLICT (user_id, currency_code) 
  DO UPDATE SET
    balance = 10000.00,
    available_balance = 9500.00,
    blocked_balance = 500.00;

  RAISE NOTICE 'Carteira criada para: %', v_user_id;
END $$;
```

**Passos:**
1. Substitua `'admin@dimpay.com'` pelo seu email
2. Execute no SQL Editor
3. ✅ Pronto!

---

### **OPÇÃO 2: Descobrir UUID e Usar Direto**

#### Passo 1: Descobrir seu UUID
```sql
SELECT id, email, name 
FROM auth.users 
WHERE email = 'seu-email@exemplo.com';
```

#### Passo 2: Usar o UUID
```sql
INSERT INTO public.wallets (
  user_id,
  currency_code,
  currency_type,
  balance,
  available_balance,
  blocked_balance,
  is_active
) VALUES (
  'cole-uuid-aqui'::UUID,  -- ⬅️ Cole o UUID
  'BRL',
  'fiat',
  10000.00,
  9500.00,
  500.00,
  true
);
```

---

### **OPÇÃO 3: Criar para Todos os Usuários** ⚡

Execute para criar carteiras BRL para TODOS os usuários:

```sql
DO $$
DECLARE
  v_user RECORD;
BEGIN
  FOR v_user IN SELECT id FROM auth.users LOOP
    INSERT INTO public.wallets (
      user_id,
      currency_code,
      currency_type,
      balance,
      available_balance,
      blocked_balance,
      is_active
    ) VALUES (
      v_user.id,
      'BRL',
      'fiat',
      (RANDOM() * 50000)::DECIMAL(20,2),
      (RANDOM() * 45000)::DECIMAL(20,2),
      (RANDOM() * 5000)::DECIMAL(20,2),
      true
    )
    ON CONFLICT (user_id, currency_code) DO NOTHING;
  END LOOP;
END $$;
```

---

## 🚀 Método Recomendado:

**Use a OPÇÃO 1 (por email):**

1. Abra: **POPULAR_WALLETS_SIMPLIFICADO.sql** ⭐
2. Na linha 13, mude o email para o seu
3. Copie TODO o bloco DO $$ até END $$;
4. Execute no SQL Editor
5. ✅ Carteiras criadas!

---

## 🔍 Verificar se Funcionou:

```sql
-- Ver suas carteiras
SELECT 
  w.currency_code,
  w.balance,
  u.email
FROM wallets w
JOIN auth.users u ON w.user_id = u.id
WHERE u.email = 'seu-email@exemplo.com';

-- Ver estatísticas (cards)
SELECT 
  COUNT(*) as total_carteiras,
  SUM(balance) as saldo_total,
  COUNT(DISTINCT user_id) as usuarios
FROM wallets 
WHERE is_active = true
AND currency_code = 'BRL';
```

---

## 💡 Por Que auth.uid() Não Funciona?

**No SQL Editor:**
- ❌ Não há sessão de autenticação ativa
- ❌ `auth.uid()` retorna NULL
- ❌ Precisa usar email ou UUID direto

**Na aplicação (via código):**
- ✅ Usuário está logado
- ✅ `auth.uid()` funciona
- ✅ RLS aplica automaticamente

---

## 📁 Arquivo Criado:

**POPULAR_WALLETS_SIMPLIFICADO.sql** ⭐
- Versão que funciona no SQL Editor
- Busca user_id por email
- 3 opções diferentes
- Pronto para usar

---

## ✅ Checklist:

- [ ] Abriu POPULAR_WALLETS_SIMPLIFICADO.sql
- [ ] Mudou o email na linha 13
- [ ] Copiou o bloco DO $$ ... END $$;
- [ ] Executou no SQL Editor
- [ ] Viu mensagem de sucesso
- [ ] Verificou com SELECT

---

**🎉 Use o arquivo POPULAR_WALLETS_SIMPLIFICADO.sql! 🎉**

**É mais simples e funciona no SQL Editor!**
