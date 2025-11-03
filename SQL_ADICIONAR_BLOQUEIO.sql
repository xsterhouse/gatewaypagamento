-- ========================================
-- ADICIONAR SISTEMA DE BLOQUEIO DE CONTAS
-- ========================================

-- 1. Adicionar coluna de bloqueio na tabela users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;

-- 2. Adicionar coluna de motivo do bloqueio
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS blocked_reason TEXT;

-- 3. Adicionar coluna de data do bloqueio
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP WITH TIME ZONE;

-- 4. Adicionar coluna de quem bloqueou
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS blocked_by UUID REFERENCES users(id);

-- 5. Adicionar índice para buscar usuários bloqueados rapidamente
CREATE INDEX IF NOT EXISTS idx_users_blocked ON users(is_blocked) WHERE is_blocked = TRUE;

-- 6. Adicionar comentários
COMMENT ON COLUMN users.is_blocked IS 'Indica se a conta do usuário está bloqueada';
COMMENT ON COLUMN users.blocked_reason IS 'Motivo do bloqueio da conta';
COMMENT ON COLUMN users.blocked_at IS 'Data e hora do bloqueio';
COMMENT ON COLUMN users.blocked_by IS 'ID do admin que bloqueou a conta';

-- 7. Verificar se as colunas foram criadas
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('is_blocked', 'blocked_reason', 'blocked_at', 'blocked_by')
ORDER BY column_name;

-- Deve retornar 4 linhas!

-- ========================================
-- FIM DO SCRIPT
-- ========================================
