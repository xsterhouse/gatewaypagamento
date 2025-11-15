-- Adicionar colunas para dados de pagamento EFI na tabela invoices
-- Execute este script no SQL Editor do Supabase

-- Adicionar colunas se não existirem
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS loc_id TEXT,
ADD COLUMN IF NOT EXISTS transaction_id TEXT,
ADD COLUMN IF NOT EXISTS linha_digitavel TEXT;

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'invoices' 
AND column_name IN ('loc_id', 'transaction_id', 'linha_digitavel')
ORDER BY column_name;

SELECT 'Colunas de pagamento adicionadas com sucesso!' as status;
