-- ========================================
-- DIAGNÓSTICO COMPLETO DO PROBLEMA MED
-- ========================================

-- 1. Verificar se a tabela existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'med_requests'
) as tabela_existe;

-- 2. Verificar se RLS está ativo
SELECT 
  tablename,
  rowsecurity as rls_ativo
FROM pg_tables
WHERE tablename = 'med_requests';

-- 3. Ver TODAS as políticas ativas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operacao,
  qual as condicao_using,
  with_check as condicao_with_check
FROM pg_policies
WHERE tablename = 'med_requests'
ORDER BY cmd, policyname;

-- 4. Testar autenticação
SELECT 
  auth.uid() as meu_user_id,
  auth.role() as minha_role_auth,
  CASE 
    WHEN auth.uid() IS NULL THEN '❌ NÃO AUTENTICADO!'
    ELSE '✅ Autenticado'
  END as status_auth;

-- 5. Verificar meu usuário na tabela users
SELECT 
  id,
  email,
  role,
  name,
  created_at
FROM users
WHERE id = auth.uid();

-- 6. Testar se consigo VER a tabela med_requests
SELECT 
  COUNT(*) as total_registros,
  COUNT(CASE WHEN user_id = auth.uid() THEN 1 END) as meus_registros
FROM med_requests;

-- 7. Simular INSERT (sem executar)
-- Copie seu user_id do resultado acima e teste:
-- EXPLAIN INSERT INTO med_requests (user_id, amount, reason, pix_key, pix_key_type)
-- VALUES ('SEU_USER_ID_AQUI', 100.00, 'Teste', '12345678900', 'cpf');

-- 8. Verificar foreign keys
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'med_requests'
  AND tc.constraint_type = 'FOREIGN KEY';

-- ========================================
-- INTERPRETAÇÃO DOS RESULTADOS:
-- ========================================
-- 
-- Se auth.uid() retornar NULL:
--   → Problema de autenticação do Supabase
--   → Solução: Logout e login novamente
--
-- Se não aparecer usuário na tabela users:
--   → Usuário não existe no banco
--   → Solução: Verificar cadastro
--
-- Se total_registros der erro:
--   → Políticas SELECT estão bloqueando
--   → Solução: Verificar políticas
--
-- Se tudo acima estiver OK mas INSERT falha:
--   → Problema na política INSERT
--   → Continue para o próximo script
-- ========================================
