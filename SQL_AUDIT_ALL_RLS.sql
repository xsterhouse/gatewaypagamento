-- ========================================
-- AUDITORIA COMPLETA DE RLS EM TODAS AS TABELAS
-- ========================================
-- Verifica quais tabelas têm problemas de segurança RLS
-- ========================================

-- 1. TABELAS COM POLÍTICAS MAS SEM RLS ATIVO (CRÍTICO!)
SELECT 
  c.relname as tabela,
  c.relrowsecurity as rls_ativo,
  COUNT(p.polname) as total_politicas,
  '❌ RISCO CRÍTICO: Políticas existem mas RLS está DESATIVADO!' as problema
FROM pg_class c
LEFT JOIN pg_policy p ON p.polrelid = c.oid
WHERE c.relnamespace = 'public'::regnamespace
  AND c.relkind = 'r'  -- apenas tabelas
  AND c.relrowsecurity = false  -- RLS desativado
  AND EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polrelid = c.oid
  )
GROUP BY c.relname, c.relrowsecurity
ORDER BY COUNT(p.polname) DESC;

-- 2. TABELAS COM RLS ATIVO MAS SEM POLÍTICAS (PROBLEMA!)
SELECT 
  c.relname as tabela,
  c.relrowsecurity as rls_ativo,
  COUNT(p.polname) as total_politicas,
  '⚠️ RLS ativo mas SEM políticas = NINGUÉM acessa!' as problema
FROM pg_class c
LEFT JOIN pg_policy p ON p.polrelid = c.oid
WHERE c.relnamespace = 'public'::regnamespace
  AND c.relkind = 'r'
  AND c.relrowsecurity = true  -- RLS ativo
GROUP BY c.relname, c.relrowsecurity
HAVING COUNT(p.polname) = 0
ORDER BY c.relname;

-- 3. TABELAS SEM RLS E SEM POLÍTICAS (ATENÇÃO!)
SELECT 
  c.relname as tabela,
  c.relrowsecurity as rls_ativo,
  '⚠️ Sem RLS e sem políticas = Acesso total!' as problema
FROM pg_class c
WHERE c.relnamespace = 'public'::regnamespace
  AND c.relkind = 'r'
  AND c.relrowsecurity = false
  AND NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polrelid = c.oid
  )
ORDER BY c.relname;

-- 4. TABELAS COM RLS ATIVO E POLÍTICAS (CORRETO!)
SELECT 
  c.relname as tabela,
  c.relrowsecurity as rls_ativo,
  COUNT(p.polname) as total_politicas,
  '✅ Configuração correta!' as status
FROM pg_class c
LEFT JOIN pg_policy p ON p.polrelid = c.oid
WHERE c.relnamespace = 'public'::regnamespace
  AND c.relkind = 'r'
  AND c.relrowsecurity = true  -- RLS ativo
GROUP BY c.relname, c.relrowsecurity
HAVING COUNT(p.polname) > 0
ORDER BY c.relname;

-- 5. RESUMO GERAL DE SEGURANÇA
SELECT 
  COUNT(*) FILTER (WHERE relrowsecurity = true AND tem_politicas = true) as tabelas_seguras,
  COUNT(*) FILTER (WHERE relrowsecurity = false AND tem_politicas = true) as rls_desativado_com_politicas_CRITICO,
  COUNT(*) FILTER (WHERE relrowsecurity = true AND tem_politicas = false) as rls_ativo_sem_politicas_PROBLEMA,
  COUNT(*) FILTER (WHERE relrowsecurity = false AND tem_politicas = false) as sem_rls_sem_politicas_ATENCAO,
  COUNT(*) as total_tabelas
FROM (
  SELECT 
    c.relname,
    c.relrowsecurity,
    EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = c.oid) as tem_politicas
  FROM pg_class c
  WHERE c.relnamespace = 'public'::regnamespace
    AND c.relkind = 'r'
) sub;

-- 6. DETALHES DE TODAS AS POLÍTICAS POR TABELA
SELECT 
  c.relname as tabela,
  c.relrowsecurity as rls_ativo,
  p.polname as politica,
  p.polcmd as operacao,
  p.polroles::regrole[] as roles,
  CASE 
    WHEN c.relrowsecurity THEN '✅'
    ELSE '❌'
  END as status_rls
FROM pg_class c
LEFT JOIN pg_policy p ON p.polrelid = c.oid
WHERE c.relnamespace = 'public'::regnamespace
  AND c.relkind = 'r'
ORDER BY c.relname, p.polcmd, p.polname;

-- ========================================
-- INTERPRETAÇÃO DOS RESULTADOS:
-- ========================================
-- 
-- CRÍTICO (❌):
--   Tabelas com políticas mas RLS desativado
--   → Políticas são IGNORADAS
--   → Dados EXPOSTOS
--   → Corrigir IMEDIATAMENTE!
--
-- PROBLEMA (⚠️):
--   Tabelas com RLS ativo mas sem políticas
--   → NINGUÉM consegue acessar
--   → Aplicação vai dar erro
--   → Adicionar políticas
--
-- ATENÇÃO (⚠️):
--   Tabelas sem RLS e sem políticas
--   → Acesso total para todos
--   → Avaliar se precisa de RLS
--   → Tabelas públicas podem não precisar
--
-- CORRETO (✅):
--   Tabelas com RLS ativo E políticas
--   → Configuração correta
--   → Dados protegidos
-- ========================================

-- ========================================
-- TABELAS QUE GERALMENTE PRECISAM DE RLS:
-- ========================================
-- ✅ users - Dados de usuários
-- ✅ wallets - Carteiras financeiras
-- ✅ transactions - Transações
-- ✅ deposits - Depósitos
-- ✅ withdrawals - Saques
-- ✅ med_requests - Solicitações MED
-- ✅ activity_logs - Logs de atividade
-- ✅ kyc_documents - Documentos KYC
-- ✅ payment_links - Links de pagamento
-- ✅ tickets - Tickets de suporte
--
-- TABELAS QUE PODEM NÃO PRECISAR:
-- ❓ currencies - Moedas (dados públicos)
-- ❓ exchange_rates - Taxas de câmbio (dados públicos)
-- ❓ system_settings - Configurações do sistema
-- ========================================
