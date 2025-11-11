-- ============================================
-- CRIAR BUCKET PARA DOCUMENTOS KYC
-- ============================================

-- 1. Criar bucket kyc-documents (se não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents',
  'kyc-documents',
  true, -- Público para permitir visualização
  5242880, -- 5MB em bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- POLÍTICAS RLS PARA O BUCKET
-- ============================================

-- 2. Permitir que usuários autenticados façam upload de seus próprios documentos
CREATE POLICY "Users can upload their own KYC documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kyc-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Permitir que usuários vejam seus próprios documentos
CREATE POLICY "Users can view their own KYC documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Permitir que admins vejam todos os documentos
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

-- 5. Permitir que usuários atualizem seus próprios documentos
CREATE POLICY "Users can update their own KYC documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'kyc-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Permitir que usuários deletem seus próprios documentos
CREATE POLICY "Users can delete their own KYC documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'kyc-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verificar se o bucket foi criado
SELECT * FROM storage.buckets WHERE id = 'kyc-documents';

-- Verificar políticas
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%KYC%';
