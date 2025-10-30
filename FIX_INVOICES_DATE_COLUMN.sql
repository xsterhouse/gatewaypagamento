-- ========================================
-- FIX: Corrige coluna due_date para tipo DATE
-- ========================================

-- Verificar o tipo atual da coluna
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'invoices' 
  AND column_name = 'due_date';

-- Se a coluna for TIMESTAMP, converter para DATE
-- Isso remove o horário e evita problemas de timezone

-- Passo 1: Adicionar nova coluna temporária do tipo DATE
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS due_date_temp DATE;

-- Passo 2: Copiar dados convertendo para DATE (remove horário)
UPDATE invoices 
SET due_date_temp = due_date::DATE;

-- Passo 3: Remover coluna antiga
ALTER TABLE invoices 
DROP COLUMN IF EXISTS due_date;

-- Passo 4: Renomear coluna temporária
ALTER TABLE invoices 
RENAME COLUMN due_date_temp TO due_date;

-- Passo 5: Adicionar NOT NULL se necessário
ALTER TABLE invoices 
ALTER COLUMN due_date SET NOT NULL;

-- Verificar resultado
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'invoices' 
  AND column_name = 'due_date';

-- Testar com uma consulta
SELECT 
  id,
  invoice_number,
  due_date,
  pg_typeof(due_date) as tipo_coluna
FROM invoices 
LIMIT 5;
