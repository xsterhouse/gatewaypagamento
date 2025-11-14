-- =================================================================
-- VERIFICAR STATUS DE TRANSAÇÕES PIX
-- =================================================================

-- 1. Contar transações pendentes
SELECT 
  COUNT(*) as total_pendentes
FROM public.pix_transactions
WHERE status = 'pending';

-- 2. Listar transações pendentes (últimas 10)
SELECT 
  id,
  user_id,
  amount,
  status,
  created_at,
  expires_at
FROM public.pix_transactions
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 10;

-- 3. Contar transações falhadas
SELECT 
  COUNT(*) as total_falhas
FROM public.pix_transactions
WHERE status = 'failed';

-- 4. Listar transações falhadas (últimas 10)
SELECT 
  id,
  user_id,
  amount,
  status,
  error_message,
  created_at
FROM public.pix_transactions
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;

-- 5. Resumo geral de status
SELECT 
  status,
  COUNT(*) as total,
  SUM(amount) as volume
FROM public.pix_transactions
GROUP BY status
ORDER BY total DESC;