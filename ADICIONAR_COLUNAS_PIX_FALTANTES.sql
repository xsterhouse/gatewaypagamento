-- ============================================
-- ADICIONAR COLUNAS FALTANTES NA TABELA pix_transactions
-- Execute este SQL para corrigir o erro 'Could not find the receiver_name column'
-- ============================================

-- 1. Adicionar receiver_name se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pix_transactions' 
    AND column_name = 'receiver_name'
  ) THEN
    ALTER TABLE public.pix_transactions 
    ADD COLUMN receiver_name TEXT;
  END IF;

  -- 2. Adicionar fee_amount se não existir
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pix_transactions' 
    AND column_name = 'fee_amount'
  ) THEN
    ALTER TABLE public.pix_transactions 
    ADD COLUMN fee_amount DECIMAL(10,2) DEFAULT 0;
  END IF;

  -- 3. Adicionar net_amount se não existir
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pix_transactions' 
    AND column_name = 'net_amount'
  ) THEN
    ALTER TABLE public.pix_transactions 
    ADD COLUMN net_amount DECIMAL(15,2);
  END IF;

  -- 4. Adicionar transaction_type se não existir
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pix_transactions' 
    AND column_name = 'transaction_type'
  ) THEN
    ALTER TABLE public.pix_transactions 
    ADD COLUMN transaction_type VARCHAR(50) DEFAULT 'withdrawal';
  END IF;

  -- 5. Adicionar metadata se não existir
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pix_transactions' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.pix_transactions 
    ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;

END $$;

-- 6. Atualizar registros existentes (se necessário)
UPDATE pix_transactions 
SET transaction_type = 'withdrawal' 
WHERE transaction_type IS NULL;

-- 7. Verificar colunas adicionadas
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'pix_transactions'
ORDER BY ordinal_position;

SELECT '✅ Colunas adicionadas com sucesso!' as status;
