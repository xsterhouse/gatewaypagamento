-- ========================================
-- TABELA: pix_transactions
-- Descrição: Transações PIX processadas pelo Gateway
-- ========================================

CREATE TABLE IF NOT EXISTS public.pix_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  acquirer_id UUID REFERENCES public.bank_acquirers(id) ON DELETE SET NULL,
  deposit_id UUID,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'transfer')),
  amount DECIMAL(15, 2) NOT NULL,
  fee_amount DECIMAL(10, 2) DEFAULT 0,
  net_amount DECIMAL(15, 2) NOT NULL,
  pix_code TEXT,
  pix_qr_code TEXT,
  pix_key VARCHAR(255),
  pix_key_type VARCHAR(20) CHECK (pix_key_type IN ('cpf', 'cnpj', 'email', 'phone', 'random')),
  pix_txid VARCHAR(255),
  pix_e2e_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  description TEXT,
  error_message TEXT,
  payer_name VARCHAR(255),
  payer_document VARCHAR(20),
  receiver_name VARCHAR(255),
  receiver_document VARCHAR(20),
  expires_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ========================================
-- ÍNDICES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_pix_transactions_user_id ON public.pix_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_acquirer_id ON public.pix_transactions(acquirer_id);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_status ON public.pix_transactions(status);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_pix_txid ON public.pix_transactions(pix_txid);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_created_at ON public.pix_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_type_status ON public.pix_transactions(transaction_type, status);

-- ========================================
-- TRIGGER PARA ATUALIZAR updated_at
-- ========================================

CREATE OR REPLACE FUNCTION update_pix_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_pix_transactions_updated_at ON public.pix_transactions;
CREATE TRIGGER trigger_update_pix_transactions_updated_at
  BEFORE UPDATE ON public.pix_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_pix_transactions_updated_at();

-- ========================================
-- RLS (Row Level Security)
-- ========================================

ALTER TABLE public.pix_transactions ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver suas próprias transações
DROP POLICY IF EXISTS "Usuários podem ver suas transações" ON public.pix_transactions;
CREATE POLICY "Usuários podem ver suas transações"
  ON public.pix_transactions
  FOR SELECT
  USING (user_id = auth.uid());

-- Política: Admins podem ver todas as transações
DROP POLICY IF EXISTS "Admins podem ver todas transações" ON public.pix_transactions;
CREATE POLICY "Admins podem ver todas transações"
  ON public.pix_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Política: Sistema pode inserir transações
DROP POLICY IF EXISTS "Sistema pode inserir transações" ON public.pix_transactions;
CREATE POLICY "Sistema pode inserir transações"
  ON public.pix_transactions
  FOR INSERT
  WITH CHECK (true);

-- Política: Sistema pode atualizar transações
DROP POLICY IF EXISTS "Sistema pode atualizar transações" ON public.pix_transactions;
CREATE POLICY "Sistema pode atualizar transações"
  ON public.pix_transactions
  FOR UPDATE
  USING (true);

-- ========================================
-- FUNÇÃO PARA ESTATÍSTICAS DO ADQUIRENTE
-- ========================================

CREATE OR REPLACE FUNCTION get_acquirer_statistics(acquirer_uuid UUID)
RETURNS TABLE (
  total_transactions BIGINT,
  total_volume DECIMAL,
  successful_transactions BIGINT,
  failed_transactions BIGINT,
  success_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_transactions,
    COALESCE(SUM(amount), 0)::DECIMAL as total_volume,
    COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as successful_transactions,
    COUNT(*) FILTER (WHERE status = 'failed')::BIGINT as failed_transactions,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / COUNT(*)::DECIMAL * 100)
      ELSE 0
    END as success_rate
  FROM public.pix_transactions
  WHERE acquirer_id = acquirer_uuid
  AND created_at >= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.pix_transactions IS 'Transações PIX processadas pelo Gateway de Pagamentos';
COMMENT ON COLUMN public.pix_transactions.pix_txid IS 'ID da transação no adquirente (Mercado Pago, etc)';
COMMENT ON COLUMN public.pix_transactions.pix_e2e_id IS 'ID End-to-End do PIX (padrão Banco Central)';
COMMENT ON COLUMN public.pix_transactions.metadata IS 'Dados adicionais da transação em formato JSON';
