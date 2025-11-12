-- ============================================
-- APROVAR PIX PENDENTE MANUALMENTE
-- ============================================

-- 1. Ver todas as transações PIX pendentes
SELECT 
    id,
    user_id,
    amount,
    fee_amount,
    pix_code as chave_pix,
    status,
    created_at
FROM pix_transactions
WHERE status = 'pending'
AND transaction_type = 'withdrawal'
ORDER BY created_at DESC;

-- 2. APROVAR uma transação específica (substitua o ID)
-- Copie o ID da transação acima e cole abaixo

UPDATE pix_transactions
SET 
    status = 'completed',
    updated_at = NOW()
WHERE id = 'COLE_O_ID_AQUI'
AND status = 'pending';

-- 3. Verificar se foi aprovado
SELECT 
    id,
    amount,
    fee_amount,
    status,
    pix_code,
    created_at,
    updated_at
FROM pix_transactions
WHERE id = 'COLE_O_ID_AQUI';

-- ============================================
-- APROVAR TODOS OS PIX PENDENTES DE UMA VEZ
-- ============================================

-- ⚠️ CUIDADO: Isso aprovará TODOS os PIX pendentes
-- UPDATE pix_transactions
-- SET 
--     status = 'completed',
--     updated_at = NOW()
-- WHERE status = 'pending'
-- AND transaction_type = 'withdrawal';

-- ============================================
-- CREDITAR TAXA DO ADMIN MANUALMENTE
-- (Para transações antigas que não creditaram)
-- ============================================

-- Buscar ID do admin
SELECT id, name, email, role 
FROM users 
WHERE role IN ('admin', 'master')
LIMIT 1;

-- Buscar carteira do admin
SELECT id, user_id, available_balance, currency_code
FROM wallets
WHERE user_id = 'COLE_ID_DO_ADMIN_AQUI'
AND currency_code = 'BRL'
AND is_active = true;

-- Creditar taxa manualmente (substitua os valores)
-- INSERT INTO wallet_transactions (
--     wallet_id,
--     user_id,
--     transaction_type,
--     amount,
--     balance_before,
--     balance_after,
--     description,
--     metadata
-- ) VALUES (
--     'ID_DA_CARTEIRA_ADMIN',
--     'ID_DO_ADMIN',
--     'credit',
--     0.04, -- Taxa de R$ 2,00 * 2% = R$ 0,04
--     0, -- Saldo antes (veja na query acima)
--     0.04, -- Saldo depois
--     'Taxa PIX - Ajuste manual',
--     '{"fee_type": "pix_withdrawal", "manual_adjustment": true}'::jsonb
-- );

-- Atualizar saldo da carteira do admin
-- UPDATE wallets
-- SET 
--     available_balance = available_balance + 0.04,
--     balance = balance + 0.04
-- WHERE id = 'ID_DA_CARTEIRA_ADMIN';
