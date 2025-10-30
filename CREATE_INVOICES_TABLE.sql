-- ============================================
-- CRIAR TABELA DE FATURAS (INVOICES)
-- Sistema de Gestão Financeira
-- ============================================

-- Criar tabela de faturas
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  description TEXT,
  invoice_number TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);

-- Função para gerar número de fatura automático
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(NEXTVAL('invoice_number_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar sequência para números de fatura
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

-- Trigger para gerar número de fatura
DROP TRIGGER IF EXISTS set_invoice_number ON invoices;
CREATE TRIGGER set_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION generate_invoice_number();

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para marcar faturas vencidas automaticamente
CREATE OR REPLACE FUNCTION mark_overdue_invoices()
RETURNS void AS $$
BEGIN
  UPDATE invoices
  SET status = 'overdue'
  WHERE status = 'pending'
  AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- CONFIGURAR ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "users_view_own_invoices" ON invoices;
DROP POLICY IF EXISTS "admins_view_all_invoices" ON invoices;
DROP POLICY IF EXISTS "admins_create_invoices" ON invoices;
DROP POLICY IF EXISTS "admins_update_invoices" ON invoices;
DROP POLICY IF EXISTS "admins_delete_invoices" ON invoices;

-- Policy: Cliente vê apenas suas faturas
CREATE POLICY "users_view_own_invoices"
ON invoices FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Admin vê todas as faturas
CREATE POLICY "admins_view_all_invoices"
ON invoices FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Admin pode criar faturas
CREATE POLICY "admins_create_invoices"
ON invoices FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Admin pode atualizar faturas
CREATE POLICY "admins_update_invoices"
ON invoices FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Admin pode deletar faturas
CREATE POLICY "admins_delete_invoices"
ON invoices FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- DADOS DE TESTE (OPCIONAL)
-- ============================================

-- Descomente para criar dados de teste
/*
-- Inserir faturas de exemplo
INSERT INTO invoices (user_id, amount, due_date, status, description) VALUES
  ((SELECT id FROM users WHERE role = 'user' LIMIT 1), 150.00, CURRENT_DATE + INTERVAL '30 days', 'pending', 'Mensalidade - Plano Básico'),
  ((SELECT id FROM users WHERE role = 'user' LIMIT 1), 200.00, CURRENT_DATE + INTERVAL '15 days', 'pending', 'Taxa de Serviço'),
  ((SELECT id FROM users WHERE role = 'user' LIMIT 1), 100.00, CURRENT_DATE - INTERVAL '5 days', 'overdue', 'Mensalidade Atrasada'),
  ((SELECT id FROM users WHERE role = 'user' LIMIT 1), 180.00, CURRENT_DATE - INTERVAL '30 days', 'paid', 'Mensalidade - Plano Premium');
*/

-- ============================================
-- VERIFICAR CRIAÇÃO
-- ============================================

-- Ver estrutura da tabela
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'invoices'
ORDER BY ordinal_position;

-- Ver policies criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename = 'invoices'
ORDER BY policyname;

-- Contar faturas
SELECT 
  status,
  COUNT(*) as total,
  SUM(amount) as total_amount
FROM invoices
GROUP BY status;

SELECT '✅ Tabela invoices criada com sucesso!' as status;

COMMIT;
