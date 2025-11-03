-- ========================================
-- ADICIONAR COLUNAS NA TABELA USERS
-- ========================================
-- Execute este SQL no Supabase para adicionar as colunas faltantes

-- 1. Adicionar coluna de telefone
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- 2. Adicionar coluna de documento (CPF/CNPJ)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS document VARCHAR(20);

-- 3. Adicionar coluna de endereço
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS address TEXT;

-- 4. Adicionar coluna de cidade
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS city VARCHAR(100);

-- 5. Adicionar coluna de estado
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS state VARCHAR(2);

-- 6. Adicionar coluna de CEP
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS zip_code VARCHAR(10);

-- 7. Adicionar comentários para documentação
COMMENT ON COLUMN users.phone IS 'Telefone do usuário (apenas números)';
COMMENT ON COLUMN users.document IS 'CPF ou CNPJ do usuário (apenas números)';
COMMENT ON COLUMN users.address IS 'Endereço completo do usuário';
COMMENT ON COLUMN users.city IS 'Cidade do usuário';
COMMENT ON COLUMN users.state IS 'Estado do usuário (UF)';
COMMENT ON COLUMN users.zip_code IS 'CEP do usuário (apenas números)';

-- 8. Verificar se as colunas foram criadas
SELECT 
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('phone', 'document', 'address', 'city', 'state', 'zip_code')
ORDER BY column_name;

-- Deve retornar 6 linhas!

-- ========================================
-- FIM DO SCRIPT
-- ========================================
