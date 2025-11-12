-- ============================================
-- FIX: Permitir que admins deletem transações PIX falhadas
-- ============================================

-- 1. Verificar políticas existentes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'pix_transactions';

-- 2. Remover política de DELETE antiga se existir
DROP POLICY IF EXISTS "Admins podem deletar qualquer transação" ON pix_transactions;
DROP POLICY IF EXISTS "Admin can delete pix_transactions" ON pix_transactions;
DROP POLICY IF EXISTS "Admins can delete failed transactions" ON pix_transactions;

-- 3. Criar nova política para permitir que admins deletem transações falhadas
CREATE POLICY "Admins podem deletar transações falhadas"
ON pix_transactions
FOR DELETE
TO authenticated
USING (
  -- Permitir se o usuário é admin ou master
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'master')
  )
  -- E a transação está com status failed
  AND status = 'failed'
);

-- 4. Verificar se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'pix_transactions';

-- 5. Se RLS não estiver habilitado, habilitar
ALTER TABLE pix_transactions ENABLE ROW LEVEL SECURITY;

-- 6. Verificar as novas políticas
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'pix_transactions' 
AND cmd = 'DELETE';

-- ============================================
-- TESTE: Verificar se você pode deletar
-- ============================================

-- Primeiro, veja suas transações falhadas
SELECT id, status, amount, created_at 
FROM pix_transactions 
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 5;

-- Teste deletar uma transação falhada (substitua o ID)
-- DELETE FROM pix_transactions WHERE id = 'SEU-ID-AQUI' AND status = 'failed';

COMMIT;
