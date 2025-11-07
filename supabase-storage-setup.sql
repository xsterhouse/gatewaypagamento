-- Configuração do Supabase Storage para Upload de Documentos
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Criar bucket (se ainda não existir)
-- NOTA: Se o bucket já foi criado via UI, pule esta parte
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents', 
  'documents', 
  false, 
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Configurar políticas RLS corretas

-- Política para uploads
CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para downloads
CREATE POLICY "Users can download their own documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para atualizar (replace)
CREATE POLICY "Users can update their own documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para deletar
CREATE POLICY "Users can delete their own documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Ativar RLS (se não estiver ativo)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. Verificar configuração
SELECT 
  bucket_id, 
  name, 
  owner_id, 
  created_at,
  (storage.foldername(name))[1] as folder_name
FROM storage.objects 
WHERE bucket_id = 'documents'
LIMIT 5;
