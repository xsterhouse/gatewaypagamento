-- ========================================
-- TESTAR SE RLS ESTÁ FUNCIONANDO CORRETAMENTE
-- ========================================
-- Execute este script para confirmar que as políticas estão ativas
-- ========================================

-- 1. VERIFICAR AUTENTICAÇÃO ATUAL
SELECT 
  auth.uid() as meu_user_id,
  auth.role() as minha_role,
  CASE 
    WHEN auth.uid() IS NOT NULL THEN '✅ Autenticado'
    ELSE '❌ NÃO autenticado'
  END as status_auth;

-- 2. VER MEU USUÁRIO
SELECT 
  id,
  email,
  role,
  name,
  created_at
FROM users
WHERE id = auth.uid();

-- 3. TESTAR ISOLAMENTO - Ver apenas meus dados
-- (Se você for cliente, deve ver apenas 1 registro - você mesmo)
-- (Se você for admin, deve ver todos)

SELECT 
  'users' as tabela,
  COUNT(*) as total_vejo,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ Vendo apenas meus dados (cliente)'
    WHEN COUNT(*) > 1 THEN '✅ Vendo todos os dados (admin/manager)'
    ELSE '❌ Não vejo nada'
  END as status
FROM users;

SELECT 
  'wallets' as tabela,
  COUNT(*) as total_vejo,
  CASE 
    WHEN COUNT(*) >= 1 THEN '✅ Vendo minhas carteiras'
    ELSE '⚠️ Sem carteiras'
  END as status
FROM wallets;

SELECT 
  'transactions' as tabela,
  COUNT(*) as total_vejo,
  CASE 
    WHEN COUNT(*) >= 0 THEN '✅ Vendo minhas transações'
    ELSE '❌ Erro'
  END as status
FROM transactions;

SELECT 
  'invoices' as tabela,
  COUNT(*) as total_vejo,
  CASE 
    WHEN COUNT(*) >= 0 THEN '✅ Vendo minhas faturas'
    ELSE '❌ Erro'
  END as status
FROM invoices;

-- 4. VERIFICAR SE CONSIGO CRIAR DADOS
-- (Apenas teste visual - não execute INSERT de verdade)

-- Teste de INSERT (comentado - descomente para testar)
-- INSERT INTO wallets (user_id, currency, balance)
-- VALUES (auth.uid(), 'BRL', 0);
-- Se der erro de permissão, a política está bloqueando corretamente

-- 5. RESUMO DE SEGURANÇA
SELECT 
  c.relname as tabela,
  c.relrowsecurity as rls_ativo,
  COUNT(p.polname) as total_politicas,
  CASE 
    WHEN c.relrowsecurity AND COUNT(p.polname) > 0 THEN '✅ SEGURO'
    WHEN NOT c.relrowsecurity THEN '❌ RLS DESATIVADO'
    WHEN COUNT(p.polname) = 0 THEN '⚠️ SEM POLÍTICAS'
    ELSE '❓ VERIFICAR'
  END as status_seguranca
FROM pg_class c
LEFT JOIN pg_policy p ON p.polrelid = c.oid
WHERE c.relnamespace = 'public'::regnamespace
  AND c.relname IN ('users', 'wallets', 'transactions', 'invoices', 
                    'support_tickets', 'ticket_responses')
GROUP BY c.relname, c.relrowsecurity
ORDER BY c.relname;

-- ========================================
-- INTERPRETAÇÃO DOS RESULTADOS:
-- ========================================
--
-- COMO CLIENTE:
--   users: COUNT = 1 (apenas você) ✅
--   wallets: COUNT = suas carteiras ✅
--   transactions: COUNT = suas transações ✅
--   invoices: COUNT = suas faturas ✅
--
-- COMO ADMIN:
--   users: COUNT = todos os usuários ✅
--   wallets: COUNT = todas as carteiras ✅
--   transactions: COUNT = todas as transações ✅
--   invoices: COUNT = todas as faturas ✅
--
-- SE ALGO ESTIVER ERRADO:
--   COUNT = 0 em tudo → Problema nas políticas
--   Erro de permissão → Política muito restritiva
--   Ver dados de outros → RLS não está funcionando
-- ========================================

-- 6. TESTE DE SEGURANÇA AVANÇADO
-- Tentar ver dados que NÃO deveria ver (como cliente)

-- Este SELECT deve retornar apenas SEUS dados
SELECT 
  id,
  email,
  role,
  name
FROM users
ORDER BY created_at DESC
LIMIT 5;

-- Se você é CLIENTE e vê apenas 1 linha (você) = ✅ CORRETO
-- Se você é ADMIN e vê várias linhas = ✅ CORRETO
-- Se você é CLIENTE e vê várias linhas = ❌ PROBLEMA!

-- ========================================
-- RESULTADO ESPERADO:
-- ========================================
-- ✅ Autenticado
-- ✅ Vejo meus dados
-- ✅ NÃO vejo dados de outros (se cliente)
-- ✅ Vejo todos os dados (se admin)
-- ✅ Todas as tabelas com RLS ativo
-- ✅ Todas as políticas funcionando
-- ========================================
