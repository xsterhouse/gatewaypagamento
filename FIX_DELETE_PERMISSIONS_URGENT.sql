-- ============================================
-- SOLUÇÃO URGENTE: Permitir DELETE de transações falhadas
-- ============================================

-- OPÇÃO 1: Desabilitar RLS temporariamente para admins (MAIS SIMPLES)
-- ============================================

-- Remover TODAS as políticas de DELETE existentes
DROP POLICY IF EXISTS "Admins podem deletar qualquer transação" ON pix_transactions;
DROP POLICY IF EXISTS "Admin can delete pix_transactions" ON pix_transactions;
DROP POLICY IF EXISTS "Admins can delete failed transactions" ON pix_transactions;
DROP POLICY IF EXISTS "Admins podem deletar transações falhadas" ON pix_transactions;
DROP POLICY IF EXISTS "Users can delete their own failed transactions" ON pix_transactions;

-- Criar política SUPER PERMISSIVA para admins
CREATE POLICY "Admin master delete all"
ON pix_transactions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'master')
  )
);

-- ============================================
-- OPÇÃO 2: Se a OPÇÃO 1 não funcionar, use esta
-- ============================================

-- Desabilitar RLS completamente (CUIDADO: só use se for necessário)
-- ALTER TABLE pix_transactions DISABLE ROW LEVEL SECURITY;

-- ============================================
-- VERIFICAÇÃO: Testar se está funcionando
-- ============================================

-- 1. Verificar seu role
SELECT id, email, role FROM users WHERE id = auth.uid();

-- 2. Ver transações falhadas
SELECT id, status, amount, user_id, created_at 
FROM pix_transactions 
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;

-- 3. Ver políticas ativas
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'pix_transactions';

-- ============================================
-- TESTE MANUAL: Deletar uma transação específica
-- ============================================

-- Substitua 'SEU-ID-AQUI' pelo ID real de uma transação falhada
-- DELETE FROM pix_transactions 
-- WHERE id = 'SEU-ID-AQUI' 
-- AND status = 'failed';

-- Se o DELETE acima funcionar, o problema está resolvido!
-- Se não funcionar, execute a OPÇÃO 2 (desabilitar RLS)
