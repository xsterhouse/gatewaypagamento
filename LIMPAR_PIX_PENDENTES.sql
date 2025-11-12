-- ============================================
-- LIMPAR PIX PENDENTES DO BANCO DE DADOS
-- ============================================

-- PASSO 1: Ver todos os PIX pendentes
-- ============================================

SELECT 
  id,
  user_id,
  amount,
  fee_amount,
  status,
  pix_code,
  transaction_type,
  created_at
FROM pix_transactions
WHERE status = 'pending'
ORDER BY created_at DESC;


-- PASSO 2: Marcar como cancelados (mais de 30 minutos)
-- ============================================

-- Atualizar PIX pendentes há mais de 30 minutos para 'cancelled'
UPDATE pix_transactions
SET status = 'cancelled'
WHERE status = 'pending'
AND created_at < NOW() - INTERVAL '30 minutes';

-- Ver quantos foram atualizados
SELECT COUNT(*) as pix_cancelados
FROM pix_transactions
WHERE status = 'cancelled';


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


-- PASSO 4: DELETAR TODOS OS PIX PENDENTES (Use este!)
-- ============================================

-- Ver quantos PIX pendentes existem
SELECT COUNT(*) as total_pendentes, SUM(amount) as valor_total
FROM pix_transactions
WHERE status = 'pending';

-- DELETAR TODOS OS PIX PENDENTES
-- Execute este comando para limpar tudo:

DELETE FROM pix_transactions
WHERE status = 'pending'
AND transaction_type = 'withdrawal';

-- Confirmar que foram deletados
SELECT COUNT(*) as pendentes_restantes
FROM pix_transactions
WHERE status = 'pending';


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
