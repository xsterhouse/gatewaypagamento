-- Criar tabelas necessárias para os modais de gerenciamento
-- Execute este script no SQL Editor do Supabase

-- 1. Primeiro, criar tabela users se não existir
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Remover e recriar tabela pix_transactions para garantir relacionamento correto
DROP TABLE IF EXISTS pix_transactions CASCADE;

-- Criar a tabela com relacionamento correto
CREATE TABLE pix_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    pix_key TEXT NOT NULL,
    pix_key_type TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    e2e_id TEXT,
    transaction_id TEXT
);

-- Criar índices
CREATE INDEX idx_users_id ON users(id);
CREATE INDEX idx_pix_transactions_user_id ON pix_transactions(user_id);
CREATE INDEX idx_pix_transactions_status ON pix_transactions(status);
CREATE INDEX idx_pix_transactions_created_at ON pix_transactions(created_at);

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pix_transactions ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para users
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Criar política RLS para pix_transactions
DROP POLICY IF EXISTS "Users can view their own pix transactions" ON pix_transactions;
DROP POLICY IF EXISTS "Users can insert their own pix transactions" ON pix_transactions;
DROP POLICY IF EXISTS "Admins can view all pix transactions" ON pix_transactions;

-- Política para usuários verem suas próprias transações
CREATE POLICY "Users can view their own pix transactions" ON pix_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Política para usuários inserirem suas próprias transações
CREATE POLICY "Users can insert their own pix transactions" ON pix_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para admin ver todas as transações
CREATE POLICY "Admins can view all pix transactions" ON pix_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Criar trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_pix_transactions_updated_at ON pix_transactions;
CREATE TRIGGER update_pix_transactions_updated_at 
    BEFORE UPDATE ON pix_transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para sincronizar users com auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, name, email)
    VALUES (new.id, new.raw_user_meta_data->>'name', new.email)
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        updated_at = NOW();
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verificar se as tabelas foram criadas
SELECT 'users' as table_name, COUNT(*) as column_count 
FROM information_schema.columns 
WHERE table_name = 'users'

UNION ALL

SELECT 'pix_transactions' as table_name, COUNT(*) as column_count 
FROM information_schema.columns 
WHERE table_name = 'pix_transactions';

SELECT 'Tabelas users e pix_transactions criadas/atualizadas com sucesso!' as status;
