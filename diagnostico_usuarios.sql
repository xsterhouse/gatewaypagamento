-- ================================================
-- DIAGNÓSTICO: Erro ao carregar dados do usuário
-- ================================================

-- 1. VER USUÁRIOS NO AUTH (Supabase Auth)
-- ================================================
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at,
  confirmed_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- ================================================
-- 2. VER USUÁRIOS NA TABELA PUBLIC.USERS
-- ================================================
SELECT 
  id,
  email,
  name,
  role,
  status,
  created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- ================================================
-- 3. ENCONTRAR USUÁRIOS FALTANDO
-- (Estão no auth.users mas NÃO em public.users)
-- ================================================
SELECT 
  au.id,
  au.email,
  au.created_at,
  'FALTANDO NA TABELA USERS' as problema
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC;

-- ================================================
-- 4. CORRIGIR: CRIAR USUÁRIOS FALTANDO
-- ================================================
-- Execute esta query para criar os registros faltantes:

INSERT INTO public.users (id, email, name, role, status)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)) as name,
  COALESCE(au.raw_user_meta_data->>'role', 'user') as role,
  'active' as status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- 5. VERIFICAR POLÍTICAS RLS
-- ================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users';

-- ================================================
-- 6. VERIFICAR TRIGGERS
-- ================================================
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public' AND event_object_table = 'users'
   OR trigger_schema = 'auth' AND event_object_table = 'users';

-- ================================================
-- 7. TESTE: CONTAR USUÁRIOS
-- ================================================
SELECT 
  'Total no auth.users' as local,
  COUNT(*) as quantidade
FROM auth.users

UNION ALL

SELECT 
  'Total no public.users' as local,
  COUNT(*) as quantidade
FROM public.users;

-- ================================================
-- 8. CRIAR USUÁRIO ADMIN DE TESTE (SE NECESSÁRIO)
-- ================================================
-- Descomente e modifique com um email que existe no auth.users:

/*
UPDATE public.users
SET 
  role = 'admin',
  status = 'active',
  name = 'Admin Teste'
WHERE email = 'admin@test.com';
*/

-- ================================================
-- 9. VERIFICAR USUÁRIO ESPECÍFICO
-- ================================================
-- Substitua o email pelo seu:

/*
SELECT 
  pu.*,
  au.email as auth_email,
  au.confirmed_at,
  au.last_sign_in_at
FROM public.users pu
FULL OUTER JOIN auth.users au ON pu.id = au.id
WHERE au.email = 'seu_email@example.com' OR pu.email = 'seu_email@example.com';
*/

-- ================================================
-- 10. SOLUÇÃO RÁPIDA: DESABILITAR RLS TEMPORARIAMENTE
-- (Apenas para testar se o problema é RLS)
-- ================================================
-- CUIDADO: Apenas para desenvolvimento/teste!

/*
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
-- Após testar, habilitar novamente:
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
*/
