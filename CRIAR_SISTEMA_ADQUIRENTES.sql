-- ========================================
-- SISTEMA DE ADQUIRENTES BANCÁRIOS
-- ========================================
-- Este script cria o sistema completo para gerenciar
-- adquirentes bancários (Banco Inter, etc) para PIX

-- 1. Criar tabela de adquirentes bancários
CREATE TABLE IF NOT EXISTS bank_acquirers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL, -- Nome do banco (ex: "Banco Inter")
  bank_code VARCHAR(10) NOT NULL, -- Código do banco (ex: "077")
  
  -- Credenciais API
  client_id VARCHAR(255), -- Client ID da API
  client_secret TEXT, -- Client Secret (criptografado)
  certificate TEXT, -- Certificado digital (se necessário)
  
  -- Configurações PIX
  pix_key VARCHAR(255), -- Chave PIX do adquirente
  pix_key_type VARCHAR(20), -- Tipo: 'cpf', 'cnpj', 'email', 'phone', 'random'
  
  -- Dados bancários
  account_number VARCHAR(20),
  account_digit VARCHAR(5),
  agency VARCHAR(10),
  agency_digit VARCHAR(5),
  
  -- URLs da API
  api_base_url TEXT, -- URL base da API
  api_auth_url TEXT, -- URL de autenticação
  api_pix_url TEXT, -- URL específica para PIX
  
  -- Configurações
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false, -- Apenas um pode ser padrão
  environment VARCHAR(20) DEFAULT 'production', -- 'sandbox' ou 'production'
  
  -- Limites e taxas
  daily_limit DECIMAL(15,2), -- Limite diário de transações
  transaction_limit DECIMAL(15,2), -- Limite por transação
  fee_percentage DECIMAL(5,4) DEFAULT 0, -- Taxa percentual
  fee_fixed DECIMAL(10,2) DEFAULT 0, -- Taxa fixa por transação
  
  -- Metadados
  description TEXT,
  logo_url TEXT,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'maintenance'
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT valid_pix_key_type CHECK (pix_key_type IN ('cpf', 'cnpj', 'email', 'phone', 'random')),
  CONSTRAINT valid_environment CHECK (environment IN ('sandbox', 'production')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'maintenance'))
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_bank_acquirers_active ON bank_acquirers(is_active);
CREATE INDEX IF NOT EXISTS idx_bank_acquirers_default ON bank_acquirers(is_default);
CREATE INDEX IF NOT EXISTS idx_bank_acquirers_status ON bank_acquirers(status);

-- 3. Criar índice único parcial para garantir apenas um adquirente padrão
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_default_acquirer 
  ON bank_acquirers(is_default) 
  WHERE is_default = true;

-- 4. Criar tabela de transações PIX com adquirente
CREATE TABLE IF NOT EXISTS pix_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamentos
  user_id UUID NOT NULL REFERENCES auth.users(id),
  acquirer_id UUID REFERENCES bank_acquirers(id),
  deposit_id UUID, -- Referência ao depósito se houver
  
  -- Dados da transação
  transaction_type VARCHAR(20) NOT NULL, -- 'deposit', 'withdrawal', 'transfer'
  amount DECIMAL(15,2) NOT NULL,
  fee_amount DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(15,2) NOT NULL, -- Valor líquido após taxas
  
  -- Dados PIX
  pix_code TEXT, -- Código PIX gerado (copia e cola)
  pix_qr_code TEXT, -- QR Code em base64
  pix_key VARCHAR(255), -- Chave PIX usada
  pix_key_type VARCHAR(20),
  pix_txid VARCHAR(255), -- ID da transação no banco
  pix_e2e_id VARCHAR(255), -- End-to-End ID do PIX
  
  -- Status e controle
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
  description TEXT,
  error_message TEXT,
  
  -- Dados do pagador/recebedor
  payer_name VARCHAR(255),
  payer_document VARCHAR(20),
  receiver_name VARCHAR(255),
  receiver_document VARCHAR(20),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- Expiração do QR Code
  
  -- Metadados
  metadata JSONB DEFAULT '{}',
  
  CONSTRAINT valid_transaction_type CHECK (transaction_type IN ('deposit', 'withdrawal', 'transfer')),
  CONSTRAINT valid_pix_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  CONSTRAINT positive_amount CHECK (amount > 0)
);

-- 5. Criar índices para transações PIX
CREATE INDEX IF NOT EXISTS idx_pix_transactions_user ON pix_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_acquirer ON pix_transactions(acquirer_id);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_status ON pix_transactions(status);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_txid ON pix_transactions(pix_txid);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_e2e ON pix_transactions(pix_e2e_id);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_created ON pix_transactions(created_at DESC);

-- 6. Criar tabela de logs de API do adquirente
CREATE TABLE IF NOT EXISTS acquirer_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acquirer_id UUID REFERENCES bank_acquirers(id),
  transaction_id UUID REFERENCES pix_transactions(id),
  
  -- Dados da requisição
  endpoint VARCHAR(255),
  method VARCHAR(10),
  request_body JSONB,
  request_headers JSONB,
  
  -- Dados da resposta
  response_status INTEGER,
  response_body JSONB,
  response_time_ms INTEGER,
  
  -- Status
  success BOOLEAN,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_acquirer_logs_acquirer ON acquirer_api_logs(acquirer_id);
