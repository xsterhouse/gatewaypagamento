-- ========================================
-- RECRIAR TABELA MED COM FOREIGN KEYS NOMEADAS
-- ========================================
-- Execute este script se você já criou a tabela antes
-- e está tendo problemas com ambiguidade de foreign keys

-- 1. Dropar a tabela existente (cuidado: isso apaga os dados!)
DROP TABLE IF EXISTS med_requests CASCADE;

-- 2. Criar tabela de solicitações MED com foreign keys nomeadas
CREATE TABLE med_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
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
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_reason TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  CONSTRAINT valid_account_type CHECK (account_type IN ('corrente', 'poupanca', NULL)),
  CONSTRAINT valid_pix_key_type CHECK (pix_key_type IN ('cpf', 'cnpj', 'email', 'phone', 'random', NULL)),
  
  -- Foreign Keys com nomes explícitos
  CONSTRAINT med_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT med_requests_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- 3. Criar índices para performance
CREATE INDEX idx_med_requests_user_id ON med_requests(user_id);
CREATE INDEX idx_med_requests_status ON med_requests(status);
CREATE INDEX idx_med_requests_created_at ON med_requests(created_at DESC);

-- 4. Adicionar comentários
COMMENT ON TABLE med_requests IS 'Solicitações de MED (Mecanismo Especial de Devolução)';
COMMENT ON COLUMN med_requests.status IS 'Status: pending, approved, rejected, completed';
COMMENT ON COLUMN med_requests.amount IS 'Valor solicitado para devolução';
COMMENT ON COLUMN med_requests.reason IS 'Motivo da solicitação';
COMMENT ON COLUMN med_requests.pix_key_type IS 'Tipo de chave PIX: cpf, cnpj, email, phone, random';

-- 5. Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_med_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Criar trigger para updated_at
CREATE TRIGGER trigger_update_med_requests_updated_at
  BEFORE UPDATE ON med_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_med_requests_updated_at();

-- 7. Habilitar RLS (Row Level Security)
ALTER TABLE med_requests ENABLE ROW LEVEL SECURITY;

-- 8. Políticas RLS
-- Usuários podem ver apenas suas próprias solicitações
CREATE POLICY "Users can view own med requests"
  ON med_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários podem criar suas próprias solicitações
CREATE POLICY "Users can create own med requests"
  ON med_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins podem ver todas as solicitações
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
CREATE POLICY "Admins can update med requests"
  ON med_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

-- 9. Verificar se a tabela foi criada corretamente
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'med_requests'
ORDER BY ordinal_position;

-- 10. Verificar as foreign keys
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'med_requests'
  AND tc.constraint_type = 'FOREIGN KEY';

-- ========================================
-- FIM DO SCRIPT
-- ========================================
