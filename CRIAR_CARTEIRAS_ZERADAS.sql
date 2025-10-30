-- ================================================
-- CRIAR CARTEIRAS COM SALDO ZERADO (VALORES REAIS)
-- ================================================
-- Use este SQL para começar com saldos em R$ 0,00
-- Os valores só aumentarão com ações REAIS dos clientes

-- ================================================
-- 1. LIMPAR DADOS DE TESTE (OPCIONAL)
-- ================================================
-- Descomentar para remover dados fictícios

-- DELETE FROM public.wallets;

-- ================================================
-- 2. CRIAR CARTEIRAS ZERADAS PARA VOCÊ
-- ================================================

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Buscar seu user_id pelo email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'admin@dimpay.com'  -- ⬅️ MUDE PARA SEU EMAIL
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Carteira BRL com saldo ZERO
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
      0.00,                    -- ⬅️ SALDO ZERO (REAL)
      0.00,                    -- ⬅️ DISPONÍVEL ZERO
      0.00,                    -- ⬅️ BLOQUEADO ZERO
      true
    )
    ON CONFLICT (user_id, currency_code) 
    DO UPDATE SET
      balance = 0.00,
      available_balance = 0.00,
      blocked_balance = 0.00;

    RAISE NOTICE '✅ Carteira BRL criada com saldo R$ 0,00 (pronta para valores reais)';
  ELSE
    RAISE EXCEPTION '❌ Email não encontrado!';
  END IF;
END $$;

-- ================================================
-- 3. CRIAR CARTEIRAS ZERADAS PARA TODOS OS USUÁRIOS
-- ================================================
-- Executa para TODOS os usuários começarem com R$ 0,00

DO $$
DECLARE
  v_user RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR v_user IN SELECT id, email FROM auth.users LOOP
    -- Inserir carteira BRL zerada
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
      0.00,                    -- SALDO ZERO
      0.00,                    -- DISPONÍVEL ZERO
      0.00,                    -- BLOQUEADO ZERO
      true
    )
    ON CONFLICT (user_id, currency_code) 
    DO UPDATE SET
      balance = 0.00,
      available_balance = 0.00,
      blocked_balance = 0.00;
    
    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE '✅ % carteiras BRL criadas com saldo R$ 0,00', v_count;
END $$;

-- ================================================
-- 4. VERIFICAR CARTEIRAS ZERADAS
-- ================================================

SELECT 
  u.email,
  w.currency_code,
  w.balance as saldo_total,
  w.available_balance as disponivel,
  w.blocked_balance as bloqueado,
  w.created_at
FROM public.wallets w
JOIN auth.users u ON w.user_id = u.id
WHERE w.is_active = true
ORDER BY u.email, w.currency_code;

-- ================================================
-- 5. ESTATÍSTICAS (CARDS) - DEVE MOSTRAR ZEROS
-- ================================================

SELECT 
  COUNT(*) as total_carteiras,
  SUM(CASE WHEN currency_code = 'BRL' THEN balance ELSE 0 END) as saldo_total_brl,
  COUNT(DISTINCT user_id) as usuarios_ativos
FROM public.wallets
WHERE is_active = true;

-- ================================================
-- RESULTADO ESPERADO NOS CARDS:
-- ================================================
-- Total de Carteiras: 1 (ou mais)
-- Saldo Total (BRL): R$ 0,00  ⬅️ ZERO = VALORES REAIS
-- Usuários Ativos: 1 (ou mais)

-- ================================================
-- COMO OS VALORES VÃO AUMENTAR (SOMENTE COM AÇÕES REAIS):
-- ================================================

-- Quando o cliente:
-- 1. Fizer um depósito → balance aumenta
-- 2. Receber um pagamento → balance aumenta
-- 3. Fazer uma transação → balance diminui
-- 4. Bloquear saldo → available diminui, blocked aumenta

-- EXEMPLO DE DEPÓSITO (VIA SISTEMA, NÃO MANUAL):
/*
UPDATE public.wallets
SET 
  balance = balance + 100.00,
  available_balance = available_balance + 100.00
WHERE user_id = 'uuid-do-cliente'
AND currency_code = 'BRL';
*/

-- ================================================
-- IMPORTANTE:
-- ================================================
-- ✅ Sistema JÁ está configurado para dados reais
-- ✅ AdminWallets.tsx busca do banco (dados reais)
-- ✅ Wallets.tsx busca do banco (dados reais)
-- ✅ Sem dados mockados no código
-- ✅ Valores só mudam com ações reais dos clientes

-- ================================================
-- PARA TESTAR COM VALORES REAIS:
-- ================================================
-- 1. Cliente se registra no sistema
-- 2. Sistema cria carteira BRL automática (R$ 0,00)
-- 3. Cliente faz depósito (via sistema de pagamento)
-- 4. Saldo aumenta automaticamente
-- 5. Admin vê o valor REAL nos cards
