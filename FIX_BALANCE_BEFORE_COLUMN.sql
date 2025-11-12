-- ============================================
-- FIX: Tornar balance_before opcional ou adicionar valor padrão
-- ============================================

-- OPÇÃO 1: Tornar a coluna opcional (permitir NULL)
ALTER TABLE wallet_transactions 
ALTER COLUMN balance_before DROP NOT NULL;

ALTER TABLE wallet_transactions 
ALTER COLUMN balance_after DROP NOT NULL;

-- OPÇÃO 2: Adicionar valor padrão 0
-- ALTER TABLE wallet_transactions 
-- ALTER COLUMN balance_before SET DEFAULT 0;

-- ALTER TABLE wallet_transactions 
-- ALTER COLUMN balance_after SET DEFAULT 0;

-- Verificar a estrutura da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'wallet_transactions'
AND column_name IN ('balance_before', 'balance_after')
ORDER BY ordinal_position;

-- Ver transações recentes
SELECT 
    id,
    transaction_type,
    amount,
    balance_before,
    balance_after,
    created_at
FROM wallet_transactions
ORDER BY created_at DESC
LIMIT 10;
