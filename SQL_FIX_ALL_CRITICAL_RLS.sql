-- ========================================
-- CORRIGIR TODAS AS TABELAS CRÍTICAS COM RLS DESATIVADO
-- ========================================
-- ⚠️ RISCO CRÍTICO: 13 tabelas têm políticas mas RLS está DESATIVADO!
-- ⚠️ Dados financeiros e pessoais EXPOSTOS!
-- ========================================

-- TABELAS CRÍTICAS IDENTIFICADAS:
-- 1. users - Dados de usuários ❌ CRÍTICO!
-- 2. wallets - Carteiras financeiras ❌ CRÍTICO!
-- 3. transactions - Transações ❌ CRÍTICO!
-- 4. invoices - Faturas ❌ CRÍTICO!
-- 5. support_tickets - Tickets de suporte ❌
-- 6. ticket_responses - Respostas de tickets ❌
-- 7. balance_locks - Bloqueios de saldo ❌
-- 8. manager_clients - Relação manager-cliente ❌
-- 9. supported_currencies - Moedas suportadas
-- 10. system_settings - Configurações do sistema
-- 11. user_sessions - Sessões de usuário ❌

-- ========================================
-- 1. HABILITAR RLS EM TODAS AS TABELAS CRÍTICAS
-- ========================================

-- TABELAS FINANCEIRAS (PRIORIDADE MÁXIMA!)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- TABELAS DE SUPORTE
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_responses ENABLE ROW LEVEL SECURITY;

-- TABELAS DE CONTROLE
ALTER TABLE balance_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- TABELAS DE CONFIGURAÇÃO (podem não precisar de RLS restritivo)
ALTER TABLE supported_currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 2. VERIFICAR SE FOI APLICADO
-- ========================================

SELECT 
  relname as tabela,
  relrowsecurity as rls_ativo,
  CASE 
    WHEN relrowsecurity THEN '✅ PROTEGIDO'
    ELSE '❌ EXPOSTO - CRÍTICO!'
  END as status
FROM pg_class
WHERE relnamespace = 'public'::regnamespace
  AND relname IN (
    'users', 'wallets', 'transactions', 'invoices',
    'support_tickets', 'ticket_responses',
    'balance_locks', 'manager_clients', 'user_sessions',
    'supported_currencies', 'system_settings'
  )
ORDER BY 
  CASE relname
    WHEN 'users' THEN 1
    WHEN 'wallets' THEN 2
    WHEN 'transactions' THEN 3
    WHEN 'invoices' THEN 4
    ELSE 5
  END;

-- ========================================
-- 3. CONTAR POLÍTICAS POR TABELA
-- ========================================

SELECT 
  c.relname as tabela,
  c.relrowsecurity as rls_ativo,
  COUNT(p.polname) as total_politicas,
  CASE 
    WHEN c.relrowsecurity AND COUNT(p.polname) > 0 THEN '✅ OK'
    WHEN NOT c.relrowsecurity AND COUNT(p.polname) > 0 THEN '❌ CRÍTICO'
    WHEN c.relrowsecurity AND COUNT(p.polname) = 0 THEN '⚠️ SEM POLÍTICAS'
    ELSE '⚠️ SEM PROTEÇÃO'
  END as status
FROM pg_class c
LEFT JOIN pg_policy p ON p.polrelid = c.oid
WHERE c.relnamespace = 'public'::regnamespace
  AND c.relname IN (
    'users', 'wallets', 'transactions', 'invoices',
    'support_tickets', 'ticket_responses',
    'balance_locks', 'manager_clients', 'user_sessions',
    'supported_currencies', 'system_settings'
  )
GROUP BY c.relname, c.relrowsecurity
ORDER BY 
  CASE 
    WHEN NOT c.relrowsecurity AND COUNT(p.polname) > 0 THEN 1
    WHEN c.relrowsecurity AND COUNT(p.polname) = 0 THEN 2
    ELSE 3
  END,
  c.relname;

-- ========================================
-- 4. LISTAR TODAS AS POLÍTICAS EXISTENTES
-- ========================================

SELECT 
  c.relname as tabela,
  p.polname as politica,
  p.polcmd as operacao,
  CASE p.polcmd
    WHEN 'r' THEN '👁️ SELECT'
    WHEN 'a' THEN '➕ INSERT'
    WHEN 'w' THEN '✏️ UPDATE'
    WHEN 'd' THEN '🗑️ DELETE'
    WHEN '*' THEN '🔓 ALL'
  END as acao
FROM pg_class c
JOIN pg_policy p ON p.polrelid = c.oid
WHERE c.relnamespace = 'public'::regnamespace
  AND c.relname IN (
    'users', 'wallets', 'transactions', 'invoices',
    'support_tickets', 'ticket_responses'
  )
ORDER BY c.relname, p.polcmd, p.polname;

-- ========================================
-- RESULTADO ESPERADO:
-- ========================================
-- ✅ Todas as 11 tabelas com RLS ATIVO
-- ✅ Políticas existentes agora estão FUNCIONANDO
-- ✅ Dados protegidos
-- ========================================

-- ========================================
-- IMPACTO DA CORREÇÃO:
-- ========================================
-- ANTES:
--   ❌ users - TODOS os dados de TODOS os usuários expostos
--   ❌ wallets - TODOS os saldos visíveis
--   ❌ transactions - TODAS as transações visíveis
--   ❌ invoices - TODAS as faturas visíveis
--
-- DEPOIS:
--   ✅ users - Cada usuário vê apenas seus dados
--   ✅ wallets - Cada usuário vê apenas suas carteiras
--   ✅ transactions - Cada usuário vê apenas suas transações
--   ✅ invoices - Cada usuário vê apenas suas faturas
-- ========================================

-- ========================================
-- PRÓXIMOS PASSOS:
-- ========================================
-- 1. Execute este script IMEDIATAMENTE
-- 2. Teste o sistema como cliente
-- 3. Teste o sistema como admin
-- 4. Verifique se não há erros de permissão
-- 5. Se houver erros, ajuste as políticas (não desabilite RLS!)
-- ========================================

-- ========================================
-- TABELAS QUE PODEM NÃO PRECISAR DE RLS RESTRITIVO:
-- ========================================
-- supported_currencies - Dados públicos de moedas
-- system_settings - Configurações do sistema (apenas admins)
-- 
-- Para essas, podemos criar políticas mais permissivas depois
-- Mas é melhor ter RLS ativo com política permissiva
-- do que RLS desativado!
-- ========================================
