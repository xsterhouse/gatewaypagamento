-- ============================================
-- VERIFICAR USUÁRIOS COM KYC PENDENTE
-- ============================================

-- 1. Ver todos os usuários e seus status KYC
SELECT 
  id,
  name,
  email,
  role,
  kyc_status,
  kyc_submitted_at,
  created_at
FROM public.users
WHERE role = 'user'
ORDER BY created_at DESC
LIMIT 20;

-- 2. Contar usuários por status KYC
SELECT 
  kyc_status,
  COUNT(*) as total
FROM public.users
WHERE role = 'user'
GROUP BY kyc_status
ORDER BY total DESC;

-- 3. Ver usuários com documentos enviados
SELECT 
  u.id,
  u.name,
  u.email,
  u.kyc_status,
  COUNT(kd.id) as total_documentos
FROM public.users u
LEFT JOIN public.kyc_documents kd ON kd.user_id = u.id
WHERE u.role = 'user'
GROUP BY u.id, u.name, u.email, u.kyc_status
HAVING COUNT(kd.id) > 0
ORDER BY u.created_at DESC;

-- 4. Ver usuários com status 'awaiting_verification'
SELECT 
  u.id,
  u.name,
  u.email,
  u.kyc_status,
  u.kyc_submitted_at,
  COUNT(kd.id) as total_documentos
FROM public.users u
LEFT JOIN public.kyc_documents kd ON kd.user_id = u.id
WHERE u.role = 'user'
AND u.kyc_status = 'awaiting_verification'
GROUP BY u.id, u.name, u.email, u.kyc_status, u.kyc_submitted_at
ORDER BY u.created_at DESC;

-- 5. Ver documentos do último usuário criado
SELECT 
  u.name,
  u.email,
  u.kyc_status,
  kd.document_type,
  kd.file_name,
  kd.uploaded_at
FROM public.users u
LEFT JOIN public.kyc_documents kd ON kd.user_id = u.id
WHERE u.role = 'user'
ORDER BY u.created_at DESC, kd.uploaded_at DESC
LIMIT 10;

-- 6. Atualizar status manualmente (se necessário)
-- DESCOMENTE APENAS SE PRECISAR CORRIGIR MANUALMENTE
/*
UPDATE public.users
SET kyc_status = 'awaiting_verification',
    kyc_submitted_at = NOW()
WHERE id = 'COLE_O_ID_DO_USUARIO_AQUI'
AND role = 'user';
*/
