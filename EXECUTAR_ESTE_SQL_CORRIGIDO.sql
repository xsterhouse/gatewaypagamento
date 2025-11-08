-- ========================================
-- ✅ SQL CORRIGIDO - EXECUTE ESTE ARQUIVO
-- ========================================
-- Este arquivo corrige o erro de locked_balance → blocked_balance
-- Execute no Supabase SQL Editor
-- ========================================

-- 1. Criar tabela wallet_transactions
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Tipo de transação
  transaction_type VARCHAR(20) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  
  -- Saldos antes e depois
  balance_before DECIMAL(15,2) NOT NULL,
  balance_after DECIMAL(15,2) NOT NULL,
  
  -- Descrição e referência
  description TEXT NOT NULL,
  reference_id UUID,
  reference_type VARCHAR(50),
  
  -- Metadados adicionais
  metadata JSONB,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_transaction_type CHECK (transaction_type IN ('credit', 'debit', 'lock', 'unlock'))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reference ON wallet_transactions(reference_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created ON wallet_transactions(created_at DESC);

-- RLS
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallet transactions"
  ON wallet_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert wallet transactions"
  ON wallet_transactions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all wallet transactions"
  ON wallet_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'master')
    )
  );

-- ========================================
-- 2. Criar tabela webhook_logs
-- ========================================

CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acquirer_id UUID REFERENCES bank_acquirers(id),
  
  event_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  
  ip_address INET,
  user_agent TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_webhook_logs_acquirer ON webhook_logs(acquirer_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_success ON webhook_logs(success);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed ON webhook_logs(processed_at DESC);

-- RLS
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view webhook logs"
  ON webhook_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'master')
    )
  );

CREATE POLICY "System can insert webhook logs"
  ON webhook_logs FOR INSERT
  WITH CHECK (true);

-- ========================================
-- 3. Função de limpeza
-- ========================================

CREATE OR REPLACE FUNCTION cleanup_old_webhook_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM webhook_logs 
  WHERE processed_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 4. Trigger para updated_at em wallets
-- ========================================

CREATE OR REPLACE FUNCTION update_wallet_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_wallet_timestamp ON wallets;

CREATE TRIGGER trigger_update_wallet_timestamp
  BEFORE UPDATE ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_timestamp();

-- ========================================
-- 5. View de estatísticas (CORRIGIDO)
-- ========================================

CREATE OR REPLACE VIEW wallet_statistics AS
SELECT 
  w.user_id,
  w.currency_code,
  w.balance,
  w.blocked_balance,
  (w.balance - w.blocked_balance) as available_balance,
  COUNT(wt.id) as total_transactions,
  SUM(CASE WHEN wt.transaction_type = 'credit' THEN wt.amount ELSE 0 END) as total_credits,
  SUM(CASE WHEN wt.transaction_type = 'debit' THEN wt.amount ELSE 0 END) as total_debits,
  MAX(wt.created_at) as last_transaction_at
FROM wallets w
LEFT JOIN wallet_transactions wt ON wt.wallet_id = w.id
GROUP BY w.id, w.user_id, w.currency_code, w.balance, w.blocked_balance;

-- ========================================
-- 6. Função de saldo disponível (CORRIGIDO)
-- ========================================

CREATE OR REPLACE FUNCTION get_available_balance(
  p_user_id UUID,
  p_currency_code VARCHAR(10) DEFAULT 'BRL'
)
RETURNS DECIMAL(15,2) AS $$
DECLARE
  v_balance DECIMAL(15,2);
  v_blocked DECIMAL(15,2);
BEGIN
  SELECT balance, blocked_balance 
  INTO v_balance, v_blocked
  FROM wallets
  WHERE user_id = p_user_id 
  AND currency_code = p_currency_code;
  
  IF v_balance IS NULL THEN
    RETURN 0;
  END IF;
  
  RETURN v_balance - v_blocked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 7. Verificar instalação
-- ========================================

SELECT 
  'wallet_transactions' as tabela,
  COUNT(*) as total_registros
FROM wallet_transactions
UNION ALL
SELECT 
  'webhook_logs' as tabela,
  COUNT(*) as total_registros
FROM webhook_logs;

-- ========================================
-- ✅ RESULTADO ESPERADO:
-- ========================================
-- Tabela: wallet_transactions | total_registros: 0
-- Tabela: webhook_logs        | total_registros: 0
-- ========================================

SELECT '✅ Tabelas auxiliares criadas com sucesso!' as status;
