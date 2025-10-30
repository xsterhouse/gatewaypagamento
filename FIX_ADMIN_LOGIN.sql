-- ========================================
-- FIX: Admin Master não consegue fazer login
-- ========================================

-- PROBLEMA: RLS está bloqueando o admin de acessar seus próprios dados
-- SOLUÇÃO: Desabilitar RLS temporariamente ou criar política que funcione

-- ========================================
-- OPÇÃO 1: DESABILITAR RLS (TEMPORÁRIO)
-- ========================================

-- Desabilitar RLS em todas as tabelas
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- ========================================
-- OPÇÃO 2: MANTER RLS MAS COM POLÍTICA SIMPLES
-- ========================================

/*
-- Remover todas as políticas antigas
DROP POLICY IF EXISTS "Admin Master - Acesso Total a Users" ON users;
DROP POLICY IF EXISTS "Manager - Ver Todos Users" ON users;
DROP POLICY IF EXISTS "Manager - Atualizar Users" ON users;
DROP POLICY IF EXISTS "Manager - Inserir Users" ON users;
DROP POLICY IF EXISTS "Cliente - Ver Próprios Dados" ON users;
DROP POLICY IF EXISTS "Cliente - Atualizar Próprios Dados" ON users;

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política SUPER SIMPLES que sempre funciona
CREATE POLICY "Todos podem acessar users"
ON users FOR ALL
USING (true)
WITH CHECK (true);
*/

-- ========================================
-- VERIFICAR STATUS DO RLS
-- ========================================

SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename IN ('users', 'wallets', 'invoices', 'transactions')
  AND schemaname = 'public';

-- ========================================
-- VERIFICAR POLÍTICAS ATIVAS
-- ========================================

SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd
FROM pg_policies
WHERE tablename IN ('users', 'wallets', 'invoices', 'transactions')
ORDER BY tablename, policyname;

-- ========================================
-- INSTRUÇÕES
-- ========================================

/*
1. Execute a OPÇÃO 1 (desabilitar RLS) primeiro
2. Tente fazer login novamente
3. Se funcionar, você pode:
   - Deixar RLS desabilitado (menos seguro mas funciona)
   - OU configurar RLS corretamente depois

IMPORTANTE:
- Com RLS desabilitado, TODOS os usuários autenticados podem ver todos os dados
- Isso é OK para desenvolvimento/teste
- Para produção, você deve configurar RLS corretamente
*/
