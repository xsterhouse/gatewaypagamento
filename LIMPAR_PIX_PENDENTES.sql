-- =================================================================
-- LIMPAR TRANSAÇÕES PIX PENDENTES
-- =================================================================
-- Este script deleta permanentemente todas as transações da tabela
-- 'pix_transactions' que estão com o status 'pending'.

-- ⚠️ ATENÇÃO: Esta ação não pode ser desfeita.

DELETE FROM public.pix_transactions
WHERE status = 'pending';

-- =================================================================
-- VERIFICAÇÃO
-- =================================================================
-- Após executar o DELETE, esta consulta deve retornar 0.

SELECT 
  COUNT(*) as total_pendentes_restantes
FROM public.pix_transactions
WHERE status = 'pending';