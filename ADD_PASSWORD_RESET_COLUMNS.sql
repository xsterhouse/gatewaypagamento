-- ========================================
-- Adiciona colunas para reset de senha
-- ========================================

-- Adicionar coluna para senha temporária (opcional)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS temp_password TEXT;

-- Adicionar coluna para indicar que precisa resetar senha
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_reset_required BOOLEAN DEFAULT false;

-- Verificar estrutura da tabela
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('temp_password', 'password_reset_required')
ORDER BY ordinal_position;
