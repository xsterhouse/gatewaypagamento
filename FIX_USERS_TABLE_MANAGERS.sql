-- ========================================
-- FIX TABELA USERS PARA GERENTES
-- ========================================

-- Adicionar campos que podem estar faltando
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS max_clients INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS current_clients INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Garantir que a coluna role aceita 'manager'
-- (caso tenha constraint de CHECK)
DO $$ 
BEGIN
  -- Remove constraint antiga se existir
  ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
  
  -- Adiciona nova constraint permitindo manager
  ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('user', 'admin', 'manager'));
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Constraint já existe ou não precisa ser modificada';
END $$;

-- Verificar políticas RLS para permitir admin criar gerentes
DROP POLICY IF EXISTS "Admins can insert managers" ON users;

CREATE POLICY "Admins can insert managers"
ON users
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Política para admins atualizarem gerentes
DROP POLICY IF EXISTS "Admins can update managers" ON users;

CREATE POLICY "Admins can update managers"
ON users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Política para admins deletarem gerentes
DROP POLICY IF EXISTS "Admins can delete managers" ON users;

CREATE POLICY "Admins can delete managers"
ON users
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Verificar estrutura final
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
