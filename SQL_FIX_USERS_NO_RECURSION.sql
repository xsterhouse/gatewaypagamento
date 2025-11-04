-- ========================================
-- CORRIGIR USERS SEM RECURSÃO
-- ========================================
-- Problema: Políticas SELECT consultam a própria tabela users
-- Isso causa recursão infinita e erro 500
-- Solução: Usar apenas auth.uid() sem consultar users
-- ========================================

-- 1. REMOVER TODAS AS POLÍTICAS DA TABELA USERS
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
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_select_admin" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_insert_admin" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_update_admin" ON users;
DROP POLICY IF EXISTS "users_delete_admin" ON users;

-- ========================================
-- 2. CRIAR POLÍTICAS SEM RECURSÃO
-- ========================================

-- ESTRATÉGIA: Usar políticas mais permissivas para SELECT
-- e restritivas para INSERT/UPDATE/DELETE

-- ============================================
-- SELECT: PERMISSIVO (todos veem seus dados + admins veem tudo)
-- ============================================

-- Política 1: Todos podem ver seus próprios dados
CREATE POLICY "users_view_own"
ON users
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Política 2: Admins específicos veem tudo (sem consultar tabela users)
-- Lista os IDs dos admins diretamente
CREATE POLICY "users_view_all_admins"
ON users
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    '0db7ecd8-f2b2-4110-a374-8dbd6377b0b3'::uuid,  -- Admin DiMPay
    '2fa840dc-9fed-4ad1-b613-f3f577aefb40'::uuid   -- Fabio FR (Manager)
  )
);

-- ============================================
-- INSERT: Permissivo (qualquer autenticado pode criar)
-- ============================================

CREATE POLICY "users_insert_any"
ON users
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================
-- UPDATE: Usuário atualiza seus dados
-- ============================================

CREATE POLICY "users_update_own"
ON users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Admins podem atualizar qualquer um
CREATE POLICY "users_update_admins"
ON users
FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    '0db7ecd8-f2b2-4110-a374-8dbd6377b0b3'::uuid,
    '2fa840dc-9fed-4ad1-b613-f3f577aefb40'::uuid
  )
)
WITH CHECK (
  auth.uid() IN (
    '0db7ecd8-f2b2-4110-a374-8dbd6377b0b3'::uuid,
    '2fa840dc-9fed-4ad1-b613-f3f577aefb40'::uuid
  )
);

-- ============================================
-- DELETE: Apenas admins específicos
-- ============================================

CREATE POLICY "users_delete_admins"
ON users
FOR DELETE
TO authenticated
USING (
  auth.uid() = '0db7ecd8-f2b2-4110-a374-8dbd6377b0b3'::uuid  -- Apenas Admin DiMPay
);

-- ========================================
-- 3. VERIFICAR
-- ========================================

SELECT 
  policyname,
  cmd,
  CASE cmd
    WHEN 'r' THEN '👁️ SELECT'
    WHEN 'a' THEN '➕ INSERT'
    WHEN 'w' THEN '✏️ UPDATE'
    WHEN 'd' THEN '🗑️ DELETE'
  END as acao
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd, policyname;

-- ========================================
-- 4. TESTAR
-- ========================================

-- Buscar seu usuário
SELECT * FROM users WHERE id = auth.uid();

-- Buscar todos (se você for admin)
SELECT id, email, role, name FROM users;

-- ========================================
-- RESULTADO ESPERADO:
-- ========================================
-- ✅ Sem erro 500
-- ✅ Admin vê todos os usuários
-- ✅ Manager vê todos os usuários
-- ✅ Cliente vê apenas seus dados
-- ========================================

-- ========================================
-- NOTA IMPORTANTE:
-- ========================================
-- Esta solução usa IDs hardcoded dos admins
-- Isso evita recursão mas requer atualização manual
-- quando novos admins forem criados
-- 
-- Para adicionar novo admin, execute:
-- DROP POLICY "users_view_all_admins" ON users;
-- CREATE POLICY "users_view_all_admins" ON users FOR SELECT
-- USING (auth.uid() IN ('id1'::uuid, 'id2'::uuid, 'id3'::uuid));
-- ========================================
