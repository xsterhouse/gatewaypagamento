-- ============================================
-- CRIAR TABELA DE FATURAS/BOLETOS
-- ============================================

-- 1. CRIAR TABELA
CREATE TABLE IF NOT EXISTS public.invoices_boletos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Usuário que criou a fatura
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Dados do Pagador
  payer_name VARCHAR(255) NOT NULL,
  payer_email VARCHAR(255) NOT NULL,
  payer_document VARCHAR(18) NOT NULL,
  payer_phone VARCHAR(20),
  
  -- Endereço do Pagador
  payer_address JSONB NOT NULL,
  
  -- Dados do Boleto
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 5.00),
  description TEXT NOT NULL,
  due_date DATE NOT NULL,
  
  -- Taxas
  fee_amount DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(10,2) NOT NULL,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired', 'cancelled')),
  
  -- Dados do Mercado Pago
  mercadopago_payment_id VARCHAR(255),
  barcode TEXT,
  digitable_line TEXT,
  pdf_url TEXT,
  
  -- Pagamento
  paid_at TIMESTAMPTZ,
  paid_amount DECIMAL(10,2),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ
);

-- 2. CRIAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_invoices_boletos_user_id ON public.invoices_boletos(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_boletos_status ON public.invoices_boletos(status);
CREATE INDEX IF NOT EXISTS idx_invoices_boletos_mercadopago_id ON public.invoices_boletos(mercadopago_payment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_boletos_due_date ON public.invoices_boletos(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_boletos_created_at ON public.invoices_boletos(created_at DESC);

-- 3. HABILITAR RLS
ALTER TABLE public.invoices_boletos ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS RLS

-- Usuários podem ver suas próprias faturas
DROP POLICY IF EXISTS "Usuários podem ver suas faturas" ON public.invoices_boletos;
CREATE POLICY "Usuários podem ver suas faturas"
ON public.invoices_boletos FOR SELECT
USING (auth.uid() = user_id);

-- Usuários podem criar suas próprias faturas
DROP POLICY IF EXISTS "Usuários podem criar faturas" ON public.invoices_boletos;
CREATE POLICY "Usuários podem criar faturas"
ON public.invoices_boletos FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias faturas (apenas se pendente)
DROP POLICY IF EXISTS "Usuários podem atualizar faturas pendentes" ON public.invoices_boletos;
CREATE POLICY "Usuários podem atualizar faturas pendentes"
ON public.invoices_boletos FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

-- Usuários podem deletar suas próprias faturas (apenas se pendente)
DROP POLICY IF EXISTS "Usuários podem deletar faturas pendentes" ON public.invoices_boletos;
CREATE POLICY "Usuários podem deletar faturas pendentes"
ON public.invoices_boletos FOR DELETE
USING (auth.uid() = user_id AND status = 'pending');

-- Admins podem ver todas as faturas
DROP POLICY IF EXISTS "Admins podem ver todas faturas" ON public.invoices_boletos;
CREATE POLICY "Admins podem ver todas faturas"
ON public.invoices_boletos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'master')
  )
);

-- Admins podem atualizar qualquer fatura
DROP POLICY IF EXISTS "Admins podem atualizar faturas" ON public.invoices_boletos;
CREATE POLICY "Admins podem atualizar faturas"
ON public.invoices_boletos FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'master')
  )
);

-- 5. TRIGGER PARA ATUALIZAR updated_at
CREATE OR REPLACE FUNCTION update_invoices_boletos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_invoices_boletos_updated_at ON public.invoices_boletos;
CREATE TRIGGER trigger_update_invoices_boletos_updated_at
  BEFORE UPDATE ON public.invoices_boletos
  FOR EACH ROW
  EXECUTE FUNCTION update_invoices_boletos_updated_at();

-- 6. TRIGGER PARA EXPIRAR BOLETOS AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION expire_overdue_invoices()
RETURNS void AS $$
BEGIN
  UPDATE public.invoices_boletos
  SET status = 'expired'
  WHERE status = 'pending'
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- 7. FUNÇÃO PARA PROCESSAR PAGAMENTO
CREATE OR REPLACE FUNCTION process_invoice_payment(
  p_invoice_id UUID,
  p_payment_id VARCHAR(255),
  p_paid_amount DECIMAL(10,2)
)
RETURNS void AS $$
DECLARE
  v_invoice RECORD;
  v_user_wallet_id UUID;
  v_admin_wallet_id UUID;
