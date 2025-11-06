-- ========================================
-- TABELA: bank_acquirers
-- Descrição: Gerenciamento de adquirentes bancários para Gateway PIX
-- ========================================

CREATE TABLE IF NOT EXISTS public.bank_acquirers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  bank_code VARCHAR(10) NOT NULL,
  client_id TEXT,
  client_secret TEXT,
  certificate TEXT,
  pix_key VARCHAR(255),
  pix_key_type VARCHAR(20) CHECK (pix_key_type IN ('cpf', 'cnpj', 'email', 'phone', 'random')),
  account_number VARCHAR(50),
  account_digit VARCHAR(5),
  agency VARCHAR(20),
  agency_digit VARCHAR(5),
  api_base_url TEXT,
  api_auth_url TEXT,
  api_pix_url TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  is_default BOOLEAN DEFAULT false NOT NULL,
  environment VARCHAR(20) DEFAULT 'production' CHECK (environment IN ('sandbox', 'production')),
  daily_limit DECIMAL(15, 2),
  transaction_limit DECIMAL(15, 2),
  fee_percentage DECIMAL(5, 4),
  fee_fixed DECIMAL(10, 2),
  description TEXT,
  logo_url TEXT,
  -- Webhook fields
  webhook_url TEXT,
  webhook_secret TEXT,
  webhook_events JSONB DEFAULT '[]'::jsonb,
  webhook_enabled BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ========================================
-- ÍNDICES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_bank_acquirers_is_active ON public.bank_acquirers(is_active);
CREATE INDEX IF NOT EXISTS idx_bank_acquirers_is_default ON public.bank_acquirers(is_default);
CREATE INDEX IF NOT EXISTS idx_bank_acquirers_status ON public.bank_acquirers(status);
CREATE INDEX IF NOT EXISTS idx_bank_acquirers_bank_code ON public.bank_acquirers(bank_code);

-- ========================================
-- TRIGGER PARA ATUALIZAR updated_at
-- ========================================

CREATE OR REPLACE FUNCTION update_bank_acquirers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_bank_acquirers_updated_at ON public.bank_acquirers;
CREATE TRIGGER trigger_update_bank_acquirers_updated_at
  BEFORE UPDATE ON public.bank_acquirers
  FOR EACH ROW
  EXECUTE FUNCTION update_bank_acquirers_updated_at();

-- ========================================
-- GARANTIR APENAS UM ADQUIRENTE PADRÃO
-- ========================================

CREATE OR REPLACE FUNCTION ensure_single_default_acquirer()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.bank_acquirers
    SET is_default = false
    WHERE id != NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ensure_single_default_acquirer ON public.bank_acquirers;
CREATE TRIGGER trigger_ensure_single_default_acquirer
  BEFORE INSERT OR UPDATE ON public.bank_acquirers
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_acquirer();

-- ========================================
-- RLS (Row Level Security)
-- ========================================

ALTER TABLE public.bank_acquirers ENABLE ROW LEVEL SECURITY;

-- Política: Apenas admins podem ver adquirentes
DROP POLICY IF EXISTS "Admins podem ver adquirentes" ON public.bank_acquirers;
CREATE POLICY "Admins podem ver adquirentes"
  ON public.bank_acquirers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Política: Apenas admins podem inserir adquirentes
DROP POLICY IF EXISTS "Admins podem inserir adquirentes" ON public.bank_acquirers;
CREATE POLICY "Admins podem inserir adquirentes"
  ON public.bank_acquirers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Política: Apenas admins podem atualizar adquirentes
DROP POLICY IF EXISTS "Admins podem atualizar adquirentes" ON public.bank_acquirers;
CREATE POLICY "Admins podem atualizar adquirentes"
  ON public.bank_acquirers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Política: Apenas admins podem deletar adquirentes
DROP POLICY IF EXISTS "Admins podem deletar adquirentes" ON public.bank_acquirers;
CREATE POLICY "Admins podem deletar adquirentes"
  ON public.bank_acquirers
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ========================================
-- DADOS DE EXEMPLO (OPCIONAL)
-- ========================================

-- Inserir adquirente de exemplo (Mercado Pago Sandbox)
INSERT INTO public.bank_acquirers (
  name,
  bank_code,
  environment,
  description,
  is_active,
  is_default,
  status,
  webhook_enabled
) VALUES (
  'Mercado Pago (Sandbox)',
  '323',
  'sandbox',
  'Adquirente Mercado Pago para testes em ambiente sandbox',
  false,
  false,
  'inactive',
  false
) ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.bank_acquirers IS 'Tabela de adquirentes bancários para processamento de PIX via Gateway';
COMMENT ON COLUMN public.bank_acquirers.webhook_events IS 'Array JSON de eventos de webhook habilitados (ex: ["pix.created", "pix.completed"])';
