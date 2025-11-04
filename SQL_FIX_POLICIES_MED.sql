-- ========================================
-- CORRIGIR POLÍTICAS RLS DA TABELA MED
-- ========================================
-- Execute este script se estiver tendo erro de permissão

-- 1. Remover todas as políticas existentes
DROP POLICY IF EXISTS "Users can view own med requests" ON med_requests;
DROP POLICY IF EXISTS "Users can create own med requests" ON med_requests;
DROP POLICY IF EXISTS "Admins can view all med requests" ON med_requests;
DROP POLICY IF EXISTS "Admins can update med requests" ON med_requests;

-- 2. Desabilitar RLS temporariamente para teste (REMOVA ISSO EM PRODUÇÃO!)
-- ALTER TABLE med_requests DISABLE ROW LEVEL SECURITY;

-- 3. Recriar políticas RLS com verificações mais permissivas

-- Política para CLIENTES verem suas próprias solicitações
CREATE POLICY "Users can view own med requests"
  ON med_requests FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

-- Política para CLIENTES criarem suas próprias solicitações
CREATE POLICY "Users can create own med requests"
  ON med_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'client'
    )
  );

-- Política para ADMINS verem todas as solicitações
CREATE POLICY "Admins can view all med requests"
  ON med_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

-- Política para ADMINS atualizarem solicitações
CREATE POLICY "Admins can update med requests"
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
