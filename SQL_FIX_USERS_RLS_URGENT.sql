-- ========================================
-- CORRIGIR URGENTE: RLS BLOQUEANDO ADMIN
-- ========================================
-- Erro: Admin não consegue acessar seus próprios dados
-- Status 500 na tabela users
-- ========================================

-- 1. VER POLÍTICAS ATUAIS DA TABELA USERS
SELECT 
  polname as politica,
  polcmd as operacao,
  pg_get_expr(polqual, polrelid) AS condicao_using,
  pg_get_expr(polwithcheck, polrelid) AS condicao_with_check
FROM pg_policy
JOIN pg_class ON pg_policy.polrelid = pg_class.oid
WHERE relname = 'users'
ORDER BY polcmd, polname;

-- 2. REMOVER TODAS AS POLÍTICAS ANTIGAS DA TABELA USERS
DROP POLICY IF EXISTS "Admin Master - Acesso Total a Users" ON users;
DROP POLICY IF EXISTS "Admins can insert managers" ON users;
DROP POLICY IF EXISTS "Manager - Inserir Users" ON users;
DROP POLICY IF EXISTS "insert_own_profile" ON users;
DROP POLICY IF EXISTS "Admins can delete managers" ON users;
DROP POLICY IF EXISTS "admins_delete" ON users;
DROP POLICY IF EXISTS "Cliente - Ver Próprios Dados" ON users;
DROP POLICY IF EXISTS "Manager - Ver Todos Users" ON users;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios dados" ON users;
DROP POLICY IF EXISTS "admins_view_all" ON users;
DROP POLICY IF EXISTS "select_own_profile" ON users;
DROP POLICY IF EXISTS "Admins can update managers" ON users;
DROP POLICY IF EXISTS "Cliente - Atualizar Próprios Dados" ON users;
DROP POLICY IF EXISTS "Manager - Atualizar Users" ON users;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios dados" ON users;
DROP POLICY IF EXISTS "admins_update_all" ON users;
DROP POLICY IF EXISTS "update_own_profile" ON users;

-- 3. CRIAR POLÍTICAS SIMPLES E FUNCIONAIS

-- ============================================
-- SELECT: Ver usuários
-- ============================================

-- Política 1: Usuário vê seus próprios dados
CREATE POLICY "users_select_own"
ON users
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Política 2: Admins e Managers veem todos
CREATE POLICY "users_select_admin"
ON users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role IN ('admin', 'manager')
  )
);

-- ============================================
-- INSERT: Criar usuários
-- ============================================

-- Política 3: Usuário pode criar seu próprio perfil
CREATE POLICY "users_insert_own"
ON users
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Política 4: Admins podem criar qualquer usuário
CREATE POLICY "users_insert_admin"
ON users
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'admin'
  )
);

-- ============================================
-- UPDATE: Atualizar usuários
-- ============================================

-- Política 5: Usuário pode atualizar seus próprios dados
CREATE POLICY "users_update_own"
ON users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Política 6: Admins podem atualizar qualquer usuário
CREATE POLICY "users_update_admin"
ON users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role IN ('admin', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role IN ('admin', 'manager')
  )
);

-- ============================================
-- DELETE: Deletar usuários
-- ============================================

-- Política 7: Apenas admins podem deletar
CREATE POLICY "users_delete_admin"
ON users
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'admin'
  )
);

-- ========================================
-- 4. VERIFICAR SE FOI APLICADO
-- ========================================

-- Ver políticas criadas
SELECT 
  policyname,
  cmd as operacao,
  CASE cmd
    WHEN 'r' THEN '👁️ SELECT'
    WHEN 'a' THEN '➕ INSERT'
    WHEN 'w' THEN '✏️ UPDATE'
    WHEN 'd' THEN '🗑️ DELETE'
  END as acao
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd, policyname;

-- Deve mostrar 7 políticas:
-- users_select_own (SELECT)
-- users_select_admin (SELECT)
-- users_insert_own (INSERT)
-- users_insert_admin (INSERT)
-- users_update_own (UPDATE)
-- users_update_admin (UPDATE)
-- users_delete_admin (DELETE)

-- ========================================
-- 5. TESTAR ACESSO
-- ========================================

-- Verificar autenticação
SELECT 
  auth.uid() as meu_id,
  auth.role() as minha_role;

-- Tentar buscar meu usuário
SELECT 
  id,
  email,
  role,
  name,
  kyc_status
FROM users
WHERE id = auth.uid();

-- Se você é admin, tentar buscar todos
SELECT 
  id,
  email,
  role,
  name
FROM users
ORDER BY created_at DESC;

-- ========================================
-- RESULTADO ESPERADO:
-- ========================================
-- ✅ 7 políticas criadas
-- ✅ Admin consegue ver seus dados
-- ✅ Admin consegue ver todos os usuários
-- ✅ Usuário consegue ver apenas seus dados
-- ✅ Sem erro 500
-- ========================================

-- ========================================
-- SE AINDA DER ERRO 500:
-- ========================================
-- O problema pode estar na recursão da política
-- (política SELECT consultando a própria tabela users)
-- 
-- Nesse caso, use a versão ULTRA SIMPLES abaixo:
-- ========================================

-- VERSÃO ULTRA SIMPLES (descomente se necessário):
-- DROP POLICY IF EXISTS "users_select_own" ON users;
-- DROP POLICY IF EXISTS "users_select_admin" ON users;
-- 
-- CREATE POLICY "users_select_all"
-- ON users
-- FOR SELECT
-- TO authenticated
-- USING (true);
-- 
-- Isso permite que TODOS vejam TODOS
-- Use apenas para diagnóstico!
-- ========================================
