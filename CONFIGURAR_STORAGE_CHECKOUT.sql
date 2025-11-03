-- ========================================
-- CONFIGURAÇÃO DE STORAGE PARA CHECKOUT
-- ========================================
-- Configurar bucket e políticas para upload de imagens

-- 1. Criar bucket para imagens de produtos (se não existir)
-- Execute no Supabase Dashboard > Storage
-- Ou use a interface para criar um bucket chamado 'product-images'
-- Configurações do bucket:
-- - Nome: product-images
-- - Público: true (para as imagens serem acessíveis)
-- - Tipos permitidos: image/jpeg, image/png, image/webp, image/gif

-- 2. Políticas RLS para o bucket product-images

-- Permitir que usuários autenticados façam upload
CREATE POLICY "Users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que usuários vejam suas próprias imagens
CREATE POLICY "Users can view own product images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'product-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que qualquer um veja imagens públicas (para página de checkout)
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Permitir que usuários atualizem suas próprias imagens
CREATE POLICY "Users can update own product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que usuários deletem suas próprias imagens
CREATE POLICY "Users can delete own product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Atualizar políticas RLS da tabela payment_links
-- Garantir que usuários possam criar links

-- Remover política antiga se existir
DROP POLICY IF EXISTS "Users can create own payment links" ON payment_links;

-- Criar nova política mais permissiva
CREATE POLICY "Users can create own payment links"
  ON payment_links FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'manager', 'client')
    )
  );

-- Garantir que usuários possam atualizar seus próprios links
DROP POLICY IF EXISTS "Users can update own payment links" ON payment_links;

CREATE POLICY "Users can update own payment links"
  ON payment_links FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'manager')
    )
  );

-- ========================================
-- INSTRUÇÕES DE USO
-- ========================================
-- 
-- 1. Criar Bucket no Supabase:
--    - Vá em Storage > Create Bucket
--    - Nome: product-images
--    - Público: Sim
--    - Tipos permitidos: image/*
--
-- 2. Execute este SQL no SQL Editor
--
-- 3. Teste fazendo upload de uma imagem
--
-- Estrutura de pastas:
-- product-images/
--   └── {user_id}/
--       └── {filename}
--
-- Exemplo:
-- product-images/123e4567-e89b-12d3-a456-426614174000/produto-1.jpg
--
-- ========================================
