-- ========================================
-- CORRIGIR INSERT COM SEGURANÇA MODERADA
-- ========================================
-- Versão mais segura que a anterior, mas que funciona
-- ========================================

-- 1. Remover todas as políticas de INSERT
DROP POLICY IF EXISTS "Users can create own med requests" ON med_requests;
DROP POLICY IF EXISTS "med_requests_insert_own" ON med_requests;
DROP POLICY IF EXISTS "insert_own_requests" ON med_requests;
DROP POLICY IF EXISTS "med_insert" ON med_requests;
DROP POLICY IF EXISTS "med_insert_simple" ON med_requests;
DROP POLICY IF EXISTS "allow_all_insert" ON med_requests;

-- 2. Criar política que verifica se usuário existe
CREATE POLICY "med_insert_verified"
ON med_requests
FOR INSERT
TO authenticated
WITH CHECK (
  -- Verifica se o usuário que está inserindo existe na tabela users
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
  )
  AND
  -- Verifica se o user_id da solicitação é o mesmo do usuário autenticado
  user_id = auth.uid()
);

-- ========================================
-- DIFERENÇA DAS VERSÕES:
-- ========================================
-- 
-- SUPER SIMPLES (SQL_FIX_INSERT_POLICY.sql):
--   WITH CHECK (true)
--   → Permite tudo, menos seguro
-- 
-- SEGURO (este arquivo):
--   WITH CHECK (EXISTS(...) AND user_id = auth.uid())
--   → Verifica usuário existe E que está criando para si mesmo
-- 
-- ========================================

-- 3. Verificar
SELECT 
  policyname,
  cmd,
  with_check
FROM pg_policies
WHERE tablename = 'med_requests'
AND cmd = 'INSERT';

-- ========================================
-- SE ESTE NÃO FUNCIONAR:
-- ========================================
-- Execute: SQL_FIX_INSERT_POLICY.sql (versão super simples)
-- ========================================
