-- Adicionar coluna email à tabela customers se não existir
-- Execute este script no SQL Editor do Supabase

-- Verificar se a coluna já existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='customers' 
        AND column_name='email'
    ) THEN
        ALTER TABLE customers ADD COLUMN email TEXT;
        RAISE NOTICE 'Coluna email adicionada à tabela customers';
    ELSE
        RAISE NOTICE 'Coluna email já existe na tabela customers';
    END IF;
END $$;

-- Criar índice para performance se não existir
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Verificar estrutura final
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'customers' 
ORDER BY ordinal_position;

SELECT 'Estrutura da tabela customers atualizada!' as status;
