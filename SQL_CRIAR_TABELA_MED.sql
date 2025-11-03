-- ========================================
-- CRIAR TABELA DE SOLICITAÇÕES MED
-- ========================================
-- MED = Mecanismo Especial de Devolução
-- Sistema para clientes solicitarem devolução de valores

-- 1. Criar tabela de solicitações MED
CREATE TABLE IF NOT EXISTS med_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Dados da solicitação
  transaction_id VARCHAR(255),
  amount DECIMAL(15, 2) NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  
  -- Dados bancários para devolução
  bank_name VARCHAR(255),
  bank_code VARCHAR(10),
  account_type VARCHAR(20), -- 'corrente' ou 'poupanca'
  agency VARCHAR(20),
  account_number VARCHAR(50),
  account_holder_name VARCHAR(255),
  account_holder_document VARCHAR(20),
  pix_key VARCHAR(255),
  pix_key_type VARCHAR(20), -- 'cpf', 'cnpj', 'email', 'phone', 'random'
  
  -- Status e aprovação
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'completed'
  admin_notes TEXT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_reason TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  CONSTRAINT valid_account_type CHECK (account_type IN ('corrente', 'poupanca', NULL)),
  CONSTRAINT valid_pix_key_type CHECK (pix_key_type IN ('cpf', 'cnpj', 'email', 'phone', 'random', NULL))
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_med_requests_user_id ON med_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_med_requests_status ON med_requests(status);
CREATE INDEX IF NOT EXISTS idx_med_requests_created_at ON med_requests(created_at DESC);

-- 3. Adicionar comentários
COMMENT ON TABLE med_requests IS 'Solicitações de MED (Mecanismo Especial de Devolução)';
COMMENT ON COLUMN med_requests.status IS 'Status: pending, approved, rejected, completed';
COMMENT ON COLUMN med_requests.amount IS 'Valor solicitado para devolução';
COMMENT ON COLUMN med_requests.reason IS 'Motivo da solicitação';
COMMENT ON COLUMN med_requests.pix_key_type IS 'Tipo de chave PIX: cpf, cnpj, email, phone, random';

-- 4. Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_med_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar trigger para updated_at
DROP TRIGGER IF EXISTS trigger_update_med_requests_updated_at ON med_requests;
CREATE TRIGGER trigger_update_med_requests_updated_at
  BEFORE UPDATE ON med_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_med_requests_updated_at();

-- 6. Habilitar RLS (Row Level Security)
ALTER TABLE med_requests ENABLE ROW LEVEL SECURITY;

-- 7. Políticas RLS
-- Usuários podem ver apenas suas próprias solicitações
DROP POLICY IF EXISTS "Users can view own med requests" ON med_requests;
CREATE POLICY "Users can view own med requests"
  ON med_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários podem criar suas próprias solicitações
DROP POLICY IF EXISTS "Users can create own med requests" ON med_requests;
CREATE POLICY "Users can create own med requests"
  ON med_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins podem ver todas as solicitações
DROP POLICY IF EXISTS "Admins can view all med requests" ON med_requests;
CREATE POLICY "Admins can view all med requests"
  ON med_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

-- Admins podem atualizar solicitações
DROP POLICY IF EXISTS "Admins can update med requests" ON med_requests;
CREATE POLICY "Admins can update med requests"
  ON med_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

-- 8. Verificar se a tabela foi criada
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'med_requests'
ORDER BY ordinal_position;

-- Deve retornar todas as colunas!

-- ========================================
-- FIM DO SCRIPT
-- ========================================
