-- ========================================
-- SISTEMA DE CHECKOUT E LINKS DE PAGAMENTO
-- ========================================
-- Sistema completo para clientes criarem links de pagamento
-- para suas lojas virtuais e vendas

-- 1. Criar tabela de links de pagamento
CREATE TABLE IF NOT EXISTS payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Proprietário
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Informações do produto/serviço
  title VARCHAR(255) NOT NULL, -- Nome do produto/serviço
  description TEXT, -- Descrição detalhada
  
  -- Configuração de preço
  price_type VARCHAR(20) NOT NULL DEFAULT 'fixed', -- 'fixed' ou 'variable'
  amount DECIMAL(15,2), -- Valor fixo (se price_type = 'fixed')
  min_amount DECIMAL(15,2), -- Valor mínimo (se price_type = 'variable')
  max_amount DECIMAL(15,2), -- Valor máximo (se price_type = 'variable')
  
  -- Configurações
  allow_quantity BOOLEAN DEFAULT false, -- Permitir escolher quantidade
  max_quantity INTEGER DEFAULT 1, -- Quantidade máxima
  
  -- Personalização
  image_url TEXT, -- URL da imagem do produto
  success_message TEXT, -- Mensagem após pagamento
  redirect_url TEXT, -- URL para redirecionar após pagamento
  
  -- Link único
  slug VARCHAR(100) UNIQUE NOT NULL, -- URL amigável (ex: meu-produto)
  short_code VARCHAR(20) UNIQUE, -- Código curto (ex: ABC123)
  
  -- Status e controle
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ, -- Data de expiração (opcional)
  max_uses INTEGER, -- Número máximo de usos (opcional)
  current_uses INTEGER DEFAULT 0, -- Contador de usos
  
  -- Estatísticas
  total_amount DECIMAL(15,2) DEFAULT 0, -- Total arrecadado
  total_transactions INTEGER DEFAULT 0, -- Total de transações
  
  -- Metadados
  metadata JSONB DEFAULT '{}',
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_price_type CHECK (price_type IN ('fixed', 'variable')),
  CONSTRAINT valid_fixed_amount CHECK (
    (price_type = 'fixed' AND amount > 0) OR 
    (price_type = 'variable')
  ),
  CONSTRAINT valid_variable_amounts CHECK (
    (price_type = 'variable' AND min_amount > 0 AND max_amount >= min_amount) OR 
    (price_type = 'fixed')
  )
);

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_payment_links_user ON payment_links(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_slug ON payment_links(slug);
CREATE INDEX IF NOT EXISTS idx_payment_links_short_code ON payment_links(short_code);
CREATE INDEX IF NOT EXISTS idx_payment_links_active ON payment_links(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_links_created ON payment_links(created_at DESC);

-- 3. Criar tabela de transações de checkout
CREATE TABLE IF NOT EXISTS checkout_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamentos
  payment_link_id UUID NOT NULL REFERENCES payment_links(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id), -- Cliente que criou o link
  pix_transaction_id UUID REFERENCES pix_transactions(id), -- Transação PIX associada
  
  -- Dados do pagador
  payer_name VARCHAR(255),
  payer_email VARCHAR(255),
  payer_phone VARCHAR(20),
  payer_document VARCHAR(20),
  
  -- Dados da compra
  quantity INTEGER DEFAULT 1,
  unit_amount DECIMAL(15,2) NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  fee_amount DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(15,2) NOT NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'expired', 'cancelled'
  
  -- Dados PIX
  pix_code TEXT,
  pix_qr_code TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Metadados
  metadata JSONB DEFAULT '{}',
  
  CONSTRAINT valid_checkout_status CHECK (status IN ('pending', 'paid', 'expired', 'cancelled')),
  CONSTRAINT positive_amounts CHECK (
    quantity > 0 AND 
    unit_amount > 0 AND 
    total_amount > 0
  )
);

-- 4. Criar índices para transações
CREATE INDEX IF NOT EXISTS idx_checkout_trans_link ON checkout_transactions(payment_link_id);
CREATE INDEX IF NOT EXISTS idx_checkout_trans_user ON checkout_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_checkout_trans_status ON checkout_transactions(status);
CREATE INDEX IF NOT EXISTS idx_checkout_trans_created ON checkout_transactions(created_at DESC);

-- 5. Função para gerar slug único
CREATE OR REPLACE FUNCTION generate_unique_slug(base_slug TEXT)
RETURNS TEXT AS $$
DECLARE
  new_slug TEXT;
  counter INTEGER := 0;
BEGIN
  new_slug := base_slug;
  
  WHILE EXISTS (SELECT 1 FROM payment_links WHERE slug = new_slug) LOOP
    counter := counter + 1;
    new_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN new_slug;
END;
$$ LANGUAGE plpgsql;

-- 6. Função para gerar código curto único
CREATE OR REPLACE FUNCTION generate_short_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  
  -- Verificar se já existe
  WHILE EXISTS (SELECT 1 FROM payment_links WHERE short_code = result) LOOP
    result := '';
    FOR i IN 1..8 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger para atualizar estatísticas do link
CREATE OR REPLACE FUNCTION update_payment_link_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    UPDATE payment_links
    SET 
      current_uses = current_uses + 1,
      total_transactions = total_transactions + 1,
      total_amount = total_amount + NEW.total_amount,
      updated_at = NOW()
    WHERE id = NEW.payment_link_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payment_link_stats
  AFTER INSERT OR UPDATE ON checkout_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_link_stats();

-- 8. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_payment_link_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payment_link_timestamp
  BEFORE UPDATE ON payment_links
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_link_timestamp();

-- 9. Políticas RLS para payment_links
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver seus próprios links
CREATE POLICY "Users can view own payment links"
  ON payment_links FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Qualquer um pode ver links ativos (para página pública)
CREATE POLICY "Anyone can view active payment links"
  ON payment_links FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Usuários podem criar seus próprios links
CREATE POLICY "Users can create own payment links"
  ON payment_links FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Usuários podem atualizar seus próprios links
CREATE POLICY "Users can update own payment links"
  ON payment_links FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Usuários podem deletar seus próprios links
CREATE POLICY "Users can delete own payment links"
  ON payment_links FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Admins podem ver todos os links
CREATE POLICY "Admins can view all payment links"
  ON payment_links FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- 10. Políticas RLS para checkout_transactions
ALTER TABLE checkout_transactions ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver transações de seus links
CREATE POLICY "Users can view own checkout transactions"
  ON checkout_transactions FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM payment_links 
      WHERE payment_links.id = checkout_transactions.payment_link_id 
      AND payment_links.user_id = auth.uid()
    )
  );

