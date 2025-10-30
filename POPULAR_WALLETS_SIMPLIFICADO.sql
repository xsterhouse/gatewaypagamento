-- ================================================
-- POPULAR WALLETS - VERSÃO SIMPLIFICADA
-- ================================================
-- Use este SQL se auth.uid() não funcionar

-- ================================================
-- OPÇÃO 1: INSERIR PARA SEU USUÁRIO (MANUAL)
-- ================================================
-- Substitua 'SEU-EMAIL-AQUI' pelo seu email de login

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Buscar seu user_id pelo email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'admin@dimpay.com'  -- ⬅️ MUDE AQUI PARA SEU EMAIL
  LIMIT 1;

  -- Se encontrou o usuário
  IF v_user_id IS NOT NULL THEN
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

    -- Inserir carteira BTC (opcional)
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
      'BTC',
      'crypto',
      0.05000000,
      0.05000000,
      0.00000000,
      true
    )
    ON CONFLICT (user_id, currency_code) 
    DO UPDATE SET
      balance = 0.05000000,
      available_balance = 0.05000000,
      blocked_balance = 0.00000000;

    -- Inserir carteira USDT (opcional)
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
      'USDT',
      'crypto',
      5000.000000,
      4800.000000,
      200.000000,
      true
    )
    ON CONFLICT (user_id, currency_code) 
    DO UPDATE SET
      balance = 5000.000000,
      available_balance = 4800.000000,
      blocked_balance = 200.000000;

    RAISE NOTICE 'Carteiras criadas com sucesso para user_id: %', v_user_id;
  ELSE
    RAISE EXCEPTION 'Usuário não encontrado! Verifique o email.';
  END IF;
END $$;

-- ================================================
-- OPÇÃO 2: INSERIR PARA TODOS OS USUÁRIOS
-- ================================================
-- Cria carteiras BRL para TODOS os usuários existentes

DO $$
DECLARE
  v_user RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR v_user IN SELECT id, email FROM auth.users LOOP
    -- Inserir carteira BRL para cada usuário
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
      (RANDOM() * 50000)::DECIMAL(20,2),  -- Saldo aleatório
      (RANDOM() * 45000)::DECIMAL(20,2),
      (RANDOM() * 5000)::DECIMAL(20,2),
      true
    )
    ON CONFLICT (user_id, currency_code) 
    DO UPDATE SET
      balance = EXCLUDED.balance,
      available_balance = EXCLUDED.available_balance,
      blocked_balance = EXCLUDED.blocked_balance;
    
    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE 'Carteiras criadas/atualizadas para % usuários', v_count;
END $$;

-- ================================================
-- OPÇÃO 3: INSERIR COM UUID DIRETO
-- ================================================
-- Se você souber seu UUID, use diretamente

-- 1. Primeiro, descubra seu UUID:
SELECT id, email
FROM auth.users 
WHERE email LIKE '%@%'  -- Lista todos
ORDER BY created_at DESC
LIMIT 10;

-- 2. Copie o UUID e cole abaixo substituindo 'SEU-UUID-AQUI'
/*
INSERT INTO public.wallets (
  user_id,
  currency_code,
  currency_type,
  balance,
  available_balance,
  blocked_balance,
  is_active
) VALUES (
  'SEU-UUID-AQUI'::UUID,  -- ⬅️ COLE SEU UUID AQUI
  'BRL',
  'fiat',
  10000.00,
  9500.00,
  500.00,
  true
);
*/

-- ================================================
-- VERIFICAÇÃO
-- ================================================

-- Ver todas as carteiras criadas
SELECT 
  w.currency_code,
  w.currency_type,
  w.balance,
  w.available_balance,
  w.blocked_balance,
  u.email
FROM public.wallets w
JOIN auth.users u ON w.user_id = u.id
WHERE w.is_active = true
ORDER BY u.email, w.currency_code;

-- Estatísticas (o que aparece nos cards)
SELECT 
  COUNT(*) as total_carteiras,
  SUM(CASE WHEN currency_code = 'BRL' THEN balance ELSE 0 END) as saldo_total_brl,
  COUNT(DISTINCT user_id) as usuarios_ativos
FROM public.wallets
WHERE is_active = true;

-- ================================================
-- LIMPAR DADOS (SE NECESSÁRIO)
-- ================================================

-- Para remover todas as carteiras:
-- DELETE FROM public.wallets;

-- Para remover apenas suas carteiras:
-- DELETE FROM public.wallets WHERE user_id IN (
--   SELECT id FROM auth.users WHERE email = 'seu-email@exemplo.com'
-- );
