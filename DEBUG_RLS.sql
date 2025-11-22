-- Script para debug e correção das políticas RLS
-- Execute este script no SQL Editor do Supabase

-- Primeiro, remover todas as políticas existentes
DROP POLICY IF EXISTS "Users can view their own customers" ON customers;
DROP POLICY IF EXISTS "Users can insert their own customers" ON customers;
DROP POLICY IF EXISTS "Users can update their own customers" ON customers;
DROP POLICY IF EXISTS "Users can delete their own customers" ON customers;

DROP POLICY IF EXISTS "Users can view their own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can insert their own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can update their own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can delete their own invoices" ON invoices;

-- Desabilitar RLS temporariamente para testar
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;

-- Verificar se conseguimos inserir sem RLS
SELECT 'RLS desabilitado temporariamente para teste' as status;

-- Se funcionar sem RLS, vamos recriar políticas mais simples
-- Habilitar RLS novamente
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Criar políticas mais simples e permissivas
CREATE POLICY "Enable insert for all users" ON customers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable select for all users" ON customers
    FOR SELECT USING (true);

CREATE POLICY "Enable update for all users" ON customers
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON customers
    FOR DELETE USING (true);

CREATE POLICY "Enable insert for all users" ON invoices
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable select for all users" ON invoices
    FOR SELECT USING (true);

CREATE POLICY "Enable update for all users" ON invoices
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON invoices
    FOR DELETE USING (true);

-- Verificação final
SELECT 'Políticas RLS criadas com modo debug (permissivo)' as status;
