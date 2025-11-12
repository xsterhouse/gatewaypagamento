-- ============================================
-- CORRIGIR SISTEMA DE TAXAS DO ADMIN
-- ============================================

-- PASSO 1: Criar carteira "Conta Mãe" para o admin
-- ============================================

-- 1.1: Verificar se admin existe
SELECT id, email, role, name 
FROM users 
WHERE role = 'admin'
LIMIT 1;

-- 1.2: Criar carteira do admin (SUBSTITUA o user_id pelo ID do admin acima)
INSERT INTO wallets (
  user_id,
  currency_type,
  currency_code,
  balance,
  available_balance,
  blocked_balance,
  is_active,
  wallet_name
)
VALUES (
  'ADMIN_USER_ID_AQUI',  -- SUBSTITUA pelo ID do admin
  'fiat',
  'BRL',
  0.00,
  0.00,
  0.00,
  true,
  'Conta Mãe - Taxas Gateway'
)
ON CONFLICT (user_id, wallet_name) 
DO NOTHING;

-- 1.3: Verificar se criou
SELECT * FROM wallets 
WHERE wallet_name = 'Conta Mãe - Taxas Gateway';


-- PASSO 2: Creditar taxas retroativas
-- ============================================

-- 2.1: Ver transações PIX já realizadas
SELECT 
  pt.id,
  pt.user_id,
  pt.amount,
  pt.fee_amount,
  pt.net_amount,
  pt.status,
  pt.created_at
FROM pix_transactions pt
WHERE pt.status = 'completed'
ORDER BY pt.created_at DESC;

-- 2.2: Calcular total de taxas perdidas
SELECT 
  COUNT(*) as total_transacoes,
  SUM(amount) as total_bruto,
  SUM(fee_amount) as total_taxas_perdidas,
  SUM(net_amount) as total_liquido_clientes
FROM pix_transactions
WHERE status = 'completed';

-- 2.3: Creditar taxas retroativas na carteira do admin
-- ATENÇÃO: Execute APENAS UMA VEZ!
UPDATE wallets
SET 
  balance = balance + (
    SELECT COALESCE(SUM(fee_amount), 0)
    FROM pix_transactions
    WHERE status = 'completed'
  ),
  available_balance = available_balance + (
    SELECT COALESCE(SUM(fee_amount), 0)
    FROM pix_transactions
    WHERE status = 'completed'
  )
WHERE wallet_name = 'Conta Mãe - Taxas Gateway';

-- 2.4: Registrar transação de ajuste
INSERT INTO wallet_transactions (
  user_id,
  wallet_id,
  transaction_type,
  amount,
  balance_before,
  balance_after,
  description,
  reference_type,
  metadata
)
SELECT 
  w.user_id,
  w.id,
  'credit',
  (SELECT COALESCE(SUM(fee_amount), 0) FROM pix_transactions WHERE status = 'completed'),
  0.00,
  (SELECT COALESCE(SUM(fee_amount), 0) FROM pix_transactions WHERE status = 'completed'),
  'Ajuste retroativo - Taxas Gateway acumuladas',
  'adjustment',
  jsonb_build_object(
    'type', 'retroactive_fees',
    'date', NOW(),
    'transactions_count', (SELECT COUNT(*) FROM pix_transactions WHERE status = 'completed')
  )
FROM wallets w
WHERE w.wallet_name = 'Conta Mãe - Taxas Gateway';


-- PASSO 3: Verificar resultado
-- ============================================

-- 3.1: Ver saldo da Conta Mãe
SELECT 
  wallet_name,
  balance,
  available_balance,
  created_at
FROM wallets
WHERE wallet_name = 'Conta Mãe - Taxas Gateway';

-- 3.2: Ver histórico de transações do admin
SELECT 
  transaction_type,
  amount,
  description,
  created_at
FROM wallet_transactions wt
JOIN wallets w ON w.id = wt.wallet_id
WHERE w.wallet_name = 'Conta Mãe - Taxas Gateway'
ORDER BY created_at DESC;

-- 3.3: Comparar com total de taxas
SELECT 
  'Total Taxas PIX' as tipo,
  SUM(fee_amount) as valor
FROM pix_transactions
WHERE status = 'completed'

UNION ALL

SELECT 
  'Saldo Conta Mãe' as tipo,
  balance as valor
FROM wallets
WHERE wallet_name = 'Conta Mãe - Taxas Gateway';


-- PASSO 4: Criar função para creditar taxas automaticamente
-- ============================================

CREATE OR REPLACE FUNCTION credit_gateway_fee(
  p_transaction_id UUID,
  p_fee_amount NUMERIC
)
RETURNS VOID AS $$
DECLARE
  v_admin_wallet_id UUID;
BEGIN
  -- Buscar carteira do admin
  SELECT id INTO v_admin_wallet_id
  FROM wallets
  WHERE wallet_name = 'Conta Mãe - Taxas Gateway'
  LIMIT 1;

  IF v_admin_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Carteira Conta Mãe não encontrada';
  END IF;

  -- Creditar taxa
  UPDATE wallets
  SET 
    balance = balance + p_fee_amount,
    available_balance = available_balance + p_fee_amount
  WHERE id = v_admin_wallet_id;

  -- Registrar transação
  INSERT INTO wallet_transactions (
    wallet_id,
    user_id,
    transaction_type,
    amount,
    description,
    reference_id,
    reference_type,
    metadata
  )
  SELECT 
    v_admin_wallet_id,
    user_id,
    'credit',
    p_fee_amount,
    'Taxa Gateway - PIX',
    p_transaction_id,
    'pix_transaction',
    jsonb_build_object(
      'type', 'gateway_fee',
      'transaction_id', p_transaction_id
    )
  FROM wallets
  WHERE id = v_admin_wallet_id;

END;
$$ LANGUAGE plpgsql;

-- Testar função
-- SELECT credit_gateway_fee('transaction_id_aqui'::uuid, 0.95);


-- PASSO 5: Criar trigger para creditar taxas automaticamente
-- ============================================

CREATE OR REPLACE FUNCTION auto_credit_gateway_fee()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando PIX for completado, creditar taxa ao admin
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    PERFORM credit_gateway_fee(NEW.id, NEW.fee_amount);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_credit_gateway_fee ON pix_transactions;
CREATE TRIGGER trigger_credit_gateway_fee
  AFTER UPDATE ON pix_transactions
  FOR EACH ROW
  EXECUTE FUNCTION auto_credit_gateway_fee();


-- ============================================
-- RESUMO DO QUE FOI FEITO:
-- ============================================

/*
1. ✅ Criada carteira "Conta Mãe - Taxas Gateway" para o admin
2. ✅ Creditadas taxas retroativas (R$ 0,95 do pagamento anterior)
3. ✅ Criada função para creditar taxas automaticamente
4. ✅ Criado trigger para executar função quando PIX for completado

RESULTADO:
- Cliente: R$ 9,05 (líquido)
- Admin (Conta Mãe): R$ 0,95 (taxa)
- Total: R$ 10,00 ✅

PRÓXIMOS PAGAMENTOS:
- Taxas serão creditadas AUTOMATICAMENTE ao admin
- Não precisa fazer nada manualmente
*/
