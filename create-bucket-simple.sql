-- Script simplificado para criar bucket
-- Use este se não tiver permissão de owner

-- Criar bucket básico
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents', 
  'documents', 
  false, 
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
);

-- Verificar se bucket foi criado
SELECT * FROM storage.buckets WHERE id = 'documents';
