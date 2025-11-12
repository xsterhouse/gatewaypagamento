-- ============================================
-- CREDITAR SALDO MANUALMENTE APÓS PAGAMENTO
-- ============================================

-- PASSO 1: Ver a transação e pegar os dados
SELECT 
  id, 
  user_id,
  pix_txid, 
  status, 
  amount,
  net_amount,
  fee_amount
FROM pix_transactions 
WHERE pix_txid = '133561550516'  -- SUBSTITUA pelo ID do seu pagamento
ORDER BY created_at DESC 
LIMIT 1;

-- PASSO 2: Atualizar status da transação para 'completed'
UPDATE pix_transactions
SET 
  status = 'completed',
  completed_at = now(),
  updated_at = now()
WHERE pix_txid = '133561550516';  -- SUBSTITUA pelo ID do seu pagamento

-- PASSO 3: Atualizar saldo do usuário diretamente
-- SUBSTITUA os valores pelos que apareceram no PASSO 1:
-- - user_id_aqui: pelo user_id real
-- - 9.65: pelo net_amount real

UPDATE user_wallets
SET 
  balance = balance + 9.65,  -- SUBSTITUA pelo net_amount
  updated_at = now()
WHERE user_id = '619c17c8-091c-458e-a083-9b2f67cfcee6';  -- SUBSTITUA pelo user_id

-- PASSO 4: Verificar se funcionou
SELECT 
  user_id,
  balance,
  updated_at
FROM user_wallets
WHERE user_id = '619c17c8-091c-458e-a083-9b2f67cfcee6';  -- SUBSTITUA pelo user_id

-- PASSO 5: Ver histórico de transações
SELECT 
  id,
  status,
  amount,
  net_amount,
  completed_at
FROM pix_transactions
WHERE user_id = '619c17c8-091c-458e-a083-9b2f67cfcee6'  -- SUBSTITUA pelo user_id
ORDER BY created_at DESC
LIMIT 5;
