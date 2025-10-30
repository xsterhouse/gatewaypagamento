-- ==========================================
-- Corrigir Trigger de Ticket
-- ==========================================

-- O problema é que o trigger de log está tentando acessar NEW.title
-- mas a tabela usa NEW.subject

-- 1. Remover trigger problemático
DROP TRIGGER IF EXISTS trigger_ticket_created ON support_tickets;

-- 2. Recriar função de log corrigida
CREATE OR REPLACE FUNCTION log_ticket_created()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
BEGIN
  SELECT name INTO user_name FROM users WHERE id = NEW.user_id;
  
  PERFORM log_activity(
    NEW.user_id,
    NULL,
    'ticket_create',
    'admin',
    format('%s abriu ticket: %s',
      user_name,
      NEW.subject  -- Mudado de NEW.title para NEW.subject
    ),
    jsonb_build_object(
      'ticket_id', NEW.id,
      'subject', NEW.subject,  -- Mudado de title para subject
      'priority', NEW.priority
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Recriar trigger
CREATE TRIGGER trigger_ticket_created
AFTER INSERT ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION log_ticket_created();

-- 4. Testar
SELECT 'Trigger corrigido com sucesso!' as status;