BEGIN
  -- Buscar fatura
  SELECT * INTO v_invoice
  FROM public.invoices_boletos
  WHERE id = p_invoice_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fatura não encontrada';
  END IF;

  IF v_invoice.status != 'pending' THEN
    RAISE EXCEPTION 'Fatura já foi processada';
  END IF;

  -- Atualizar status da fatura
  UPDATE public.invoices_boletos
  SET 
    status = 'paid',
    paid_at = NOW(),
    paid_amount = p_paid_amount,
    mercadopago_payment_id = p_payment_id
  WHERE id = p_invoice_id;

  -- Buscar carteira BRL do usuário
  SELECT id INTO v_user_wallet_id
  FROM public.wallets
  WHERE user_id = v_invoice.user_id
    AND currency_code = 'BRL'
    AND is_active = true
  LIMIT 1;

  -- Creditar valor líquido na carteira do usuário
  IF v_user_wallet_id IS NOT NULL THEN
    UPDATE public.wallets
    SET 
      balance = balance + v_invoice.net_amount,
      available_balance = available_balance + v_invoice.net_amount,
      updated_at = NOW()
    WHERE id = v_user_wallet_id;

    -- Registrar transação
    INSERT INTO public.wallet_transactions (
      wallet_id,
      user_id,
      transaction_type,
      amount,
      balance_before,
      balance_after,
      description,
      created_at
    )
    SELECT
      v_user_wallet_id,
      v_invoice.user_id,
      'credit',
      v_invoice.net_amount,
      w.balance - v_invoice.net_amount,
      w.balance,
      'Pagamento de fatura/boleto - ' || v_invoice.description,
      NOW()
    FROM public.wallets w
    WHERE w.id = v_user_wallet_id;
  END IF;

  -- Buscar carteira admin
  SELECT id INTO v_admin_wallet_id
  FROM public.wallets
  WHERE wallet_name = 'Conta Mãe - Taxas Gateway'
  LIMIT 1;

  -- Creditar taxa na carteira admin
  IF v_admin_wallet_id IS NOT NULL AND v_invoice.fee_amount > 0 THEN
    UPDATE public.wallets
    SET 
      balance = balance + v_invoice.fee_amount,
      available_balance = available_balance + v_invoice.fee_amount,
      updated_at = NOW()
    WHERE id = v_admin_wallet_id;

    -- Registrar transação de taxa
    INSERT INTO public.wallet_transactions (
      wallet_id,
      user_id,
      transaction_type,
      amount,
      balance_before,
      balance_after,
      description,
      created_at
    )
    SELECT
      v_admin_wallet_id,
      (SELECT user_id FROM public.wallets WHERE id = v_admin_wallet_id),
      'credit',
      v_invoice.fee_amount,
      w.balance - v_invoice.fee_amount,
      w.balance,
      'Taxa de fatura/boleto - ' || v_invoice.id,
      NOW()
    FROM public.wallets w
    WHERE w.id = v_admin_wallet_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 8. COMENTÁRIOS
COMMENT ON TABLE public.invoices_boletos IS 'Faturas e boletos gerados pelos usuários';
COMMENT ON COLUMN public.invoices_boletos.status IS 'Status: pending, paid, expired, cancelled';
COMMENT ON COLUMN public.invoices_boletos.payer_address IS 'Endereço completo do pagador em JSON';
COMMENT ON COLUMN public.invoices_boletos.net_amount IS 'Valor líquido que o usuário receberá (amount - fee_amount)';

-- 9. VERIFICAR CRIAÇÃO
SELECT 
  id,
  user_id,
  payer_name,
  amount,
  status,
  created_at
FROM public.invoices_boletos
LIMIT 5;

SELECT '✅ Tabela invoices_boletos criada com sucesso!' as status;
