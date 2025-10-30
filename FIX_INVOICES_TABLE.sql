-- ============================================
-- CORRIGIR TABELA INVOICES
-- Adicionar coluna description se não existir
-- ============================================

-- Verificar estrutura atual
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'invoices'
ORDER BY ordinal_position;

-- Adicionar coluna description se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'description'
  ) THEN
    ALTER TABLE invoices ADD COLUMN description TEXT;
    RAISE NOTICE 'Coluna description adicionada!';
  ELSE
    RAISE NOTICE 'Coluna description já existe!';
  END IF;
END $$;

-- Verificar novamente
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'invoices'
ORDER BY ordinal_position;

SELECT '✅ Tabela corrigida!' as status;
