-- ================================================
-- FIX: Admin não consegue ver documentos KYC
-- ================================================

-- PASSO 1: Verificar se as políticas existem
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'kyc_documents';

-- ================================================
-- PASSO 2: Recriar políticas para kyc_documents
-- ================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "users_view_own_kyc_documents" ON public.kyc_documents;
DROP POLICY IF EXISTS "users_insert_own_kyc_documents" ON public.kyc_documents;
DROP POLICY IF EXISTS "users_update_own_kyc_documents" ON public.kyc_documents;
DROP POLICY IF EXISTS "users_delete_own_kyc_documents" ON public.kyc_documents;
DROP POLICY IF EXISTS "admins_view_all_kyc_documents" ON public.kyc_documents;

-- Usuários podem ver próprios documentos
CREATE POLICY "users_view_own_kyc_documents"
ON public.kyc_documents
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Usuários podem inserir próprios documentos
CREATE POLICY "users_insert_own_kyc_documents"
ON public.kyc_documents
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Usuários podem atualizar próprios documentos
CREATE POLICY "users_update_own_kyc_documents"
ON public.kyc_documents
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Usuários podem deletar próprios documentos
CREATE POLICY "users_delete_own_kyc_documents"
ON public.kyc_documents
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ⭐ IMPORTANTE: Admins podem ver TODOS os documentos
CREATE POLICY "admins_view_all_kyc_documents"
ON public.kyc_documents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ================================================
-- PASSO 3: Verificar políticas de Storage
-- ================================================

-- Ver políticas atuais do storage
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%KYC%';

-- ================================================
-- PASSO 4: Recriar políticas de Storage
-- ================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can upload own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all KYC documents" ON storage.objects;

-- Permitir upload de arquivos (usuários autenticados)
CREATE POLICY "Users can upload own KYC documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kyc-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir visualização de próprios arquivos
CREATE POLICY "Users can view own KYC documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir deletar próprios arquivos
CREATE POLICY "Users can delete own KYC documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'kyc-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ⭐ IMPORTANTE: Admins podem ver TODOS os documentos no storage
CREATE POLICY "Admins can view all KYC documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents'
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ================================================
-- PASSO 5: Verificar se o bucket está configurado corretamente
-- ================================================

-- Ver configuração do bucket
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'kyc-documents';

-- Se o bucket não existir, criar
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents', 
  'kyc-documents', 
  false,  -- PRIVADO para segurança
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

-- ================================================
-- PASSO 6: Testar consultas
-- ================================================

-- Ver todos os documentos (como admin)
-- SELECT * FROM public.kyc_documents;

-- Ver documentos de um usuário específico
-- SELECT * FROM public.kyc_documents WHERE user_id = 'USER_ID_AQUI';

-- Contar documentos por usuário
-- SELECT user_id, COUNT(*) as total_docs
-- FROM public.kyc_documents
-- GROUP BY user_id;

-- ================================================
-- PASSO 7: Verificar se você é admin
-- ================================================

-- Ver seu usuário atual
-- SELECT id, email, name, role FROM public.users WHERE id = auth.uid();

-- Se não for admin, tornar admin
-- UPDATE public.users SET role = 'admin' WHERE email = 'seu_email@example.com';

-- ================================================
-- RESULTADO ESPERADO:
-- ================================================
-- ✅ Políticas RLS criadas para kyc_documents
-- ✅ Políticas de storage criadas
-- ✅ Admins podem ver todos os documentos
-- ✅ Usuários podem ver apenas próprios documentos
-- ✅ Bucket configurado como privado
-- ================================================

SELECT 'Políticas de documentos KYC corrigidas com sucesso!' as status;
