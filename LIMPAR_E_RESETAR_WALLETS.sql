-- ================================================
-- LIMPAR E RESETAR WALLETS (COMEÇAR DO ZERO)
-- ================================================

-- ================================================
-- 1. VER QUAIS CARTEIRAS EXISTEM AGORA
-- ================================================

SELECT 
  w.id as wallet_id,
  u.email,
  w.currency_code,
  w.balance,
  w.created_at
FROM public.wallets w
JOIN auth.users u ON w.user_id = u.id
ORDER BY u.email;

-- ================================================
-- 2. LIMPAR TODAS AS CARTEIRAS
-- ================================================
-- ⚠️ CUIDADO: Remove TODAS as carteiras do sistema

DELETE FROM public.wallets;

-- ================================================
-- 3. VERIFICAR SE LIMPOU
-- ================================================

SELECT COUNT(*) as total_carteiras FROM public.wallets;
-- Deve retornar: 0

-- ================================================
-- 4. AGORA O SISTEMA ESTÁ LIMPO E PRONTO
-- ================================================

-- As carteiras serão criadas automaticamente quando:
-- 1. Cliente se registrar (trigger create_default_wallet)
-- 2. Admin criar manualmente para um usuário específico

-- ================================================
-- 5. CRIAR CARTEIRA APENAS PARA VOCÊ (ADMIN)
-- ================================================

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Buscar APENAS seu usuário admin
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'admin@dimpay.com'  -- ⬅️ MUDE PARA SEU EMAIL
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Criar carteira BRL zerada
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
      0.00,
      0.00,
      0.00,
      true
    );

    RAISE NOTICE '✅ Carteira BRL criada apenas para o admin';
  END IF;
END $$;

-- ================================================
-- 6. VERIFICAR RESULTADO
-- ================================================

SELECT 
  u.email,
  w.currency_code,
  w.balance,
  w.available_balance
FROM public.wallets w
JOIN auth.users u ON w.user_id = u.id;

-- Deve mostrar apenas 1 carteira (a sua)

-- ================================================
-- 7. VER ESTATÍSTICAS (CARDS)
-- ================================================

SELECT 
  COUNT(*) as total_carteiras,
  SUM(CASE WHEN currency_code = 'BRL' THEN balance ELSE 0 END) as saldo_total_brl,
  COUNT(DISTINCT user_id) as usuarios_ativos
FROM public.wallets
WHERE is_active = true;

-- Resultado esperado:
-- total_carteiras: 1
-- saldo_total_brl: 0.00
-- usuarios_ativos: 1

-- ================================================
-- IMPORTANTE: TRIGGER AUTOMÁTICO
-- ================================================

-- O trigger create_default_wallet() cria carteira automaticamente
-- quando um NOVO usuário se registra via auth.users

-- Para verificar se o trigger existe:
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'create_default_wallet_on_user_creation';

-- Se o trigger NÃO existir, execute:
/*
CREATE OR REPLACE FUNCTION create_default_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wallets (
    user_id,
    currency_code,
    currency_type,
    balance,
    available_balance,
    blocked_balance
  ) VALUES (
    NEW.id,
    'BRL',
    'fiat',
    0, 0, 0
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_default_wallet_on_user_creation
AFTER INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION create_default_wallet();
*/

-- ================================================
-- FLUXO CORRETO A PARTIR DE AGORA:
-- ================================================

-- 1. Cliente se registra no sistema
--    → Trigger cria carteira BRL automaticamente (R$ 0,00)
--    → Admin vê +1 carteira nos cards

-- 2. Cliente faz depósito
--    → Sistema atualiza saldo via UPDATE
--    → Admin vê saldo real nos cards

-- 3. Cliente faz transação
--    → Sistema deduz saldo
--    → Admin vê novo saldo real

-- RESULTADO: APENAS dados reais, sem ficção! ✅
