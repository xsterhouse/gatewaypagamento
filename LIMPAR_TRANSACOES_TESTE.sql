-- ==========================================
-- Limpar Transações de Teste
-- ==========================================

-- 1. Deletar TODAS as transações
DELETE FROM transactions;

-- 2. Deletar TODOS os bloqueios de saldo
DELETE FROM balance_locks;

-- 3. Resetar as sequences (opcional - para IDs começarem do 0 novamente)
-- Não é necessário pois estamos usando UUID

-- 4. Verificar se está vazio
SELECT COUNT(*) as total_transactions FROM transactions;
SELECT COUNT(*) as total_locks FROM balance_locks;

-- ==========================================
-- Resultado Esperado
-- ==========================================
-- total_transactions: 0
-- total_locks: 0

-- ==========================================
-- Observações
-- ==========================================
-- Este script deleta TODAS as transações e bloqueios.
-- Use com cuidado em produção!
-- Certifique-se de que deseja deletar tudo antes de executar.
