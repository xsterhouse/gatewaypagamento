-- ========================================
-- CORRIGIR POLÍTICAS RLS DO STORAGE
-- ========================================
-- Execute este SQL para corrigir o erro de upload

-- 1. DELETAR TODAS AS POLÍTICAS ANTIGAS
DROP POLICY IF EXISTS "Users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own product images" ON storage.objects;

-- 2. CRIAR POLÍTICAS CORRETAS

-- Permitir que QUALQUER usuário autenticado faça upload
CREATE POLICY "Authenticated users can upload to product-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Permitir que QUALQUER usuário autenticado veja arquivos
CREATE POLICY "Authenticated users can view product-images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'product-images');

-- Permitir que QUALQUER pessoa (público) veja as imagens
CREATE POLICY "Public can view product-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Permitir que QUALQUER usuário autenticado atualize
CREATE POLICY "Authenticated users can update product-images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images');

-- Permitir que QUALQUER usuário autenticado delete
CREATE POLICY "Authenticated users can delete product-images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- 3. VERIFICAR SE FOI CRIADO
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%product-images%'
ORDER BY policyname;

-- Deve retornar 5 políticas!

-- ========================================
-- TESTE DE UPLOAD
-- ========================================
-- Após executar, teste fazer upload de uma imagem
-- Deve funcionar sem erro de RLS!
