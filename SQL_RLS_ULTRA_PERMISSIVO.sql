-- ========================================
-- POLÍTICAS RLS ULTRA PERMISSIVAS (APENAS PARA TESTE!)
-- ========================================
-- ⚠️ Use isso para descobrir qual política está bloqueando
-- ⚠️ Depois volte para políticas seguras
-- ========================================

-- 1. Remover todas as políticas
DROP POLICY IF EXISTS "Users can view own med requests" ON med_requests;
DROP POLICY IF EXISTS "Users can create own med requests" ON med_requests;
DROP POLICY IF EXISTS "Admins can view all med requests" ON med_requests;
DROP POLICY IF EXISTS "Admins can update med requests" ON med_requests;
DROP POLICY IF EXISTS "med_requests_select_own" ON med_requests;
DROP POLICY IF EXISTS "med_requests_select_admin" ON med_requests;
DROP POLICY IF EXISTS "med_requests_insert_own" ON med_requests;
DROP POLICY IF EXISTS "med_requests_update_admin" ON med_requests;
DROP POLICY IF EXISTS "med_requests_delete_admin" ON med_requests;
DROP POLICY IF EXISTS "select_own_requests" ON med_requests;
DROP POLICY IF EXISTS "select_all_requests_admin" ON med_requests;
DROP POLICY IF EXISTS "insert_own_requests" ON med_requests;
DROP POLICY IF EXISTS "update_requests_admin" ON med_requests;
DROP POLICY IF EXISTS "delete_requests_admin" ON med_requests;

-- 2. Garantir que RLS está ATIVO
ALTER TABLE med_requests ENABLE ROW LEVEL SECURITY;

-- 3. Criar política ULTRA PERMISSIVA para SELECT
CREATE POLICY "allow_all_select"
ON med_requests
FOR SELECT
TO authenticated
USING (true);  -- ⚠️ PERMITE TUDO!

-- 4. Criar política ULTRA PERMISSIVA para INSERT
CREATE POLICY "allow_all_insert"
ON med_requests
FOR INSERT
TO authenticated
WITH CHECK (true);  -- ⚠️ PERMITE TUDO!

-- 5. Criar política ULTRA PERMISSIVA para UPDATE
CREATE POLICY "allow_all_update"
ON med_requests
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);  -- ⚠️ PERMITE TUDO!

-- 6. Criar política ULTRA PERMISSIVA para DELETE
CREATE POLICY "allow_all_delete"
ON med_requests
FOR DELETE
TO authenticated
USING (true);  -- ⚠️ PERMITE TUDO!

-- ========================================
-- VERIFICAÇÃO
-- ========================================

SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'med_requests';

-- ========================================
-- TESTE AGORA!
-- ========================================
-- 1. Tente criar uma solicitação MED
-- 2. Se FUNCIONAR:
--    → O problema era nas políticas
--    → Vamos criar políticas seguras que funcionem
-- 3. Se NÃO FUNCIONAR:
--    → O problema NÃO é RLS
--    → Pode ser foreign key, auth, ou outro
-- ========================================

-- ========================================
-- DEPOIS DO TESTE, EXECUTE PARA VOLTAR SEGURO:
-- ========================================
-- SQL_ATIVAR_RLS_SEGURO_V2.sql (vou criar agora)
-- ========================================
