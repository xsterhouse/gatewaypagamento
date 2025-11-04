-- ========================================
-- ATIVAR RLS COM POLÍTICAS CORRETAS E FUNCIONAIS
-- ========================================
-- Este script vai reativar o RLS de forma segura
-- ========================================

-- 1. Remover TODAS as políticas antigas
DROP POLICY IF EXISTS "Users can view own med requests" ON med_requests;
DROP POLICY IF EXISTS "Users can create own med requests" ON med_requests;
DROP POLICY IF EXISTS "Admins can view all med requests" ON med_requests;
DROP POLICY IF EXISTS "Admins can update med requests" ON med_requests;
DROP POLICY IF EXISTS "med_requests_select_own" ON med_requests;
DROP POLICY IF EXISTS "med_requests_select_admin" ON med_requests;
DROP POLICY IF EXISTS "med_requests_insert_own" ON med_requests;
DROP POLICY IF EXISTS "med_requests_update_admin" ON med_requests;
DROP POLICY IF EXISTS "med_requests_delete_admin" ON med_requests;

-- 2. Reativar RLS
ALTER TABLE med_requests ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas SIMPLES e FUNCIONAIS

-- ============================================
-- SELECT: Ver solicitações
-- ============================================

-- Política 1: Usuário vê suas próprias solicitações
CREATE POLICY "select_own_requests"
ON med_requests
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Política 2: Admins veem tudo
CREATE POLICY "select_all_requests_admin"
ON med_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'manager')
  )
);

-- ============================================
-- INSERT: Criar solicitações
-- ============================================

-- Política 3: Qualquer usuário autenticado pode criar para si mesmo
CREATE POLICY "insert_own_requests"
ON med_requests
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- ============================================
-- UPDATE: Atualizar solicitações
-- ============================================

-- Política 4: Apenas admins podem atualizar
CREATE POLICY "update_requests_admin"
ON med_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'manager')
  )
);

-- ============================================
-- DELETE: Deletar solicitações
-- ============================================

-- Política 5: Apenas admins podem deletar
CREATE POLICY "delete_requests_admin"
ON med_requests
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- ========================================
-- VERIFICAÇÕES
-- ========================================

-- Verificar se RLS está ativo
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'med_requests';
-- Deve retornar: rowsecurity = true

-- Ver todas as políticas criadas
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'med_requests'
ORDER BY policyname;

-- Testar autenticação atual
SELECT 
  auth.uid() as meu_id,
  auth.role() as minha_role_supabase;

-- Ver meus dados de usuário
SELECT 
  id,
  email,
  role,
  name
FROM users
WHERE id = auth.uid();

-- ========================================
-- TESTE FINAL
-- ========================================
-- Tente criar uma solicitação MED pelo painel do cliente
-- Se funcionar, as políticas estão corretas! ✅
-- ========================================
