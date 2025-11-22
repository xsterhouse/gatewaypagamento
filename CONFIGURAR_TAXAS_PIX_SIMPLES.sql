-- ========================================
-- CONFIGURAÇÃO RÁPIDA DE TAXAS PIX
-- ========================================
-- Copie e cole este arquivo inteiro no Supabase SQL Editor
-- ========================================

-- 1. Criar tabela de configuração de taxas (se não existir)
CREATE TABLE IF NOT EXISTS system_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type VARCHAR(50) NOT NULL UNIQUE,
  fee_percentage DECIMAL(5,4) DEFAULT 0,
  fee_fixed DECIMAL(10,2) DEFAULT 0.05,
  min_fee DECIMAL(10,2) DEFAULT 0.05,
  max_fee DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 2. Criar tabela para armazenar taxas coletadas (se não existir)
CREATE TABLE IF NOT EXISTS system_fee_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  transaction_id UUID,
  operation_type VARCHAR(50) NOT NULL,
  transaction_amount DECIMAL(15,2) NOT NULL,
  fee_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'collected',
  metadata JSONB,
  collected_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Inserir taxas padrão
INSERT INTO system_fees (operation_type, fee_fixed, fee_percentage, min_fee, description) 
VALUES
  ('pix_send', 0.05, 0.0000, 0.05, 'Taxa do sistema ao enviar PIX'),
  ('pix_receive', 0.05, 0.0000, 0.05, 'Taxa do sistema ao receber PIX')
ON CONFLICT (operation_type) DO UPDATE 
SET 
  fee_fixed = EXCLUDED.fee_fixed,
  fee_percentage = EXCLUDED.fee_percentage,
  min_fee = EXCLUDED.min_fee,
  description = EXCLUDED.description,
  updated_at = NOW();

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_system_fee_collections_user ON system_fee_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_system_fee_collections_operation ON system_fee_collections(operation_type);
CREATE INDEX IF NOT EXISTS idx_system_fee_collections_collected ON system_fee_collections(collected_at DESC);

-- 5. Habilitar RLS
ALTER TABLE system_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_fee_collections ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS para system_fees
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

-- 7. Políticas RLS para system_fee_collections
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

-- 8. Verificar instalação
SELECT 
  'system_fees' as tabela,
  COUNT(*) as registros
FROM system_fees
UNION ALL
SELECT 
  'system_fee_collections' as tabela,
  COUNT(*) as registros
FROM system_fee_collections;

-- ========================================
-- ✅ PRONTO! Taxas configuradas
-- ========================================
-- Taxa padrão: R$ 0,05 por envio de PIX
-- Para alterar: UPDATE system_fees SET fee_fixed = 0.10 WHERE operation_type = 'pix_send';
-- ========================================