-- Qualquer um pode criar transações (para checkout público)
CREATE POLICY "Anyone can create checkout transactions"
  ON checkout_transactions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Sistema pode atualizar transações
CREATE POLICY "System can update checkout transactions"
  ON checkout_transactions FOR UPDATE
  TO authenticated
  USING (true);

-- Admins podem ver todas as transações
CREATE POLICY "Admins can view all checkout transactions"
  ON checkout_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- 11. View de estatísticas de links
CREATE OR REPLACE VIEW payment_link_statistics AS
SELECT 
  pl.id,
  pl.user_id,
  pl.title,
  pl.slug,
  pl.is_active,
  pl.current_uses,
  pl.max_uses,
  pl.total_amount,
  pl.total_transactions,
  COUNT(ct.id) as pending_transactions,
  COUNT(CASE WHEN ct.status = 'paid' THEN 1 END) as paid_transactions,
  COALESCE(SUM(CASE WHEN ct.status = 'paid' THEN ct.total_amount END), 0) as confirmed_amount,
  MAX(ct.created_at) as last_transaction_at
FROM payment_links pl
LEFT JOIN checkout_transactions ct ON ct.payment_link_id = pl.id
GROUP BY pl.id, pl.user_id, pl.title, pl.slug, pl.is_active, 
         pl.current_uses, pl.max_uses, pl.total_amount, pl.total_transactions;

-- 12. Comentários
COMMENT ON TABLE payment_links IS 'Links de pagamento criados pelos clientes para suas vendas';
COMMENT ON TABLE checkout_transactions IS 'Transações realizadas através dos links de pagamento';
COMMENT ON VIEW payment_link_statistics IS 'Estatísticas agregadas por link de pagamento';

-- ========================================
-- FIM DO SCRIPT
-- ========================================
-- Execute este script no Supabase SQL Editor
-- Após executar, você terá:
-- ✅ Sistema de links de pagamento
-- ✅ Checkout público funcional
-- ✅ Estatísticas em tempo real
-- ✅ Políticas RLS configuradas
-- ✅ Triggers automáticos
