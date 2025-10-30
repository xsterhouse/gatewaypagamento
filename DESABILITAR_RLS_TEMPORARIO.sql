-- ================================================
-- SOLUÇÃO IMEDIATA: Desabilitar RLS para permitir login
-- ================================================
-- Este SQL permite que você faça login AGORA
-- Depois ajustamos as políticas corretamente
-- ================================================

-- PASSO 1: DESABILITAR RLS COMPLETAMENTE
-- ================================================
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- ================================================
-- PASSO 2: VERIFICAR SE USUÁRIOS EXISTEM
-- ================================================

SELECT 
  'Usuários na tabela:' as info,
  COUNT(*) as total
FROM public.users;

SELECT 
  email,
  name,
  role,
  status,
  'Pode logar agora!' as status_login
FROM public.users
ORDER BY role DESC, email;

-- ================================================
-- PRONTO! AGORA TENTE FAZER LOGIN
-- ================================================
-- ✅ RLS está desabilitado
-- ✅ Todos podem ler seus dados
-- ✅ Login deve funcionar
-- 
-- Após confirmar que funciona, execute:
-- FIX_RLS_POLICIES.sql (próximo arquivo)
-- ================================================

-- Verificação final
SELECT 
  tablename,
  rowsecurity as rls_habilitado,
  CASE 
    WHEN rowsecurity THEN '❌ RLS ainda ativo - Execute novamente'
    ELSE '✅ RLS desabilitado - Pode fazer login'
  END as status
FROM pg_tables
WHERE tablename = 'users' AND schemaname = 'public';
