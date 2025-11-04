-- ========================================
-- CORRIGIR POLÍTICAS RLS DA TABELA MED
-- ========================================
-- Execute este script se estiver tendo erro de permissão

-- 1. Remover todas as políticas existentes (antigas e novas)
DROP POLICY IF EXISTS "Users can view own med requests" ON med_requests;
DROP POLICY IF EXISTS "Users can create own med requests" ON med_requests;
DROP POLICY IF EXISTS "Admins can view all med requests" ON med_requests;
DROP POLICY IF EXISTS "Admins can update med requests" ON med_requests;
DROP POLICY IF EXISTS "med_requests_select_own" ON med_requests;
DROP POLICY IF EXISTS "med_requests_select_admin" ON med_requests;
DROP POLICY IF EXISTS "med_requests_insert_own" ON med_requests;
DROP POLICY IF EXISTS "med_requests_update_admin" ON med_requests;
DROP POLICY IF EXISTS "med_requests_delete_admin" ON med_requests;

-- 2. Garantir que RLS está habilitado
ALTER TABLE med_requests ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas RLS SEGURAS e FUNCIONAIS

-- ============================================
-- POLÍTICAS PARA SELECT (Visualizar)
-- ============================================

-- Clientes podem ver APENAS suas próprias solicitações
CREATE POLICY "med_requests_select_own"
  ON med_requests FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- Admins e Managers podem ver TODAS as solicitações
CREATE POLICY "med_requests_select_admin"
  ON med_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

-- ============================================
-- POLÍTICAS PARA INSERT (Criar)
-- ============================================

-- Clientes podem criar solicitações para si mesmos
CREATE POLICY "med_requests_insert_own"
  ON med_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('client', 'admin', 'manager')
    )
  );

-- ============================================
-- POLÍTICAS PARA UPDATE (Atualizar)
-- ============================================

-- Apenas Admins e Managers podem atualizar
CREATE POLICY "med_requests_update_admin"
  ON med_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

-- ============================================
-- POLÍTICAS PARA DELETE (Deletar)
-- ============================================

-- Apenas Admins podem deletar (segurança extra)
CREATE POLICY "med_requests_delete_admin"
  ON med_requests FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- 4. Verificar se as políticas foram criadas
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
WHERE tablename = 'med_requests';

-- 5. Testar se o auth.uid() está funcionando
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role;

-- 6. Verificar se o usuário existe na tabela users
SELECT 
  id,
  email,
  role,
  name
FROM users
WHERE id = auth.uid();

-- ========================================
-- DIAGNÓSTICO
-- ========================================
-- Se o teste acima retornar NULL para auth.uid(), 
-- o problema é com a autenticação do Supabase.
-- 
-- Soluções:
-- 1. Verifique se está logado no sistema
-- 2. Verifique se o token JWT está válido
-- 3. Tente fazer logout e login novamente
-- ========================================
