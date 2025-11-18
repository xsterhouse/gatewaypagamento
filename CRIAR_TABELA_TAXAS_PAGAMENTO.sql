-- ============================================
-- CRIAR TABELA DE CONFIGURAÇÃO DE TAXAS
-- ============================================

-- 1. CRIAR TABELA
CREATE TABLE IF NOT EXISTS public.payment_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tipo de pagamento
  payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('pix', 'boleto', 'ted', 'doc', 'credit_card', 'debit_card')),
  
  -- Tipo de taxa
  fee_type VARCHAR(20) NOT NULL CHECK (fee_type IN ('fixed', 'percentage', 'mixed')),
  
  -- Valores
  fixed_amount DECIMAL(10,2) DEFAULT 0,
  percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Limites
  min_amount DECIMAL(10,2) DEFAULT 0,
  max_amount DECIMAL(10,2),
  
  -- Descrição
  description TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. CRIAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_payment_fees_type ON public.payment_fees(payment_type);
CREATE INDEX IF NOT EXISTS idx_payment_fees_active ON public.payment_fees(is_active);

-- 3. INSERIR TAXAS PADRÃO
INSERT INTO public.payment_fees (payment_type, fee_type, fixed_amount, percentage, min_amount, max_amount, description, is_active) VALUES
  -- PIX
  ('pix', 'percentage', 0, 1.5, 0.50, NULL, 'Taxa padrão para depósito via PIX', true),
  
  -- Boleto
  ('boleto', 'percentage', 0, 2.5, 2.00, NULL, 'Taxa padrão para boleto bancário', true),
  
  -- TED/DOC
  ('ted', 'fixed', 5.00, 0, 5.00, 5.00, 'Taxa fixa para TED', true),
  ('doc', 'fixed', 3.00, 0, 3.00, 3.00, 'Taxa fixa para DOC', true),
  
  -- Cartões (para futuro)
  ('credit_card', 'percentage', 0, 3.5, 0.50, NULL, 'Taxa para cartão de crédito', false),
  ('debit_card', 'percentage', 0, 2.0, 0.50, NULL, 'Taxa para cartão de débito', false)
ON CONFLICT DO NOTHING;

-- 4. HABILITAR RLS
ALTER TABLE public.payment_fees ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS RLS

-- Todos podem visualizar taxas ativas
DROP POLICY IF EXISTS "Todos podem ver taxas ativas" ON public.payment_fees;
CREATE POLICY "Todos podem ver taxas ativas"
ON public.payment_fees FOR SELECT
USING (is_active = true);

-- Apenas admins podem gerenciar taxas
DROP POLICY IF EXISTS "Admins podem gerenciar taxas" ON public.payment_fees;
CREATE POLICY "Admins podem gerenciar taxas"
ON public.payment_fees FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'master')
  )
);

-- 6. TRIGGER PARA ATUALIZAR updated_at
CREATE OR REPLACE FUNCTION update_payment_fees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_payment_fees_updated_at ON public.payment_fees;
CREATE TRIGGER trigger_update_payment_fees_updated_at
  BEFORE UPDATE ON public.payment_fees
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_fees_updated_at();

-- 7. VERIFICAR CRIAÇÃO
SELECT 
  id,
  payment_type,
  fee_type,
  fixed_amount,
  percentage,
  min_amount,
  max_amount,
  description,
  is_active
FROM public.payment_fees
ORDER BY payment_type;

-- 8. COMENTÁRIOS
COMMENT ON TABLE public.payment_fees IS 'Configuração de taxas por tipo de pagamento';
COMMENT ON COLUMN public.payment_fees.payment_type IS 'Tipo de pagamento (pix, boleto, ted, etc)';
COMMENT ON COLUMN public.payment_fees.fee_type IS 'Tipo de taxa: fixed (fixa), percentage (percentual), mixed (mista)';
COMMENT ON COLUMN public.payment_fees.fixed_amount IS 'Valor fixo da taxa em reais';
COMMENT ON COLUMN public.payment_fees.percentage IS 'Percentual da taxa (ex: 2.5 para 2.5%)';
COMMENT ON COLUMN public.payment_fees.min_amount IS 'Valor mínimo da taxa';
COMMENT ON COLUMN public.payment_fees.max_amount IS 'Valor máximo da taxa';

SELECT '✅ Tabela payment_fees criada com sucesso!' as status;
