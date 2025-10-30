-- ================================================
-- SOLUÇÃO RÁPIDA: Erro ao carregar dados do usuário
-- Execute este SQL AGORA!
-- ================================================

-- PASSO 1: Criar registros faltantes
-- ================================================
-- Isto cria automaticamente registros em public.users
-- para todos os usuários que existem em auth.users

INSERT INTO public.users (id, email, name, role, status, kyc_status, created_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)) as name,
  'user' as role,
  'active' as status,
  'pending' as kyc_status,
  au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- PASSO 2: Tornar admins
-- ================================================

-- Tornar admin@dimpay.com admin (PRINCIPAL)
UPDATE public.users
SET 
  role = 'admin',
  name = 'Admin DiMPay',
  status = 'active'
WHERE email = 'admin@dimpay.com';

-- Tornar admin@test.com admin (se existir)
UPDATE public.users
SET 
  role = 'admin',
  name = 'Admin'
WHERE email = 'admin@test.com';

-- ================================================
-- PASSO 3: Verificar se funcionou
-- ================================================

SELECT 
  id,
  email,
  name,
  role,
  status,
  created_at
FROM public.users
ORDER BY created_at DESC;

-- ✅ Se aparecer seu usuário na lista acima, FUNCIONOU!
-- ✅ Agora tente fazer login no sistema

-- ================================================
-- RESULTADO ESPERADO:
-- ================================================
-- Você deve ver pelo menos 1 linha com:
-- - email: admin@test.com
-- - role: admin
-- - status: active
