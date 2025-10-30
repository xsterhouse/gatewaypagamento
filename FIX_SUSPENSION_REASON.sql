-- ========================================
-- FIX: Adiciona campo suspension_reason
-- ========================================

-- Adicionar campo suspension_reason na tabela users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Verificar estrutura da tabela users
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
