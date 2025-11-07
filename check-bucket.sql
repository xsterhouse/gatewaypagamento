-- Verificar se o bucket já existe
SELECT * FROM storage.buckets WHERE id = 'documents';

-- Verificar todos os buckets
SELECT id, name, public, file_size_limit FROM storage.buckets;
