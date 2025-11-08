-- ========================================
-- SISTEMA DE TAXAS DA PLATAFORMA
-- ========================================
-- Taxa que o sistema cobra por transação PIX
-- ========================================

-- 1. Criar tabela de configuração de taxas
CREATE TABLE IF NOT EXISTS system_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tipo de operação
  operation_type VARCHAR(50) NOT NULL, -- 'pix_receive', 'pix_send', 'withdrawal', etc
  
  -- Taxas
  fee_percentage DECIMAL(5,4) DEFAULT 0, -- Ex: 0.0050 = 0.5%
  fee_fixed DECIMAL(10,2) DEFAULT 0.05, -- Ex: R$ 0,05
  
  -- Limites
  min_fee DECIMAL(10,2) DEFAULT 0.05, -- Taxa mínima
  max_fee DECIMAL(10,2), -- Taxa máxima (opcional)
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Descrição
  description TEXT,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraint
  CONSTRAINT unique_operation_type UNIQUE(operation_type)
);

-- 2. Inserir taxas padrão
INSERT INTO system_fees (operation_type, fee_fixed, description) VALUES
  ('pix_receive', 0.05, 'Taxa do sistema ao receber PIX'),
  ('pix_send', 0.05, 'Taxa do sistema ao enviar PIX')
ON CONFLICT (operation_type) DO NOTHING;

-- 3. Criar tabela para armazenar taxas coletadas
CREATE TABLE IF NOT EXISTS system_fee_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referência
  user_id UUID NOT NULL REFERENCES auth.users(id),
  transaction_id UUID, -- Referência à transação PIX
  operation_type VARCHAR(50) NOT NULL,
  
  -- Valores
  transaction_amount DECIMAL(15,2) NOT NULL, -- Valor da transação
  fee_amount DECIMAL(10,2) NOT NULL, -- Taxa cobrada
  
  -- Status
  status VARCHAR(20) DEFAULT 'collected', -- 'collected', 'refunded'
  
  -- Metadados
  metadata JSONB,
  
  -- Auditoria
  collected_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Índices
  CONSTRAINT fk_transaction FOREIGN KEY (transaction_id) 
    REFERENCES pix_transactions(id) ON DELETE SET NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_system_fee_collections_user ON system_fee_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_system_fee_collections_transaction ON system_fee_collections(transaction_id);
CREATE INDEX IF NOT EXISTS idx_system_fee_collections_operation ON system_fee_collections(operation_type);
CREATE INDEX IF NOT EXISTS idx_system_fee_collections_collected ON system_fee_collections(collected_at DESC);

-- RLS
ALTER TABLE system_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_fee_collections ENABLE ROW LEVEL SECURITY;

-- Políticas para system_fees (apenas admins podem ver/editar)
DROP POLICY IF EXISTS "Only admins can view system fees" ON system_fees;
CREATE POLICY "Only admins can view system fees"
  ON system_fees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'master')
    )
  );

DROP POLICY IF EXISTS "Only admins can update system fees" ON system_fees;
CREATE POLICY "Only admins can update system fees"
  ON system_fees FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'master')
    )
  );

-- Políticas para system_fee_collections
DROP POLICY IF EXISTS "Users can view their own fee collections" ON system_fee_collections;
CREATE POLICY "Users can view their own fee collections"
  ON system_fee_collections FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all fee collections" ON system_fee_collections;
CREATE POLICY "Admins can view all fee collections"
  ON system_fee_collections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'master')
    )
  );

DROP POLICY IF EXISTS "System can insert fee collections" ON system_fee_collections;
CREATE POLICY "System can insert fee collections"
  ON system_fee_collections FOR INSERT
  WITH CHECK (true);

-- 4. Função para calcular taxa do sistema
CREATE OR REPLACE FUNCTION calculate_system_fee(
  p_operation_type VARCHAR(50),
  p_amount DECIMAL(15,2)
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  v_fee_percentage DECIMAL(5,4);
  v_fee_fixed DECIMAL(10,2);
  v_min_fee DECIMAL(10,2);
  v_max_fee DECIMAL(10,2);
  v_calculated_fee DECIMAL(10,2);
BEGIN
  -- Buscar configuração de taxa
  SELECT 
    fee_percentage,
    fee_fixed,
    min_fee,
    max_fee
  INTO 
    v_fee_percentage,
    v_fee_fixed,
    v_min_fee,
    v_max_fee
  FROM system_fees
  WHERE operation_type = p_operation_type
    AND is_active = true;
  
  -- Se não encontrou, retornar 0
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Calcular taxa
  v_calculated_fee := (p_amount * v_fee_percentage) + v_fee_fixed;
  
  -- Aplicar taxa mínima
  IF v_calculated_fee < v_min_fee THEN
    v_calculated_fee := v_min_fee;
  END IF;
  
  -- Aplicar taxa máxima (se configurada)
  IF v_max_fee IS NOT NULL AND v_calculated_fee > v_max_fee THEN
    v_calculated_fee := v_max_fee;
  END IF;
  
  RETURN v_calculated_fee;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. View para relatório de taxas coletadas
CREATE OR REPLACE VIEW system_fee_report AS
SELECT 
  DATE(collected_at) as date,
  operation_type,
  COUNT(*) as total_transactions,
  SUM(transaction_amount) as total_transaction_amount,
  SUM(fee_amount) as total_fees_collected,
  AVG(fee_amount) as avg_fee
FROM system_fee_collections
WHERE status = 'collected'
GROUP BY DATE(collected_at), operation_type
ORDER BY date DESC, operation_type;

-- 6. Verificar instalação
SELECT 
  'system_fees' as tabela,
  COUNT(*) as configuracoes
FROM system_fees
UNION ALL
SELECT 
  'system_fee_collections' as tabela,
  COUNT(*) as total_taxas_coletadas
FROM system_fee_collections;

-- ========================================
-- RESULTADO ESPERADO:
-- ========================================
-- ✅ Tabela system_fees criada com taxas padrão
-- ✅ Tabela system_fee_collections criada
-- ✅ Função calculate_system_fee disponível
-- ✅ View system_fee_report criada
-- ✅ RLS configurado
-- ========================================

SELECT '✅ Sistema de taxas instalado com sucesso!' as status;
