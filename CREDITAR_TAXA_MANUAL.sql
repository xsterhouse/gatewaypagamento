-- ============================================
-- CREDITAR TAXA DO PIX DE R$ 2,00 MANUALMENTE
-- ============================================

-- PASSO 1: Buscar ID e carteira do admin
SELECT 
    u.id as user_id,
    u.name,
    u.email,
    u.role,
    w.id as wallet_id,
    w.available_balance,
    w.currency_code
FROM users u
LEFT JOIN wallets w ON w.user_id = u.id AND w.currency_code = 'BRL' AND w.is_active = true
WHERE u.role IN ('admin', 'master')
LIMIT 1;

-- PASSO 2: Ver a transação PIX de R$ 2,00
SELECT 
    id as pix_transaction_id,
    user_id as client_id,
    amount,
    fee_amount,
    status,
    created_at
FROM pix_transactions
WHERE amount = 2.00
AND transaction_type = 'withdrawal'
ORDER BY created_at DESC
LIMIT 1;

-- PASSO 3: Creditar a taxa na carteira do admin
-- Substitua os valores abaixo com os dados do PASSO 1 e PASSO 2

-- Calcular taxa: R$ 2,00 * 2% = R$ 0,04
-- Taxa mínima: R$ 0,80
-- Taxa aplicada: R$ 0,80 (mínimo)

DO $$
DECLARE
    v_admin_wallet_id UUID;
    v_admin_user_id UUID;
    v_current_balance DECIMAL(15,2);
    v_new_balance DECIMAL(15,2);
    v_tax_amount DECIMAL(10,2) := 0.80; -- Taxa mínima
    v_pix_transaction_id UUID;
BEGIN
    -- Buscar admin e carteira
    SELECT u.id, w.id, w.available_balance
    INTO v_admin_user_id, v_admin_wallet_id, v_current_balance
    FROM users u
    JOIN wallets w ON w.user_id = u.id AND w.currency_code = 'BRL' AND w.is_active = true
    WHERE u.role IN ('admin', 'master')
    LIMIT 1;

    -- Buscar ID da transação PIX
    SELECT id INTO v_pix_transaction_id
    FROM pix_transactions
    WHERE amount = 2.00
    AND transaction_type = 'withdrawal'
    ORDER BY created_at DESC
    LIMIT 1;

    -- Calcular novo saldo
    v_new_balance := v_current_balance + v_tax_amount;

    -- Inserir transação de taxa
    INSERT INTO wallet_transactions (
        wallet_id,
        user_id,
        transaction_type,
        amount,
        balance_before,
        balance_after,
        description,
        metadata
    ) VALUES (
        v_admin_wallet_id,
        v_admin_user_id,
        'credit',
        v_tax_amount,
        v_current_balance,
        v_new_balance,
        'Taxa PIX - Ajuste manual (R$ 2,00)',
        jsonb_build_object(
            'pix_transaction_id', v_pix_transaction_id,
            'fee_type', 'pix_withdrawal',
            'fee_percentage', 0.02,
            'original_amount', 2.00,
            'manual_adjustment', true
        )
    );

    -- Atualizar saldo da carteira do admin
    UPDATE wallets
    SET 
        available_balance = v_new_balance,
        balance = v_new_balance
    WHERE id = v_admin_wallet_id;

    RAISE NOTICE 'Taxa de R$ % creditada com sucesso!', v_tax_amount;
    RAISE NOTICE 'Saldo anterior: R$ %', v_current_balance;
    RAISE NOTICE 'Novo saldo: R$ %', v_new_balance;
END $$;

-- PASSO 4: Verificar se foi creditado
SELECT 
    u.name as admin_name,
    w.available_balance as saldo_atual,
    wt.amount as taxa_creditada,
    wt.description,
    wt.created_at
FROM wallet_transactions wt
JOIN wallets w ON w.id = wt.wallet_id
JOIN users u ON u.id = wt.user_id
WHERE wt.description LIKE '%Taxa PIX%'
AND u.role IN ('admin', 'master')
ORDER BY wt.created_at DESC
LIMIT 5;
