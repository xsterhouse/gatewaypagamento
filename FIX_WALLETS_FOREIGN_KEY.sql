-- ========================================
-- FIX: Adiciona Foreign Key entre wallets e users
-- ========================================

-- 1. Verificar se a foreign key já existe
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'wallets';

-- 2. Adicionar foreign key se não existir
ALTER TABLE wallets
DROP CONSTRAINT IF EXISTS wallets_user_id_fkey;

ALTER TABLE wallets
ADD CONSTRAINT wallets_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE;

-- 3. Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

-- 4. Verificar a relação criada
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'wallets';

-- ========================================
-- RESULTADO ESPERADO:
-- ========================================
-- constraint_name: wallets_user_id_fkey
-- table_name: wallets
-- column_name: user_id
-- foreign_table_name: users
-- foreign_column_name: id
