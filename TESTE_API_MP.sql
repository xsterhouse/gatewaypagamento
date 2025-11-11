-- ============================================
-- VERIFICAR TRANSAÇÕES PIX RECENTES
-- ============================================

-- Verificar últimas transações para ver se está usando MP ou simulado
SELECT 
  id,
  transaction_type,
  amount,
  status,
  pix_code,
  pix_txid,
  created_at,
  CASE 
    WHEN pix_txid LIKE 'DEBUG-%' THEN 'SIMULADO'
    WHEN pix_txid LIKE 'MP-%' OR LENGTH(pix_txid) > 10 THEN 'MERCADO PAGO'
    ELSE 'DESCONHECIDO'
  END as tipo_pix
FROM public.pix_transactions
ORDER BY created_at DESC
LIMIT 5;

-- Verificar se tem colunas do Mercado Pago
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'pix_transactions'
AND column_name IN ('mp_payment_id', 'mp_qr_code', 'mp_qr_code_base64')
ORDER BY column_name;
