-- Criar tabela pix_transactions se não existir
-- Execute este script no SQL Editor do Supabase

-- Criar a tabela
CREATE TABLE IF NOT EXISTS pix_transactions (
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
CREATE INDEX IF NOT EXISTS idx_pix_transactions_user_id ON pix_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_status ON pix_transactions(status);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_created_at ON pix_transactions(created_at);

-- Habilitar RLS
ALTER TABLE pix_transactions ENABLE ROW LEVEL SECURITY;

-- Criar política RLS
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

-- Verificar se a tabela foi criada
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'pix_transactions' 
ORDER BY ordinal_position;

SELECT 'Tabela pix_transactions criada/atualizada com sucesso!' as status;