CREATE INDEX IF NOT EXISTS idx_acquirer_logs_transaction ON acquirer_api_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_acquirer_logs_created ON acquirer_api_logs(created_at DESC);

-- 7. Função para garantir apenas um adquirente padrão
CREATE OR REPLACE FUNCTION ensure_single_default_acquirer()
RETURNS TRIGGER AS $$
BEGIN
  -- Se está marcando como padrão, desmarcar todos os outros
  IF NEW.is_default = true THEN
    UPDATE bank_acquirers 
    SET is_default = false 
    WHERE id != NEW.id AND is_default = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Criar trigger para adquirente padrão
DROP TRIGGER IF EXISTS trigger_ensure_single_default_acquirer ON bank_acquirers;
CREATE TRIGGER trigger_ensure_single_default_acquirer
  BEFORE INSERT OR UPDATE ON bank_acquirers
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_acquirer();

-- 9. Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_acquirer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Criar trigger para updated_at
DROP TRIGGER IF EXISTS trigger_update_acquirer_timestamp ON bank_acquirers;
CREATE TRIGGER trigger_update_acquirer_timestamp
  BEFORE UPDATE ON bank_acquirers
  FOR EACH ROW
  EXECUTE FUNCTION update_acquirer_updated_at();

-- 11. Políticas RLS para bank_acquirers
ALTER TABLE bank_acquirers ENABLE ROW LEVEL SECURITY;

-- Admins podem ver e gerenciar todos os adquirentes
CREATE POLICY "Admins can view all acquirers"
  ON bank_acquirers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert acquirers"
  ON bank_acquirers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update acquirers"
  ON bank_acquirers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete acquirers"
  ON bank_acquirers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- 12. Políticas RLS para pix_transactions
ALTER TABLE pix_transactions ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver suas próprias transações
CREATE POLICY "Users can view own pix transactions"
  ON pix_transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins podem ver todas as transações
CREATE POLICY "Admins can view all pix transactions"
  ON pix_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Usuários podem criar suas próprias transações
CREATE POLICY "Users can create own pix transactions"
  ON pix_transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins podem atualizar transações
CREATE POLICY "Admins can update pix transactions"
  ON pix_transactions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- 13. Políticas RLS para acquirer_api_logs
ALTER TABLE acquirer_api_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all api logs"
  ON acquirer_api_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "System can insert api logs"
  ON acquirer_api_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 14. Inserir adquirente padrão (Banco Inter) como exemplo
INSERT INTO bank_acquirers (
  name,
  bank_code,
  pix_key_type,
  api_base_url,
  description,
  is_default,
  status
) VALUES (
  'Banco Inter',
  '077',
  'cnpj',
  'https://cdpj.partners.bancointer.com.br',
  'Banco Inter - Adquirente padrão para transações PIX',
  true,
  'active'
) ON CONFLICT DO NOTHING;

-- 15. Criar view para estatísticas de adquirentes
CREATE OR REPLACE VIEW acquirer_statistics AS
SELECT 
  ba.id,
  ba.name,
  ba.bank_code,
  ba.is_default,
  ba.status,
  COUNT(pt.id) as total_transactions,
  COUNT(CASE WHEN pt.status = 'completed' THEN 1 END) as completed_transactions,
  COUNT(CASE WHEN pt.status = 'failed' THEN 1 END) as failed_transactions,
  COALESCE(SUM(CASE WHEN pt.status = 'completed' THEN pt.amount END), 0) as total_volume,
  COALESCE(SUM(CASE WHEN pt.status = 'completed' THEN pt.fee_amount END), 0) as total_fees,
  COALESCE(AVG(CASE WHEN pt.status = 'completed' THEN pt.amount END), 0) as avg_transaction_value
FROM bank_acquirers ba
LEFT JOIN pix_transactions pt ON pt.acquirer_id = ba.id
GROUP BY ba.id, ba.name, ba.bank_code, ba.is_default, ba.status;

-- 16. Comentários para documentação
COMMENT ON TABLE bank_acquirers IS 'Armazena configurações dos adquirentes bancários para processamento de PIX';
COMMENT ON TABLE pix_transactions IS 'Registra todas as transações PIX realizadas através dos adquirentes';
COMMENT ON TABLE acquirer_api_logs IS 'Logs de comunicação com APIs dos adquirentes bancários';
COMMENT ON VIEW acquirer_statistics IS 'Estatísticas agregadas por adquirente bancário';

-- ========================================
-- FIM DO SCRIPT
-- ========================================
-- Execute este script no Supabase SQL Editor
-- Após executar, você terá:
-- ✅ Tabela de adquirentes bancários
-- ✅ Tabela de transações PIX
-- ✅ Sistema de logs de API
-- ✅ Políticas RLS configuradas
-- ✅ Triggers automáticos
-- ✅ View de estatísticas
