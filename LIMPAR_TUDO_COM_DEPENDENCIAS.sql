-- ================================================
-- LIMPAR WALLETS E DEPENDÊNCIAS (RESETAR TUDO)
-- ================================================

-- ================================================
-- 1. VER O QUE EXISTE NO BANCO
-- ================================================

-- Ver carteiras
SELECT COUNT(*) as total_wallets FROM public.wallets;

-- Ver depósitos
SELECT COUNT(*) as total_deposits FROM public.deposits;

-- Ver transações (se existir)
-- SELECT COUNT(*) as total_transactions FROM public.transactions;

-- ================================================
-- 2. LIMPAR NA ORDEM CORRETA (DEPENDÊNCIAS PRIMEIRO)
-- ================================================

-- 2.1. Limpar DEPOSITS primeiro (dependência de wallets)
DELETE FROM public.deposits;

-- 2.2. Limpar TRANSACTIONS (se existir)
-- DELETE FROM public.transactions WHERE wallet_id IS NOT NULL;

-- 2.3. Limpar WALLETS (agora pode)
DELETE FROM public.wallets;

-- ================================================
-- 3. VERIFICAR SE LIMPOU TUDO
-- ================================================

SELECT 
  (SELECT COUNT(*) FROM public.wallets) as wallets,
  (SELECT COUNT(*) FROM public.deposits) as deposits;

-- Deve retornar: wallets: 0, deposits: 0

-- ================================================
-- 4. CRIAR CARTEIRA APENAS PARA VOCÊ (ADMIN)
-- ================================================

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Buscar seu user_id
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

    RAISE NOTICE '✅ Carteira BRL criada com saldo R$ 0,00';
  ELSE
    RAISE EXCEPTION '❌ Email não encontrado!';
  END IF;
END $$;

-- ================================================
-- 5. VERIFICAR RESULTADO FINAL
-- ================================================

-- Ver carteiras
SELECT 
  u.email,
  w.currency_code,
  w.balance,
  w.available_balance,
  w.blocked_balance
FROM public.wallets w
JOIN auth.users u ON w.user_id = u.id;

-- Deve mostrar apenas 1 carteira (a sua) com R$ 0,00

-- Ver estatísticas (cards)
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
-- ALTERNATIVA: USAR CASCADE (MAIS ARRISCADO)
-- ================================================
-- Se quiser deletar wallets e TODAS as dependências automaticamente:

/*
-- CUIDADO: Isso remove TUDO relacionado às carteiras!
DELETE FROM public.wallets CASCADE;

-- OU modificar a constraint para fazer CASCADE automaticamente:
ALTER TABLE public.deposits
DROP CONSTRAINT deposits_wallet_id_fkey;

ALTER TABLE public.deposits
ADD CONSTRAINT deposits_wallet_id_fkey
FOREIGN KEY (wallet_id) 
REFERENCES public.wallets(id) 
ON DELETE CASCADE;  -- ⬅️ Agora deleta depósitos automaticamente

-- Depois disso, DELETE FROM wallets funcionará sem erro
*/

-- ================================================
-- RESUMO DO PROBLEMA:
-- ================================================

-- Tabelas relacionadas:
-- wallets (1) ←── deposits (N)
--   └── Uma carteira pode ter vários depósitos

-- Para deletar wallets, precisa:
-- 1. Deletar deposits primeiro, OU
-- 2. Usar CASCADE, OU
-- 3. Modificar constraint para ON DELETE CASCADE

-- ================================================
-- ESTADO FINAL DO SISTEMA:
-- ================================================

-- ✅ 1 carteira (apenas você, admin)
-- ✅ Saldo R$ 0,00
-- ✅ Sem depósitos de teste
-- ✅ Sem transações de teste
-- ✅ Pronto para dados REAIS de clientes
