-- ============================================
-- VERIFICAR BUCKET E PERMISSÕES
-- ============================================

-- 1. Ver detalhes do bucket
SELECT 
  id,
  name,
  owner,
  public,
  avif_autodetection,
  file_size_limit,
  allowed_mime_types,
  created_at,
  updated_at
FROM storage.buckets 
WHERE id = 'kyc-documents' OR name = 'kyc-documents';

-- 2. Verificar se RLS está habilitado no bucket
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'storage'
AND tablename = 'buckets';

-- 3. Ver todas as políticas do storage.objects
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
ORDER BY policyname;

-- 4. Testar se o usuário atual consegue listar buckets
-- (Execute isso logado como o usuário que está tentando fazer upload)
SELECT * FROM storage.buckets;

-- 5. Verificar se há políticas bloqueando a listagem de buckets
SELECT * FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'buckets';
