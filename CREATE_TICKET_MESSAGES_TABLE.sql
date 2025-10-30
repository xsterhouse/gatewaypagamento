-- ============================================
-- CRIAR TABELA DE MENSAGENS DE TICKETS
-- Sistema de Chat Gerente-Cliente
-- ============================================

-- Criar tabela de mensagens
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at ON ticket_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_user_id ON ticket_messages(user_id);

-- ============================================
-- CONFIGURAR ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

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
-- DADOS DE TESTE (OPCIONAL)
-- ============================================

-- Descomente para criar dados de teste
/*
-- Inserir mensagem inicial de um ticket existente
INSERT INTO ticket_messages (ticket_id, user_id, message, is_admin)
SELECT 
  st.id,
  st.user_id,
  st.message,
  false
FROM support_tickets st
WHERE NOT EXISTS (
  SELECT 1 FROM ticket_messages tm 
  WHERE tm.ticket_id = st.id
);

-- Exemplo: Admin responde um ticket
INSERT INTO ticket_messages (
  ticket_id, 
  user_id, 
  message, 
  is_admin
) VALUES (
  'uuid-do-ticket',
  'uuid-do-admin',
  'Olá! Recebi sua mensagem e vou verificar. Em breve retorno com uma solução.',
  true
);
*/

-- ============================================
-- VERIFICAR CRIAÇÃO
-- ============================================

-- Ver estrutura da tabela
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'ticket_messages'
ORDER BY ordinal_position;

-- Ver policies criadas
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'ticket_messages';

-- Contar mensagens (deve estar vazio se nova instalação)
SELECT COUNT(*) as total_mensagens FROM ticket_messages;

COMMIT;
