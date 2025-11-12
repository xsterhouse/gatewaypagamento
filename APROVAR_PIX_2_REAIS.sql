-- ============================================
-- APROVAR PIX DE R$ 2,00 PENDENTE
-- ============================================

-- PASSO 1: Ver o PIX pendente de R$ 2,00
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
AND amount = 2.00
ORDER BY created_at DESC
LIMIT 1;

-- PASSO 2: Copie o ID que apareceu acima e execute este comando
-- (Substitua 'COLE_O_ID_AQUI' pelo ID real)

UPDATE pix_transactions
SET 
    status = 'completed',
    metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{manual_approval}',
        'true'::jsonb
    )
WHERE amount = 2.00
AND status = 'pending'
AND transaction_type = 'withdrawal';

-- PASSO 3: Verificar se foi aprovado
SELECT 
    id,
    amount,
    fee_amount,
    status,
    pix_code,
    created_at,
    metadata
FROM pix_transactions
WHERE amount = 2.00
AND transaction_type = 'withdrawal'
ORDER BY created_at DESC
LIMIT 1;

-- ============================================
-- RESULTADO ESPERADO:
-- status deve estar como 'completed'
-- ============================================
