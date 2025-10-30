-- ==========================================
-- Fix: Desabilitar RLS em ticket_responses
-- ==========================================

-- 1. Desabilitar RLS
ALTER TABLE ticket_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets DISABLE ROW LEVEL SECURITY;

-- 2. Verificar se tabelas existem
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename IN ('ticket_responses', 'support_tickets');

-- 3. Ver estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'ticket_responses'
ORDER BY ordinal_position;

-- 4. Testar inserção manual
-- Substitua os UUIDs pelos reais
/*
INSERT INTO ticket_responses (ticket_id, user_id, message, is_admin)
VALUES (
  'uuid-do-ticket',
  'uuid-do-usuario',
  'Teste de mensagem',
  TRUE
);
*/

-- 5. Ver todas as respostas
SELECT 
  tr.id,
  tr.message,
  tr.is_admin,
  tr.created_at,
  u.name as usuario
FROM ticket_responses tr
LEFT JOIN users u ON u.id = tr.user_id
ORDER BY tr.created_at DESC
LIMIT 10;
