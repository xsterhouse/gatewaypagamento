-- ========================================
-- CORRIGIR RLS DA TABELA ACTIVITY_LOGS
-- ========================================
-- Problema: Políticas existem mas RLS está DESABILITADO
-- Risco: Dados expostos sem proteção
-- ========================================

-- 1. VERIFICAR ESTADO ATUAL
SELECT 
  relname as tabela,
  relrowsecurity as rls_ativo,
  CASE 
    WHEN relrowsecurity THEN '✅ RLS Ativo'
    ELSE '❌ RLS DESATIVADO - RISCO!'
  END as status
FROM pg_class
WHERE relnamespace = 'public'::regnamespace
  AND relname = 'activity_logs';

-- 2. VER POLÍTICAS EXISTENTES
SELECT 
  polname as nome_politica,
  polcmd as operacao,
  pg_get_expr(polqual, polrelid) AS condicao_using,
  pg_get_expr(polwithcheck, polrelid) AS condicao_with_check
FROM pg_policy
JOIN pg_class ON pg_policy.polrelid = pg_class.oid
WHERE relname = 'activity_logs'
ORDER BY polcmd;

-- ========================================
-- 3. REMOVER POLÍTICAS ANTIGAS (SE EXISTIREM)
-- ========================================
DROP POLICY IF EXISTS "O sistema pode inserir registros de atividades" ON activity_logs;
DROP POLICY IF EXISTS "Os usuários podem visualizar seus próprios registros de atividades" ON activity_logs;
DROP POLICY IF EXISTS "Users can view own activity logs" ON activity_logs;
DROP POLICY IF EXISTS "System can insert activity logs" ON activity_logs;

-- ========================================
-- 4. HABILITAR RLS (CRÍTICO!)
-- ========================================
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 5. CRIAR POLÍTICAS SEGURAS E FUNCIONAIS
-- ========================================

-- Política 1: SELECT - Usuários veem apenas seus próprios logs
CREATE POLICY "activity_logs_select_own"
ON activity_logs
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- Política 2: SELECT - Admins veem todos os logs
CREATE POLICY "activity_logs_select_admin"
ON activity_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'manager')
  )
);

-- Política 3: INSERT - Sistema pode inserir (service_role)
CREATE POLICY "activity_logs_insert_system"
ON activity_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- Política 4: INSERT - Aplicação pode inserir para usuário autenticado
CREATE POLICY "activity_logs_insert_authenticated"
ON activity_logs
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
);

-- Política 5: UPDATE - Apenas admins podem atualizar (se necessário)
CREATE POLICY "activity_logs_update_admin"
ON activity_logs
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Política 6: DELETE - Apenas admins podem deletar
CREATE POLICY "activity_logs_delete_admin"
ON activity_logs
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- ========================================
-- 6. VERIFICAR SE FOI APLICADO CORRETAMENTE
-- ========================================

-- Verificar se RLS está ativo agora
SELECT 
  relname as tabela,
  relrowsecurity as rls_ativo,
  CASE 
    WHEN relrowsecurity THEN '✅ RLS Ativo - SEGURO'
    ELSE '❌ RLS DESATIVADO - ERRO!'
  END as status
FROM pg_class
WHERE relnamespace = 'public'::regnamespace
  AND relname = 'activity_logs';

-- Ver todas as políticas criadas
SELECT 
  policyname as politica,
  cmd as operacao,
  roles::text as roles,
  CASE 
    WHEN cmd = 'SELECT' THEN '👁️ Ver'
    WHEN cmd = 'INSERT' THEN '➕ Criar'
    WHEN cmd = 'UPDATE' THEN '✏️ Editar'
    WHEN cmd = 'DELETE' THEN '🗑️ Deletar'
  END as acao
FROM pg_policies
WHERE tablename = 'activity_logs'
ORDER BY cmd, policyname;

-- Contar políticas por operação
SELECT 
  cmd as operacao,
  COUNT(*) as total_politicas
FROM pg_policies
WHERE tablename = 'activity_logs'
GROUP BY cmd
ORDER BY cmd;

-- ========================================
-- 7. TESTAR AUTENTICAÇÃO
-- ========================================
SELECT 
  auth.uid() as meu_user_id,
  auth.role() as minha_role,
  CASE 
    WHEN auth.uid() IS NOT NULL THEN '✅ Autenticado'
    ELSE '❌ NÃO autenticado'
  END as status_auth;

-- ========================================
-- RESULTADO ESPERADO:
-- ========================================
-- ✅ RLS Ativo
-- ✅ 6 políticas criadas (2 SELECT, 2 INSERT, 1 UPDATE, 1 DELETE)
-- ✅ Usuários veem apenas seus logs
-- ✅ Admins veem todos os logs
-- ✅ Sistema pode inserir logs
-- ========================================

-- ========================================
-- NÍVEIS DE SEGURANÇA:
-- ========================================
-- Cliente:
--   ✅ Ver seus próprios logs
--   ✅ Criar logs para si mesmo
--   ❌ Ver logs de outros
--   ❌ Atualizar logs
--   ❌ Deletar logs
--
-- Manager:
--   ✅ Ver todos os logs
--   ✅ Criar logs
--   ❌ Atualizar logs
--   ❌ Deletar logs
--
-- Admin:
--   ✅ Ver todos os logs
--   ✅ Criar logs
--   ✅ Atualizar logs
--   ✅ Deletar logs
--
-- Service Role (sistema):
--   ✅ Inserir logs automaticamente
-- ========================================
