-- ============================================
-- ADICIONAR COLUNAS FALTANTES NA TABELA pix_transactions
-- Execute este SQL se a tabela já existir
-- ============================================

-- Verificar se a tabela existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'pix_transactions'
);

-- Se a tabela já existe, adicionar colunas faltantes
DO $$ 
BEGIN
  -- Adicionar mp_payment_id se não existir
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pix_transactions' 
    AND column_name = 'mp_payment_id'
  ) THEN
    ALTER TABLE public.pix_transactions 
    ADD COLUMN mp_payment_id TEXT UNIQUE;
  END IF;

  -- Adicionar mp_qr_code se não existir
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pix_transactions' 
    AND column_name = 'mp_qr_code'
  ) THEN
    ALTER TABLE public.pix_transactions 
    ADD COLUMN mp_qr_code TEXT;
  END IF;

  -- Adicionar mp_qr_code_base64 se não existir
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pix_transactions' 
    AND column_name = 'mp_qr_code_base64'
  ) THEN
    ALTER TABLE public.pix_transactions 
    ADD COLUMN mp_qr_code_base64 TEXT;
  END IF;

  -- Adicionar mp_external_reference se não existir
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pix_transactions' 
    AND column_name = 'mp_external_reference'
  ) THEN
    ALTER TABLE public.pix_transactions 
    ADD COLUMN mp_external_reference TEXT;
  END IF;

  -- Adicionar pix_key se não existir
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pix_transactions' 
    AND column_name = 'pix_key'
  ) THEN
    ALTER TABLE public.pix_transactions 
    ADD COLUMN pix_key TEXT;
  END IF;

  -- Adicionar pix_key_type se não existir
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pix_transactions' 
    AND column_name = 'pix_key_type'
  ) THEN
    ALTER TABLE public.pix_transactions 
    ADD COLUMN pix_key_type TEXT CHECK (pix_key_type IN ('cpf', 'cnpj', 'email', 'phone', 'random'));
  END IF;

  -- Adicionar description se não existir
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pix_transactions' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE public.pix_transactions 
    ADD COLUMN description TEXT;
  END IF;

  -- Adicionar error_message se não existir
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pix_transactions' 
    AND column_name = 'error_message'
  ) THEN
    ALTER TABLE public.pix_transactions 
    ADD COLUMN error_message TEXT;
  END IF;

  -- Adicionar expires_at se não existir
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pix_transactions' 
    AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE public.pix_transactions 
    ADD COLUMN expires_at TIMESTAMPTZ;
  END IF;
END $$;

-- Verificar colunas adicionadas
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'pix_transactions'
ORDER BY ordinal_position;
