-- ================================================
-- POPULAR WALLETS COM DADOS DE TESTE
-- ================================================
-- Execute este SQL após criar a tabela wallets
-- para ver os cards com dados reais

-- ================================================
-- 1. CRIAR CARTEIRA BRL PARA SEU USUÁRIO
-- ================================================

INSERT INTO public.wallets (
  user_id,
  currency_code,
  currency_type,
  balance,
  available_balance,
  blocked_balance,
  is_active
) VALUES (
  auth.uid(),                    -- Seu usuário logado
  'BRL',
  'fiat',
  10000.00,                      -- R$ 10.000,00 total
  9500.00,                       -- R$ 9.500,00 disponível
  500.00,                        -- R$ 500,00 bloqueado
  true
)
ON CONFLICT (user_id, currency_code) 
DO UPDATE SET
  balance = 10000.00,
  available_balance = 9500.00,
  blocked_balance = 500.00;

-- ================================================
-- 2. CRIAR CARTEIRA BTC (OPCIONAL)
-- ================================================

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
  'BTC',
  'crypto',
  0.05000000,                    -- 0.05 BTC
  0.05000000,                    -- 0.05 BTC disponível
  0.00000000,                    -- 0 bloqueado
  true
)
ON CONFLICT (user_id, currency_code) 
DO UPDATE SET
  balance = 0.05000000,
  available_balance = 0.05000000,
  blocked_balance = 0.00000000;

-- ================================================
-- 3. CRIAR CARTEIRA USDT (OPCIONAL)
-- ================================================

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
  'USDT',
  'crypto',
  5000.000000,                   -- 5.000 USDT
  4800.000000,                   -- 4.800 USDT disponível
  200.000000,                    -- 200 USDT bloqueado
  true
)
ON CONFLICT (user_id, currency_code) 
DO UPDATE SET
  balance = 5000.000000,
  available_balance = 4800.000000,
  blocked_balance = 200.000000;

-- ================================================
-- VERIFICAR DADOS INSERIDOS
-- ================================================

-- Ver suas carteiras
SELECT 
  currency_code,
  currency_type,
  balance,
  available_balance,
  blocked_balance,
  is_active
FROM public.wallets
WHERE user_id = auth.uid()
ORDER BY currency_type, currency_code;

-- Ver estatísticas (o que aparece nos cards)
SELECT 
  COUNT(*) as total_carteiras,
  SUM(CASE WHEN currency_code = 'BRL' THEN balance ELSE 0 END) as saldo_total_brl,
  COUNT(DISTINCT user_id) as usuarios_ativos
FROM public.wallets
WHERE is_active = true;

-- ================================================
-- POPULAR PARA OUTROS USUÁRIOS (OPCIONAL)
-- ================================================
-- Isso vai criar carteiras para outros usuários
-- para testar melhor os cards de admin

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Buscar outros usuários (exceto o atual)
  FOR v_user_id IN 
    SELECT id 
    FROM auth.users 
    WHERE id != auth.uid()
    LIMIT 5
  LOOP
    -- Criar carteira BRL para cada usuário
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
      (RANDOM() * 50000)::DECIMAL(20,2),  -- Saldo aleatório até R$ 50k
      (RANDOM() * 45000)::DECIMAL(20,2),  -- Disponível
      (RANDOM() * 5000)::DECIMAL(20,2),   -- Bloqueado
      true
    )
    ON CONFLICT (user_id, currency_code) DO NOTHING;
  END LOOP;
END $$;

-- ================================================
-- VERIFICAÇÃO FINAL
-- ================================================

-- Total de carteiras (deve aparecer no card)
SELECT COUNT(*) as total_carteiras 
FROM public.wallets 
WHERE is_active = true;

-- Saldo total BRL (deve aparecer no card)
SELECT SUM(balance) as saldo_total_brl 
FROM public.wallets 
WHERE currency_code = 'BRL' 
AND is_active = true;

-- Usuários ativos (deve aparecer no card)
SELECT COUNT(DISTINCT user_id) as usuarios_ativos 
FROM public.wallets 
WHERE is_active = true;

-- ================================================
-- RESETAR DADOS (SE NECESSÁRIO)
-- ================================================

-- Para limpar e começar de novo:
-- DELETE FROM public.wallets WHERE user_id = auth.uid();
