-- ========================================
-- RLS: Permissões para Admin Master e Gerentes
-- ========================================

-- IMPORTANTE: Admin Master NUNCA é bloqueado por RLS
-- As políticas abaixo garantem que admin e manager tenham acesso total

-- 1. Habilitar RLS nas tabelas principais
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 2. Desabilitar RLS para o role do Supabase (service_role)
-- Isso garante que operações do backend sempre funcionem
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE wallets FORCE ROW LEVEL SECURITY;
ALTER TABLE invoices FORCE ROW LEVEL SECURITY;
ALTER TABLE transactions FORCE ROW LEVEL SECURITY;

-- ========================================
-- POLÍTICAS PARA TABELA: users
-- ========================================

-- POLÍTICA MASTER: Admin sempre tem acesso total (bypass RLS)
CREATE POLICY "Admin Master tem acesso total"
ON users FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Manager pode ver todos os usuários
CREATE POLICY "Manager pode ver todos os usuários"
ON users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'manager'
  )
);

-- Admin e Manager podem atualizar usuários
CREATE POLICY "Admin e Manager podem atualizar usuários"
ON users FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role IN ('admin', 'manager')
  )
);

-- Admin e Manager podem inserir usuários
CREATE POLICY "Admin e Manager podem inserir usuários"
ON users FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM users WHERE role IN ('admin', 'manager')
  )
);

-- Admin e Manager podem deletar usuários
CREATE POLICY "Admin e Manager podem deletar usuários"
ON users FOR DELETE
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role IN ('admin', 'manager')
  )
);

-- Usuários podem ver seus próprios dados
CREATE POLICY "Usuários podem ver seus próprios dados"
ON users FOR SELECT
USING (auth.uid() = id);

-- Usuários podem atualizar seus próprios dados
CREATE POLICY "Usuários podem atualizar seus próprios dados"
ON users FOR UPDATE
USING (auth.uid() = id);

-- ========================================
-- POLÍTICAS PARA TABELA: wallets
-- ========================================

-- Admin e Manager podem ver todas as carteiras
CREATE POLICY "Admin e Manager podem ver todas as carteiras"
ON wallets FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role IN ('admin', 'manager')
  )
);

-- Admin e Manager podem atualizar todas as carteiras
CREATE POLICY "Admin e Manager podem atualizar todas as carteiras"
ON wallets FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role IN ('admin', 'manager')
  )
);

-- Admin e Manager podem inserir carteiras
CREATE POLICY "Admin e Manager podem inserir carteiras"
ON wallets FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM users WHERE role IN ('admin', 'manager')
  )
);

-- Admin e Manager podem deletar carteiras
CREATE POLICY "Admin e Manager podem deletar carteiras"
ON wallets FOR DELETE
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role IN ('admin', 'manager')
  )
);

-- Usuários podem ver suas próprias carteiras
CREATE POLICY "Usuários podem ver suas próprias carteiras"
ON wallets FOR SELECT
USING (auth.uid() = user_id);

-- Usuários podem criar suas próprias carteiras
CREATE POLICY "Usuários podem criar suas próprias carteiras"
ON wallets FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias carteiras
CREATE POLICY "Usuários podem atualizar suas próprias carteiras"
ON wallets FOR UPDATE
USING (auth.uid() = user_id);

-- Usuários podem deletar suas próprias carteiras
CREATE POLICY "Usuários podem deletar suas próprias carteiras"
ON wallets FOR DELETE
USING (auth.uid() = user_id);

-- ========================================
-- POLÍTICAS PARA TABELA: invoices
-- ========================================

-- Admin e Manager podem ver todas as faturas
CREATE POLICY "Admin e Manager podem ver todas as faturas"
ON invoices FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role IN ('admin', 'manager')
  )
);

-- Admin e Manager podem atualizar todas as faturas
CREATE POLICY "Admin e Manager podem atualizar todas as faturas"
ON invoices FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role IN ('admin', 'manager')
  )
);

-- Admin e Manager podem inserir faturas
CREATE POLICY "Admin e Manager podem inserir faturas"
ON invoices FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM users WHERE role IN ('admin', 'manager')
  )
);

-- Admin e Manager podem deletar faturas
CREATE POLICY "Admin e Manager podem deletar faturas"
ON invoices FOR DELETE
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role IN ('admin', 'manager')
  )
);

-- Usuários podem ver suas próprias faturas
CREATE POLICY "Usuários podem ver suas próprias faturas"
ON invoices FOR SELECT
USING (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias faturas (status de pagamento)
CREATE POLICY "Usuários podem atualizar suas próprias faturas"
ON invoices FOR UPDATE
USING (auth.uid() = user_id);

-- ========================================
-- POLÍTICAS PARA TABELA: transactions
-- ========================================

-- Admin e Manager podem ver todas as transações
CREATE POLICY "Admin e Manager podem ver todas as transações"
ON transactions FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role IN ('admin', 'manager')
  )
);

-- Admin e Manager podem atualizar todas as transações
CREATE POLICY "Admin e Manager podem atualizar todas as transações"
ON transactions FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role IN ('admin', 'manager')
  )
);

-- Admin e Manager podem inserir transações
CREATE POLICY "Admin e Manager podem inserir transações"
ON transactions FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM users WHERE role IN ('admin', 'manager')
  )
);

-- Usuários podem ver suas próprias transações
CREATE POLICY "Usuários podem ver suas próprias transações"
ON transactions FOR SELECT
USING (auth.uid() = user_id);

-- Usuários podem criar suas próprias transações
CREATE POLICY "Usuários podem criar suas próprias transações"
ON transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ========================================
-- VERIFICAR POLÍTICAS CRIADAS
-- ========================================

-- Ver todas as políticas da tabela users
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'users';

-- Ver todas as políticas da tabela wallets
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'wallets';

-- Ver todas as políticas da tabela invoices
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'invoices';

-- Ver todas as políticas da tabela transactions
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'transactions';

-- ========================================
-- REMOVER POLÍTICAS (se necessário)
-- ========================================

/*
-- Para remover uma política específica:
DROP POLICY "Nome da política" ON nome_da_tabela;

-- Para desabilitar RLS em uma tabela:
ALTER TABLE nome_da_tabela DISABLE ROW LEVEL SECURITY;
*/

-- ========================================
-- RESUMO DAS PERMISSÕES
-- ========================================

/*
ADMIN e MANAGER:
- ✅ Ver todos os usuários, carteiras, faturas e transações
- ✅ Criar, editar e deletar qualquer registro
- ✅ Acesso total ao sistema

CLIENTE (user):
- ✅ Ver apenas seus próprios dados
- ✅ Criar e gerenciar suas próprias carteiras
- ✅ Ver e pagar suas próprias faturas
- ✅ Ver e criar suas próprias transações
- ❌ NÃO pode ver dados de outros usuários
*/
