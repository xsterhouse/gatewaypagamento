-- ============================================
-- CORRIGIR POLÍTICAS DO BUCKET kyc-documents
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- 1. REMOVER TODAS AS POLÍTICAS ANTIGAS DO BUCKET
DROP POLICY IF EXISTS "Users can upload their own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own KYC documents" ON storage.objects;

-- 2. CRIAR POLÍTICA DE UPLOAD (INSERT)
CREATE POLICY "Users can upload their own KYC documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kyc-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. CRIAR POLÍTICA DE VISUALIZAÇÃO PRÓPRIA (SELECT)
CREATE POLICY "Users can view their own KYC documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. CRIAR POLÍTICA DE VISUALIZAÇÃO ADMIN (SELECT)
CREATE POLICY "Admins can view all KYC documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'master')
  )
);

-- 5. CRIAR POLÍTICA DE ATUALIZAÇÃO (UPDATE)
CREATE POLICY "Users can update their own KYC documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'kyc-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. CRIAR POLÍTICA DE EXCLUSÃO (DELETE)
CREATE POLICY "Users can delete their own KYC documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'kyc-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- VERIFICAR POLÍTICAS CRIADAS
-- ============================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%KYC%'
ORDER BY policyname;

-- ============================================
-- VERIFICAR BUCKET
-- ============================================

SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'kyc-documents';
