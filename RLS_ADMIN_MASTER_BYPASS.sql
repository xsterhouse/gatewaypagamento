-- ========================================
-- RLS: Admin Master com Acesso Total (Bypass)
-- ========================================

-- IMPORTANTE: Este script garante que o Admin Master NUNCA seja bloqueado por RLS
-- O Admin Master tem acesso total a TODAS as tabelas e operações

-- ========================================
-- 1. REMOVER POLÍTICAS ANTIGAS (se existirem)
-- ========================================

-- Remover políticas da tabela users
DROP POLICY IF EXISTS "Admin e Manager podem ver todos os usuários" ON users;
DROP POLICY IF EXISTS "Admin e Manager podem atualizar usuários" ON users;
DROP POLICY IF EXISTS "Admin e Manager podem inserir usuários" ON users;
DROP POLICY IF EXISTS "Admin e Manager podem deletar usuários" ON users;
DROP POLICY IF EXISTS "Admin Master tem acesso total" ON users;
DROP POLICY IF EXISTS "Manager pode ver todos os usuários" ON users;

-- Remover políticas da tabela wallets
DROP POLICY IF EXISTS "Admin e Manager podem ver todas as carteiras" ON wallets;
DROP POLICY IF EXISTS "Admin e Manager podem atualizar todas as carteiras" ON wallets;
DROP POLICY IF EXISTS "Admin e Manager podem inserir carteiras" ON wallets;
DROP POLICY IF EXISTS "Admin e Manager podem deletar carteiras" ON wallets;
DROP POLICY IF EXISTS "Admin Master tem acesso total a carteiras" ON wallets;

-- Remover políticas da tabela invoices
DROP POLICY IF EXISTS "Admin e Manager podem ver todas as faturas" ON invoices;
DROP POLICY IF EXISTS "Admin e Manager podem atualizar todas as faturas" ON invoices;
DROP POLICY IF EXISTS "Admin e Manager podem inserir faturas" ON invoices;
DROP POLICY IF EXISTS "Admin e Manager podem deletar faturas" ON invoices;
DROP POLICY IF EXISTS "Admin Master tem acesso total a faturas" ON invoices;

-- Remover políticas da tabela transactions
DROP POLICY IF EXISTS "Admin e Manager podem ver todas as transações" ON transactions;
DROP POLICY IF EXISTS "Admin e Manager podem atualizar todas as transações" ON transactions;
DROP POLICY IF EXISTS "Admin e Manager podem inserir transações" ON transactions;
DROP POLICY IF EXISTS "Admin Master tem acesso total a transações" ON transactions;

-- ========================================
-- 2. HABILITAR RLS
-- ========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 3. POLÍTICAS MASTER PARA ADMIN
-- ========================================

-- TABELA: users
-- Admin Master tem acesso TOTAL (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Admin Master - Acesso Total a Users"
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

-- TABELA: wallets
-- Admin Master tem acesso TOTAL
CREATE POLICY "Admin Master - Acesso Total a Wallets"
ON wallets FOR ALL
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

-- TABELA: invoices
-- Admin Master tem acesso TOTAL
CREATE POLICY "Admin Master - Acesso Total a Invoices"
ON invoices FOR ALL
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

-- TABELA: transactions
-- Admin Master tem acesso TOTAL
CREATE POLICY "Admin Master - Acesso Total a Transactions"
ON transactions FOR ALL
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

-- ========================================
-- 4. POLÍTICAS PARA MANAGER
-- ========================================

-- TABELA: users
CREATE POLICY "Manager - Ver Todos Users"
ON users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'manager'
  )
);

CREATE POLICY "Manager - Atualizar Users"
ON users FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'manager'
  )
);

CREATE POLICY "Manager - Inserir Users"
ON users FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'manager'
  )
);

-- TABELA: wallets
CREATE POLICY "Manager - Ver Todas Wallets"
ON wallets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'manager'
  )
);

CREATE POLICY "Manager - Atualizar Wallets"
ON wallets FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'manager'
  )
);

CREATE POLICY "Manager - Inserir Wallets"
ON wallets FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'manager'
  )
);

CREATE POLICY "Manager - Deletar Wallets"
ON wallets FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'manager'
  )
);

-- TABELA: invoices
CREATE POLICY "Manager - Ver Todas Invoices"
ON invoices FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'manager'
  )
);

CREATE POLICY "Manager - Atualizar Invoices"
ON invoices FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'manager'
  )
);

CREATE POLICY "Manager - Inserir Invoices"
ON invoices FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'manager'
  )
);

CREATE POLICY "Manager - Deletar Invoices"
ON invoices FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'manager'
  )
);

-- TABELA: transactions
CREATE POLICY "Manager - Ver Todas Transactions"
ON transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'manager'
  )
);

CREATE POLICY "Manager - Inserir Transactions"
ON transactions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'manager'
  )
);

-- ========================================
-- 5. POLÍTICAS PARA CLIENTES
-- ========================================

-- TABELA: users
CREATE POLICY "Cliente - Ver Próprios Dados"
ON users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Cliente - Atualizar Próprios Dados"
ON users FOR UPDATE
USING (auth.uid() = id);

-- TABELA: wallets
CREATE POLICY "Cliente - Ver Próprias Wallets"
ON wallets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Cliente - Criar Próprias Wallets"
ON wallets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Cliente - Atualizar Próprias Wallets"
ON wallets FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Cliente - Deletar Próprias Wallets"
ON wallets FOR DELETE
USING (auth.uid() = user_id);

-- TABELA: invoices
CREATE POLICY "Cliente - Ver Próprias Invoices"
ON invoices FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Cliente - Atualizar Próprias Invoices"
ON invoices FOR UPDATE
USING (auth.uid() = user_id);

-- TABELA: transactions
CREATE POLICY "Cliente - Ver Próprias Transactions"
ON transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Cliente - Criar Próprias Transactions"
ON transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ========================================
-- 6. VERIFICAR POLÍTICAS
-- ========================================

SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd,
  CASE 
    WHEN policyname LIKE '%Admin Master%' THEN '🔴 ADMIN MASTER'
    WHEN policyname LIKE '%Manager%' THEN '🟡 MANAGER'
    WHEN policyname LIKE '%Cliente%' THEN '🟢 CLIENTE'
    ELSE '⚪ OUTRO'
  END as tipo
FROM pg_policies
WHERE tablename IN ('users', 'wallets', 'invoices', 'transactions')
ORDER BY tablename, tipo, policyname;

-- ========================================
-- RESUMO
-- ========================================

/*
🔴 ADMIN MASTER:
- ✅ Acesso TOTAL a TODAS as tabelas
- ✅ SELECT, INSERT, UPDATE, DELETE sem restrições
- ✅ NUNCA é bloqueado por RLS
- ✅ Política FOR ALL garante bypass completo

🟡 MANAGER:
- ✅ Ver todos os dados
- ✅ Criar e editar a maioria dos registros
- ✅ Deletar carteiras e faturas
- ❌ NÃO pode deletar usuários

🟢 CLIENTE:
- ✅ Ver apenas seus próprios dados
- ✅ Gerenciar suas carteiras
- ✅ Ver e pagar suas faturas
- ✅ Ver suas transações
*/
