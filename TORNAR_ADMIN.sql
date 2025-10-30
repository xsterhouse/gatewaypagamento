-- ================================================
-- TORNAR admin@dimpay.com ADMIN
-- ================================================

-- Atualizar role para admin
UPDATE public.users
SET 
  role = 'admin',
  name = 'Admin DiMPay',
  status = 'active'
WHERE email = 'admin@dimpay.com';

-- ================================================
-- VERIFICAR SE FUNCIONOU
-- ================================================

SELECT 
  id,
  email,
  name,
  role,
  status,
  created_at
FROM public.users
WHERE email = 'admin@dimpay.com';

-- ✅ Deve mostrar:
-- email: admin@dimpay.com
-- role: admin
-- status: active

-- ================================================
-- VERIFICAR TODOS OS ADMINS
-- ================================================

SELECT 
  email,
  name,
  role,
  status
FROM public.users
WHERE role = 'admin'
ORDER BY email;

-- ✅ admin@dimpay.com deve aparecer aqui
