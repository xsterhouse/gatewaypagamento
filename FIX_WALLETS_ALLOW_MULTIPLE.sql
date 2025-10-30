-- ========================================
-- FIX: Permitir múltiplas carteiras da mesma moeda
-- ========================================

-- 1. Adicionar coluna wallet_name se não existir
ALTER TABLE wallets 
ADD COLUMN IF NOT EXISTS wallet_name TEXT;

-- 2. Atualizar carteiras existentes sem nome
UPDATE wallets 
SET wallet_name = CONCAT(currency_code, ' - Carteira Principal')
WHERE wallet_name IS NULL OR wallet_name = '';

-- 3. Remover constraint única de user_id + currency_code
ALTER TABLE wallets 
DROP CONSTRAINT IF EXISTS wallets_user_id_currency_code_key;

-- 4. Verificar estrutura da tabela
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'wallets'
ORDER BY ordinal_position;

-- 5. Verificar constraints
SELECT
  conname AS constraint_name,
  contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'wallets'::regclass;

-- ========================================
-- RESULTADO ESPERADO:
-- ========================================
-- Agora os usuários podem criar múltiplas carteiras da mesma moeda
-- Cada carteira terá um nome único (wallet_name)
-- Exemplos:
-- - BTC - Investimento
-- - BTC - Trading
-- - BTC - Reserva
-- - USD - Conta Principal
-- - USD - Poupança
