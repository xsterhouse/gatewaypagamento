-- ================================================
-- CORRIGIR POLÍTICAS RLS - SEM REFERÊNCIAS CIRCULARES
-- ================================================
-- Execute DEPOIS de confirmar que o login funciona
-- com RLS desabilitado
-- ================================================

-- PASSO 1: Limpar políticas antigas
-- ================================================

DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "admins_select_all" ON public.users;
DROP POLICY IF EXISTS "admins_update_all" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "admins_delete_all" ON public.users;
DROP POLICY IF EXISTS "select_own_profile" ON public.users;
DROP POLICY IF EXISTS "update_own_profile" ON public.users;
DROP POLICY IF EXISTS "admins_view_all" ON public.users;
DROP POLICY IF EXISTS "admins_update_all" ON public.users;
DROP POLICY IF EXISTS "insert_own_profile" ON public.users;
DROP POLICY IF EXISTS "admins_delete" ON public.users;

-- ================================================
-- PASSO 2: Criar políticas CORRETAS (sem circular reference)
-- ================================================

-- POLÍTICA 1: SELECT - Todos podem ler PRÓPRIO perfil
CREATE POLICY "allow_select_own"
ON public.users
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
);

-- POLÍTICA 2: SELECT - Admins podem ler TODOS
-- Usa raw_user_meta_data do auth.users (não consulta users)
CREATE POLICY "allow_select_admins"
ON public.users
FOR SELECT
TO authenticated
USING (
  (auth.jwt()->>'email')::text IN (
    SELECT email FROM public.users WHERE role = 'admin' AND id = auth.uid()
  )
  OR id = auth.uid()
);

-- POLÍTICA 3: INSERT - Permitir criar próprio perfil (registro)
CREATE POLICY "allow_insert_own"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (
  id = auth.uid()
);

-- POLÍTICA 4: UPDATE - Todos podem atualizar PRÓPRIO perfil
CREATE POLICY "allow_update_own"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- POLÍTICA 5: UPDATE - Admins podem atualizar TODOS
-- Verifica role no próprio registro do usuário logado
CREATE POLICY "allow_update_admins"
ON public.users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- POLÍTICA 6: DELETE - Apenas admins podem deletar
CREATE POLICY "allow_delete_admins"
ON public.users
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- ================================================
-- PASSO 3: HABILITAR RLS
-- ================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ================================================
-- PASSO 4: VERIFICAÇÃO
-- ================================================

-- Ver políticas criadas
SELECT 
  policyname,
  cmd as operacao,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || qual::text
    ELSE 'N/A'
  END as condicao_using,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check::text
    ELSE 'N/A'
  END as condicao_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Ver status RLS
SELECT 
  tablename,
  rowsecurity as rls_ativo,
  CASE 
    WHEN rowsecurity THEN '✅ RLS habilitado corretamente'
    ELSE '❌ RLS desabilitado'
  END as status
FROM pg_tables
WHERE tablename = 'users' AND schemaname = 'public';

-- Contar políticas
SELECT 
  'Total de políticas:' as info,
  COUNT(*) as quantidade
FROM pg_policies
WHERE tablename = 'users';

-- ================================================
-- RESULTADO ESPERADO:
-- ================================================
-- ✅ 6 políticas criadas
-- ✅ RLS habilitado
-- ✅ Login deve funcionar
-- ✅ Usuários veem próprio perfil
-- ✅ Admins veem todos os perfis
-- ================================================
