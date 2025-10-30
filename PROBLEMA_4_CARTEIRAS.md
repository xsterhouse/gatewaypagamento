# 🔧 Problema: 4 Carteiras Criadas Sem Clientes

## 🎯 O Que Aconteceu:

Você executou o SQL que cria carteiras para **TODOS os usuários** que existem no banco, incluindo:
- Você (admin)
- Usuários de teste
- Contas antigas

**Resultado:** 4 carteiras foram criadas (1 para cada usuário no banco)

---

## ✅ Solução Rápida:

### **Passo 1: Ver Quais Carteiras Existem**
```sql
SELECT 
  u.email,
  w.currency_code,
  w.balance
FROM wallets w
JOIN auth.users u ON w.user_id = u.id;
```

### **Passo 2: Limpar TODAS as Carteiras**
```sql
DELETE FROM public.wallets;
```

### **Passo 3: Criar Apenas para Você (Admin)**
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

### **Passo 4: Verificar**
```sql
SELECT COUNT(*) FROM wallets;
-- Deve retornar: 1 (apenas você)
```

---

## 📁 Execute Este Arquivo:

**LIMPAR_E_RESETAR_WALLETS.sql** ⭐
- Mostra carteiras existentes
- Limpa todas
- Cria apenas para você
- Verifica resultado

---

## 🎯 Como Deve Funcionar:

### **Sistema Correto:**

**1. Você (Admin):**
- 1 carteira BRL (R$ 0,00)

**2. Quando Cliente se Registra:**
- Sistema cria carteira BRL automaticamente (R$ 0,00)
- Você vê +1 carteira nos cards

**3. Quando Cliente Deposita:**
- Sistema atualiza saldo
- Você vê valor REAL nos cards

---

## 🔒 Trigger Automático:

O sistema deve ter um trigger que cria carteira automaticamente quando um novo usuário se registra:

```sql
-- Verificar se trigger existe:
SELECT trigger_name 
FROM information_schema.triggers
WHERE trigger_name = 'create_default_wallet_on_user_creation';
```

Se NÃO existir, o trigger está em: `CRIAR_TABELA_WALLETS.sql`

---

## ✅ Após Limpar:

**Cards devem mostrar:**
```
Total de Carteiras: 1
Saldo Total (BRL): R$ 0,00
Usuários Ativos: 1
```

**Quando cliente se registrar:**
```
Total de Carteiras: 2  ← Aumenta automaticamente
Saldo Total (BRL): R$ 0,00
Usuários Ativos: 2
```

**Quando cliente depositar R$ 100:**
```
Total de Carteiras: 2
Saldo Total (BRL): R$ 100,00  ← Valor REAL
Usuários Ativos: 2
```

---

## 🚀 Execute Agora:

```
1. Abra: LIMPAR_E_RESETAR_WALLETS.sql
2. Execute PASSO 1 (ver carteiras)
3. Execute PASSO 2 (DELETE)
4. Execute PASSO 5 (criar só para você)
5. Execute PASSO 6 (verificar)
6. ✅ Pronto! Apenas 1 carteira (sua)
```

---

**🎉 Depois de limpar, o sistema criará carteiras automaticamente quando clientes se registrarem! 🎉**
