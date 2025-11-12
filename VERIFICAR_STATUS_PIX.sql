-- ============================================
-- VERIFICAR STATUS PERMITIDOS E LIMPAR PIX
-- ============================================

-- PASSO 1: Ver constraint de status
-- ============================================

-- Verificar constraint na tabela
SELECT conname, consrc
FROM pg_constraint
WHERE conrelid = 'pix_transactions'::regclass
AND conname LIKE '%status%';

-- Ou verificar todos os check constraints
SELECT 
  conname,
  consrc,
  contype
FROM pg_constraint 
WHERE conrelid = 'pix_transactions'::regclass
AND contype = 'c';


-- PASSO 2: Ver status existentes
-- ============================================

SELECT DISTINCT status
FROM pix_transactions
ORDER BY status;


-- PASSO 3: Ver PIX pendentes
-- ============================================

SELECT 
  id,
  amount,
  status,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as horas_pendente
FROM pix_transactions
WHERE status = 'pending'
ORDER BY created_at DESC;


-- PASSO 4: Usar status permitido (provavelmente 'failed')
-- ============================================

-- ATUALIZAR para 'failed' em vez de 'expired'
UPDATE pix_transactions
SET status = 'failed'
WHERE status = 'pending'
AND created_at < NOW() - INTERVAL '30 minutes';

-- Ver resultado
SELECT COUNT(*) as atualizados_para_failed
FROM pix_transactions
WHERE status = 'failed'
AND created_at < NOW() - INTERVAL '30 minutes';


-- PASSO 5: Verificar resultado final
-- ============================================

-- Contar por status
SELECT 
  status,
  COUNT(*) as quantidade,
  SUM(amount) as valor_total
FROM pix_transactions
GROUP BY status
ORDER BY status DESC;


-- ============================================
-- RESUMO:
-- ============================================

/*
Se 'expired' não for permitido, use:
- 'failed' (provavelmente permitido)
- Ou verifique qual status é permitido na constraint

OPÇÕES COMUNS:
- 'pending'
- 'completed' 
- 'failed'
- 'cancelled'
- 'refunded'

Execute PASSO 1 para ver os valores exatos permitidos.
*/
