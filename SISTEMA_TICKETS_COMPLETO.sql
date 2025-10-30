-- ==========================================
-- Sistema Completo de Tickets de Suporte
-- ==========================================

-- 1. Criar tabela support_tickets (se não existir)
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  protocol_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  category TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP,
  closed_by UUID REFERENCES users(id)
);

-- Adicionar colunas se não existirem (caso tabela já exista)
DO $$ 
BEGIN
  -- Adicionar protocol_number se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='support_tickets' AND column_name='protocol_number') THEN
    ALTER TABLE support_tickets ADD COLUMN protocol_number TEXT UNIQUE;
  END IF;
  
  -- Adicionar manager_id se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='support_tickets' AND column_name='manager_id') THEN
    ALTER TABLE support_tickets ADD COLUMN manager_id UUID REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  
  -- Adicionar category se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='support_tickets' AND column_name='category') THEN
    ALTER TABLE support_tickets ADD COLUMN category TEXT;
  END IF;
  
  -- Adicionar closed_at se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='support_tickets' AND column_name='closed_at') THEN
    ALTER TABLE support_tickets ADD COLUMN closed_at TIMESTAMP;
  END IF;
  
  -- Adicionar closed_by se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='support_tickets' AND column_name='closed_by') THEN
    ALTER TABLE support_tickets ADD COLUMN closed_by UUID REFERENCES users(id);
  END IF;
  
  -- Adicionar updated_at se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='support_tickets' AND column_name='updated_at') THEN
    ALTER TABLE support_tickets ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
  END IF;
END $$;

-- 2. Criar tabela de respostas
CREATE TABLE IF NOT EXISTS ticket_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP
);

-- 3. Criar índices
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_manager ON support_tickets(manager_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_responses_ticket ON ticket_responses(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_responses_created_at ON ticket_responses(created_at);

-- 4. Função para gerar número de protocolo
-- Formato: CLT-{USER_ID_CURTO}-{NUMERO_SEQUENCIAL}
CREATE OR REPLACE FUNCTION generate_protocol_number(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_short_id TEXT;
  ticket_count INTEGER;
  protocol TEXT;
BEGIN
  -- Pegar primeiros 8 caracteres do UUID do usuário
  user_short_id := SUBSTRING(p_user_id::TEXT FROM 1 FOR 8);
  
  -- Contar quantos tickets o usuário já tem
  SELECT COUNT(*) + 1 INTO ticket_count
  FROM support_tickets
  WHERE user_id = p_user_id;
  
  -- Gerar protocolo: CLT-{USER_ID}-{NUMERO}
  protocol := 'CLT-' || user_short_id || '-' || LPAD(ticket_count::TEXT, 4, '0');
  
  RETURN protocol;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger para gerar protocolo automaticamente
CREATE OR REPLACE FUNCTION set_protocol_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.protocol_number IS NULL THEN
    NEW.protocol_number := generate_protocol_number(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_protocol_number ON support_tickets;
CREATE TRIGGER trigger_set_protocol_number
BEFORE INSERT ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION set_protocol_number();

-- 6. Trigger para atualizar timestamp
CREATE OR REPLACE FUNCTION update_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ticket_timestamp ON support_tickets;
CREATE TRIGGER trigger_update_ticket_timestamp
BEFORE UPDATE ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION update_ticket_timestamp();

-- 7. Função para atribuir ticket ao gerente do cliente
CREATE OR REPLACE FUNCTION assign_ticket_to_manager()
RETURNS TRIGGER AS $$
DECLARE
  client_manager_id UUID;
BEGIN
  -- Buscar gerente do cliente
  SELECT manager_id INTO client_manager_id
  FROM manager_clients
  WHERE client_id = NEW.user_id
  LIMIT 1;
  
  -- Atribuir ao gerente
  IF client_manager_id IS NOT NULL THEN
    NEW.manager_id := client_manager_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_assign_ticket_to_manager ON support_tickets;
CREATE TRIGGER trigger_assign_ticket_to_manager
BEFORE INSERT ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION assign_ticket_to_manager();

-- 8. Desabilitar RLS para visualização
ALTER TABLE support_tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_responses DISABLE ROW LEVEL SECURITY;

-- 9. Criar view para estatísticas de tickets
CREATE OR REPLACE VIEW ticket_statistics AS
SELECT 
  status,
  COUNT(*) as total,
  COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority,
  COUNT(CASE WHEN priority = 'medium' THEN 1 END) as medium_priority,
  COUNT(CASE WHEN priority = 'low' THEN 1 END) as low_priority,
  AVG(EXTRACT(EPOCH FROM (COALESCE(closed_at, NOW()) - created_at))/3600) as avg_resolution_hours
FROM support_tickets
GROUP BY status;

-- ==========================================
-- Consultas Úteis
-- ==========================================

-- Ver todos os tickets
SELECT 
  st.protocol_number,
  u.name as cliente,
  m.name as gerente,
  st.subject,
  st.status,
  st.priority,
  st.created_at,
  (SELECT COUNT(*) FROM ticket_responses WHERE ticket_id = st.id) as total_respostas
FROM support_tickets st
LEFT JOIN users u ON u.id = st.user_id
LEFT JOIN users m ON m.id = st.manager_id
ORDER BY st.created_at DESC
LIMIT 20;

-- Ver estatísticas
SELECT * FROM ticket_statistics;

-- Ver tickets por gerente
SELECT 
  m.name as gerente,
  COUNT(*) as total_tickets,
  COUNT(CASE WHEN st.status = 'open' THEN 1 END) as abertos,
  COUNT(CASE WHEN st.status = 'resolved' THEN 1 END) as resolvidos
FROM support_tickets st
JOIN users m ON m.id = st.manager_id
GROUP BY m.name
ORDER BY total_tickets DESC;
