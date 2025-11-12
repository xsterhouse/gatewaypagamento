-- ============================================
-- LIMPAR PIX PENDENTES
-- ============================================

-- PASSO 1: Ver PIX pendentes
-- ============================================

SELECT 
  id,
  user_id,
  amount,
  status,
  pix_txid,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as horas_pendente
FROM pix_transactions
WHERE status = 'pending'
ORDER BY created_at DESC;


-- PASSO 2: Marcar como expirados (mais de 30 minutos)
-- ============================================

-- Atualizar PIX pendentes há mais de 30 minutos para 'expired'
UPDATE pix_transactions
SET status = 'expired'
WHERE status = 'pending'
AND created_at < NOW() - INTERVAL '30 minutes';

-- Ver quantos foram atualizados
SELECT COUNT(*) as pix_expirados
FROM pix_transactions
WHERE status = 'expired';


-- PASSO 3: OU deletar PIX pendentes antigos (CUIDADO!)
-- ============================================

-- ATENÇÃO: Isso vai DELETAR permanentemente!
-- Use apenas se tiver certeza que não são transações reais

-- Ver PIX que serão deletados (mais de 1 dia)
SELECT 
  id,
  amount,
  status,
  created_at
FROM pix_transactions
WHERE status = 'pending'
AND created_at < NOW() - INTERVAL '1 day';

-- Deletar PIX pendentes há mais de 1 dia
-- DESCOMENTE APENAS SE TIVER CERTEZA!
-- DELETE FROM pix_transactions
-- WHERE status = 'pending'
-- AND created_at < NOW() - INTERVAL '1 day';


-- PASSO 4: Limpar TODOS os PIX pendentes (EXTREMO CUIDADO!)
-- ============================================

-- ATENÇÃO: Isso vai deletar TODOS os PIX pendentes!
-- Use apenas em desenvolvimento ou se tiver certeza

-- Ver TODOS os PIX pendentes
SELECT COUNT(*) as total_pendentes
FROM pix_transactions
WHERE status = 'pending';

-- Deletar TODOS os PIX pendentes
-- DESCOMENTE APENAS SE TIVER ABSOLUTA CERTEZA!
-- DELETE FROM pix_transactions
-- WHERE status = 'pending';


-- PASSO 5: Verificar resultado
-- ============================================

-- Ver status de todos os PIX
SELECT 
  status,
  COUNT(*) as quantidade,
  SUM(amount) as valor_total
FROM pix_transactions
GROUP BY status
ORDER BY status;

-- Ver PIX recentes
SELECT 
  id,
  amount,
  status,
  created_at
FROM pix_transactions
ORDER BY created_at DESC
LIMIT 10;


-- ============================================
-- RECOMENDAÇÕES:
-- ============================================

/*
OPÇÃO 1 - MAIS SEGURA (Recomendado):
- Marcar como 'expired' em vez de deletar
- Mantém histórico
- Execute PASSO 2

OPÇÃO 2 - MODERADA:
- Deletar apenas PIX antigos (mais de 1 dia)
- Execute PASSO 3

OPÇÃO 3 - EXTREMA (Apenas desenvolvimento):
- Deletar TODOS os PIX pendentes
- Execute PASSO 4
- USE APENAS SE TIVER CERTEZA!

DEPOIS:
- Recarregue o dashboard admin
- Card "PIX Pendentes" deve mostrar 0 ou apenas os válidos
*/
