-- ============================================
-- CRIAR/ATUALIZAR TABELA DE MENSAGENS DE TICKETS
-- Sistema de Chat Gerente-Cliente (SAFE MODE)
-- Pode ser executado múltiplas vezes sem erro
-- ============================================

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices (IF NOT EXISTS disponível no PostgreSQL 9.5+)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ticket_messages_ticket_id') THEN
    CREATE INDEX idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ticket_messages_created_at') THEN
    CREATE INDEX idx_ticket_messages_created_at ON ticket_messages(created_at);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ticket_messages_user_id') THEN
    CREATE INDEX idx_ticket_messages_user_id ON ticket_messages(user_id);
  END IF;
END $$;

-- ============================================
-- CONFIGURAR ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas se existirem e recriar
DROP POLICY IF EXISTS "users_view_own_ticket_messages" ON ticket_messages;
DROP POLICY IF EXISTS "users_send_messages" ON ticket_messages;
DROP POLICY IF EXISTS "admins_view_all_messages" ON ticket_messages;
DROP POLICY IF EXISTS "admins_send_messages" ON ticket_messages;

-- Policy: Cliente vê mensagens dos seus tickets
CREATE POLICY "users_view_own_ticket_messages"
ON ticket_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM support_tickets 
    WHERE id = ticket_messages.ticket_id 
    AND user_id = auth.uid()
  )
);

-- Policy: Cliente pode enviar mensagens nos seus tickets
CREATE POLICY "users_send_messages"
ON ticket_messages FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND is_admin = false
  AND EXISTS (
    SELECT 1 FROM support_tickets 
    WHERE id = ticket_id 
    AND user_id = auth.uid()
  )
);

-- Policy: Admin vê todas as mensagens
CREATE POLICY "admins_view_all_messages"
ON ticket_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Policy: Admin pode enviar mensagens em qualquer ticket
CREATE POLICY "admins_send_messages"
ON ticket_messages FOR INSERT
WITH CHECK (
  is_admin = true
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- ============================================
-- MIGRAR DADOS ANTIGOS (SE NECESSÁRIO)
-- ============================================

-- Se você tinha ticket_responses, pode migrar para ticket_messages
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ticket_responses') THEN
    -- Migrar dados antigos
    INSERT INTO ticket_messages (ticket_id, user_id, message, is_admin, created_at)
    SELECT 
      ticket_id, 
      user_id, 
      message, 
      is_admin, 
      created_at
    FROM ticket_responses
    WHERE NOT EXISTS (
      SELECT 1 FROM ticket_messages tm 
      WHERE tm.ticket_id = ticket_responses.ticket_id 
      AND tm.message = ticket_responses.message
      AND tm.created_at = ticket_responses.created_at
    );
    
    RAISE NOTICE 'Dados migrados de ticket_responses para ticket_messages';
  END IF;
END $$;

-- ============================================
-- VERIFICAR CRIAÇÃO
-- ============================================

-- Ver estrutura da tabela
SELECT 
  'Estrutura da tabela ticket_messages:' as info;

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'ticket_messages'
ORDER BY ordinal_position;

-- Ver policies criadas
SELECT 
  'Policies da tabela ticket_messages:' as info;

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename = 'ticket_messages'
ORDER BY policyname;

-- Contar mensagens
SELECT 
  'Total de mensagens:' as info,
  COUNT(*) as total_mensagens 
FROM ticket_messages;

-- Ver últimas 5 mensagens
SELECT 
  'Últimas 5 mensagens:' as info;

SELECT 
  tm.id,
  tm.message,
  tm.is_admin,
  tm.created_at,
  CASE 
    WHEN tm.is_admin THEN 'Admin'
    ELSE 'Cliente'
  END as tipo
FROM ticket_messages tm
ORDER BY tm.created_at DESC
LIMIT 5;

SELECT '✅ Tabela ticket_messages criada/atualizada com sucesso!' as status;
