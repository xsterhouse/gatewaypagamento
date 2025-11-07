-- DESATIVAR RLS TEMPORARIAMENTE (SÓ PARA TESTE!)
-- CUIDADO: Isso permite que qualquer usuário autenticado
-- acesse todos os documentos do bucket

-- Desativar RLS (só se você for owner)
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Para reativar depois (quando owner configurar políticas):
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Verificar status do RLS
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  forcerlspolicy
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';
