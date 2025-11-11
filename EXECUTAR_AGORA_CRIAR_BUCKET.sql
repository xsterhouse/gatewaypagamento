-- ============================================
-- EXECUTAR ESTE SQL AGORA NO SUPABASE
-- ============================================

-- 1. CRIAR BUCKET kyc-documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents',
  'kyc-documents',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 2. POLÍTICAS DE STORAGE - Usuários podem fazer upload
CREATE POLICY "Users can upload their own KYC documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kyc-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. POLÍTICAS DE STORAGE - Usuários podem ver seus documentos
CREATE POLICY "Users can view their own KYC documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. POLÍTICAS DE STORAGE - Admins podem ver todos
CREATE POLICY "Admins can view all KYC documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'master')
  )
);

-- 5. POLÍTICAS DE STORAGE - Usuários podem atualizar
CREATE POLICY "Users can update their own KYC documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'kyc-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. POLÍTICAS DE STORAGE - Usuários podem deletar
CREATE POLICY "Users can delete their own KYC documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'kyc-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- VERIFICAR SE FOI CRIADO
-- ============================================

SELECT * FROM storage.buckets WHERE id = 'kyc-documents';
