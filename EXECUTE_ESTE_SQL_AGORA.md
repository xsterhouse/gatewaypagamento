# ⚡ EXECUTE ESTE SQL AGORA

## 🎯 Copie e Execute (2 minutos)

### **PASSO 1: Copie este bloco completo:**

```sql
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Buscar user_id pelo email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'admin@dimpay.com'  -- ⬅️ MUDE SEU EMAIL AQUI
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Carteira BRL
    INSERT INTO public.wallets (
      user_id, currency_code, currency_type,
      balance, available_balance, blocked_balance, is_active
    ) VALUES (
      v_user_id, 'BRL', 'fiat',
      10000.00, 9500.00, 500.00, true
    )
    ON CONFLICT (user_id, currency_code) 
    DO UPDATE SET balance = 10000.00;

    -- Carteira BTC
    INSERT INTO public.wallets (
      user_id, currency_code, currency_type,
      balance, available_balance, blocked_balance, is_active
    ) VALUES (
      v_user_id, 'BTC', 'crypto',
      0.05000000, 0.05000000, 0.00000000, true
    )
    ON CONFLICT (user_id, currency_code) 
    DO UPDATE SET balance = 0.05000000;

    -- Carteira USDT
    INSERT INTO public.wallets (
      user_id, currency_code, currency_type,
      balance, available_balance, blocked_balance, is_active
    ) VALUES (
      v_user_id, 'USDT', 'crypto',
      5000.000000, 4800.000000, 200.000000, true
    )
    ON CONFLICT (user_id, currency_code) 
    DO UPDATE SET balance = 5000.000000;

    RAISE NOTICE '✅ 3 Carteiras criadas com sucesso!';
  ELSE
    RAISE EXCEPTION '❌ Email não encontrado! Verifique o email.';
  END IF;
END $$;
```

### **PASSO 2: Mude o email:**
Linha 8: `WHERE email = 'admin@dimpay.com'`
- Substitua pelo seu email de login

### **PASSO 3: Execute:**
1. Supabase Dashboard → SQL Editor
2. Cole o SQL
3. Ctrl+Enter ou clique Run
4. ✅ Deve ver: "3 Carteiras criadas com sucesso!"

---

## 🔍 Verificar se Funcionou:

```sql
-- Ver suas carteiras
SELECT * FROM wallets 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email = 'admin@dimpay.com'  -- SEU EMAIL
);

-- Ver cards
SELECT 
  COUNT(*) as total_carteiras,
  SUM(CASE WHEN currency_code = 'BRL' THEN balance ELSE 0 END) as saldo_brl,
  COUNT(DISTINCT user_id) as usuarios_ativos
FROM wallets 
WHERE is_active = true;
```

---

## ✅ Resultado Esperado:

**Após executar, você terá:**
- 3 carteiras criadas (BRL, BTC, USDT)
- Total: R$ 10.000,00 em BRL
- Cards do admin mostrarão os dados

**Página /admin/wallets mostrará:**
```
Total de Carteiras: 3
Saldo Total (BRL): R$ 10.000,00
Usuários Ativos: 1
```

---

## 🐛 Se Der Erro:

**"Email não encontrado":**
- Verifique se o email está correto
- Verifique se você já se registrou no sistema

**"Tabela wallets não existe":**
- Execute primeiro: CRIAR_TABELA_WALLETS.sql

**"Permission denied":**
- Verifique se está usando o SQL Editor como admin

---

**🎉 É só isso! Execute e teste! 🎉**
