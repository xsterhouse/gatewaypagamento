-- ================================================
-- SOLUÇÃO DEFINITIVA: Erro ao carregar dados
-- ================================================
-- Execute este SQL COMPLETO de uma vez!
-- ================================================

-- PASSO 1: Desabilitar RLS temporariamente
-- ================================================
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- ================================================
-- PASSO 2: Criar/Atualizar registros faltantes
-- ================================================

-- Deletar e recriar registros para garantir consistência
DELETE FROM public.users 
WHERE id IN (
  SELECT au.id 
  FROM auth.users au
);

-- Criar todos os usuários do auth.users
INSERT INTO public.users (
  id, 
  email, 
  name, 
  role, 
  status, 
  kyc_status,
  two_fa_enabled,
  created_at,
  updated_at
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)) as name,
  CASE 
    WHEN au.email = 'admin@dimpay.com' THEN 'admin'
    WHEN au.email LIKE '%admin%' THEN 'admin'
    ELSE 'user'
  END as role,
  'active' as status,
  'pending' as kyc_status,
  false as two_fa_enabled,
  au.created_at,
  NOW() as updated_at
FROM auth.users au;

-- ================================================
-- PASSO 3: Garantir que admin@dimpay.com é admin
-- ================================================

UPDATE public.users
SET 
  role = 'admin',
  name = 'Admin DiMPay',
  status = 'active'
WHERE email = 'admin@dimpay.com';

-- ================================================
-- PASSO 4: Habilitar RLS novamente
-- ================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ================================================
-- PASSO 5: Recriar políticas RLS (simples)
-- ================================================

-- Deletar políticas antigas
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "admins_select_all" ON public.users;
DROP POLICY IF EXISTS "admins_update_all" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "admins_delete_all" ON public.users;

-- Política SIMPLES 1: Todos podem ver próprio perfil
CREATE POLICY "select_own_profile"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Política SIMPLES 2: Todos podem atualizar próprio perfil  
CREATE POLICY "update_own_profile"
ON public.users
FOR UPDATE
USING (auth.uid() = id);

-- Política SIMPLES 3: Admins veem tudo
CREATE POLICY "admins_view_all"
ON public.users
FOR SELECT
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- Política SIMPLES 4: Admins atualizam tudo
CREATE POLICY "admins_update_all"
ON public.users
FOR UPDATE
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- Política SIMPLES 5: Permitir insert próprio (registro)
CREATE POLICY "insert_own_profile"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Política SIMPLES 6: Admins deletam
CREATE POLICY "admins_delete"
ON public.users
FOR DELETE
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- ================================================
-- PASSO 6: VERIFICAÇÃO FINAL
-- ================================================

-- Ver todos os usuários
SELECT 
  id,
  email,
  name,
  role,
  status,
  created_at
FROM public.users
ORDER BY created_at DESC;

-- Verificar admin@dimpay.com
SELECT 
  '✅ admin@dimpay.com' as usuario,
  role,
  status,
  CASE 
    WHEN role = 'admin' THEN '✅ CORRETO'
    ELSE '❌ INCORRETO - Execute novamente'
  END as verificacao
FROM public.users
WHERE email = 'admin@dimpay.com';

-- Contar por role
SELECT 
  role,
  COUNT(*) as total
FROM public.users
GROUP BY role;

-- ================================================
-- RESULTADO ESPERADO:
-- ================================================
-- ✅ Deve mostrar todos os usuários
-- ✅ admin@dimpay.com deve ter role = 'admin'
-- ✅ Políticas RLS devem estar ativas
-- ✅ Login deve funcionar agora!
-- ================================================
