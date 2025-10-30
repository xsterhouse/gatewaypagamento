-- ==========================================
-- Ativar TODOS os Triggers de Logs
-- ==========================================

-- ====================
-- 1. AUTENTICAÇÃO
-- ====================

-- Tabela para rastrear logins (opcional)
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  login_at TIMESTAMP DEFAULT NOW(),
  logout_at TIMESTAMP,
  ip_address TEXT,
  user_agent TEXT
);

-- Função para registrar login manualmente (chamar no código)
CREATE OR REPLACE FUNCTION register_login(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  session_id UUID;
  user_info RECORD;
BEGIN
  -- Buscar info do usuário
  SELECT name, email, role INTO user_info
  FROM users WHERE id = p_user_id;
  
  -- Inserir sessão
  INSERT INTO user_sessions (user_id)
  VALUES (p_user_id)
  RETURNING id INTO session_id;
  
  -- Registrar log
  PERFORM log_activity(
    p_user_id,
    NULL,
    'login',
    'auth',
    format('%s fez login no sistema', user_info.name),
    jsonb_build_object(
      'email', user_info.email,
      'role', user_info.role
    )
  );
  
  RETURN session_id;
END;
$$ LANGUAGE plpgsql;

-- Função para registrar logout
CREATE OR REPLACE FUNCTION register_logout(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  user_info RECORD;
  session_id UUID;
BEGIN
  SELECT name INTO user_info FROM users WHERE id = p_user_id;
  
  -- Buscar última sessão ativa
  SELECT id INTO session_id
  FROM user_sessions
  WHERE user_id = p_user_id 
    AND logout_at IS NULL
  ORDER BY login_at DESC
  LIMIT 1;
  
  -- Atualizar sessão
  IF session_id IS NOT NULL THEN
    UPDATE user_sessions 
    SET logout_at = NOW()
    WHERE id = session_id;
  END IF;
  
  -- Registrar log
  PERFORM log_activity(
    p_user_id,
    NULL,
    'logout',
    'auth',
    format('%s fez logout do sistema', user_info.name),
    NULL
  );
END;
$$ LANGUAGE plpgsql;

-- ====================
-- 2. GESTÃO DE USUÁRIOS
-- ====================

-- Trigger: Atualização de email
CREATE OR REPLACE FUNCTION log_user_email_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email != OLD.email THEN
    PERFORM log_activity(
      NEW.id,
      NULL,
      'user_email_change',
      'user_management',
      format('Email alterado de %s para %s', OLD.email, NEW.email),
      jsonb_build_object(
        'old_email', OLD.email,
        'new_email', NEW.email
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_email_change
AFTER UPDATE ON users
FOR EACH ROW
WHEN (OLD.email IS DISTINCT FROM NEW.email)
EXECUTE FUNCTION log_user_email_change();

-- Trigger: Alteração de role
CREATE OR REPLACE FUNCTION log_user_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role != OLD.role THEN
    PERFORM log_activity(
      NEW.id,
      NULL,
      'user_role_change',
      'user_management',
      format('Função alterada de %s para %s', OLD.role, NEW.role),
      jsonb_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_role_change
AFTER UPDATE ON users
FOR EACH ROW
WHEN (OLD.role IS DISTINCT FROM NEW.role)
EXECUTE FUNCTION log_user_role_change();

-- Trigger: Deleção de usuário
CREATE OR REPLACE FUNCTION log_user_deleted()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_activity(
    NULL,
    NULL,
    'user_delete',
    'user_management',
    format('Usuário deletado: %s (%s)', OLD.name, OLD.email),
    jsonb_build_object(
      'deleted_user_id', OLD.id,
      'name', OLD.name,
      'email', OLD.email,
      'role', OLD.role
    )
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_deleted
BEFORE DELETE ON users
FOR EACH ROW
EXECUTE FUNCTION log_user_deleted();

-- ====================
-- 3. KYC (Já existente, mantendo)
-- ====================
-- Triggers de KYC já foram criados anteriormente

-- ====================
-- 4. TRANSAÇÕES
-- ====================

-- Verificar se tabela transactions existe, se não, criar estrutura básica
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Trigger: Nova transação
CREATE OR REPLACE FUNCTION log_transaction_created()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
BEGIN
  SELECT name INTO user_name FROM users WHERE id = NEW.user_id;
  
  PERFORM log_activity(
    NEW.user_id,
    NULL,
    'transaction_create',
    'transaction',
    format('%s - %s de R$ %s',
      user_name,
      CASE NEW.type
        WHEN 'credit' THEN 'Crédito'
        WHEN 'debit' THEN 'Débito'
        WHEN 'pix_send' THEN 'PIX Enviado'
        WHEN 'pix_receive' THEN 'PIX Recebido'
        ELSE NEW.type
      END,
      TO_CHAR(NEW.amount, 'FM999,999,990.00')
    ),
    jsonb_build_object(
      'transaction_id', NEW.id,
      'type', NEW.type,
      'amount', NEW.amount,
      'description', NEW.description,
      'status', NEW.status
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_transaction_created ON transactions;
CREATE TRIGGER trigger_transaction_created
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION log_transaction_created();

-- Trigger: Status da transação alterado
CREATE OR REPLACE FUNCTION log_transaction_status_change()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
BEGIN
  IF NEW.status != OLD.status THEN
    SELECT name INTO user_name FROM users WHERE id = NEW.user_id;
    
    PERFORM log_activity(
      NEW.user_id,
      NULL,
      'transaction_status_change',
      'transaction',
      format('%s - Transação %s: %s → %s',
        user_name,
        TO_CHAR(NEW.amount, 'R$ FM999,999,990.00'),
        OLD.status,
        NEW.status
      ),
      jsonb_build_object(
        'transaction_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'amount', NEW.amount
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_transaction_status_change ON transactions;
CREATE TRIGGER trigger_transaction_status_change
AFTER UPDATE ON transactions
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION log_transaction_status_change();

-- ====================
-- 5. CONFIGURAÇÕES
-- ====================

-- Verificar se tabela system_settings existe
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  setting_type TEXT NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Trigger: Alteração de configuração
CREATE OR REPLACE FUNCTION log_settings_change()
RETURNS TRIGGER AS $$
DECLARE
  admin_name TEXT;
BEGIN
  IF NEW.updated_by IS NOT NULL THEN
    SELECT name INTO admin_name FROM users WHERE id = NEW.updated_by;
  END IF;
  
  PERFORM log_activity(
    NULL,
    NEW.updated_by,
    'settings_change',
    'settings',
    format('Configuração "%s" alterada por %s',
      NEW.setting_key,
      COALESCE(admin_name, 'Sistema')
    ),
    jsonb_build_object(
      'setting_key', NEW.setting_key,
      'old_value', OLD.setting_value,
      'new_value', NEW.setting_value,
      'setting_type', NEW.setting_type
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_settings_change ON system_settings;
CREATE TRIGGER trigger_settings_change
AFTER UPDATE ON system_settings
FOR EACH ROW
WHEN (OLD.setting_value IS DISTINCT FROM NEW.setting_value)
EXECUTE FUNCTION log_settings_change();

-- Trigger: Nova configuração criada
CREATE OR REPLACE FUNCTION log_settings_created()
RETURNS TRIGGER AS $$
DECLARE
  admin_name TEXT;
BEGIN
  IF NEW.updated_by IS NOT NULL THEN
    SELECT name INTO admin_name FROM users WHERE id = NEW.updated_by;
  END IF;
  
  PERFORM log_activity(
    NULL,
    NEW.updated_by,
    'settings_create',
    'settings',
    format('Nova configuração "%s" criada por %s',
      NEW.setting_key,
      COALESCE(admin_name, 'Sistema')
    ),
    jsonb_build_object(
      'setting_key', NEW.setting_key,
      'setting_value', NEW.setting_value
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_settings_created ON system_settings;
CREATE TRIGGER trigger_settings_created
AFTER INSERT ON system_settings
FOR EACH ROW
EXECUTE FUNCTION log_settings_created();

-- ====================
-- 6. ADMINISTRAÇÃO
-- ====================

-- Trigger: Gerente atribuído a cliente
CREATE OR REPLACE FUNCTION log_manager_assignment()
RETURNS TRIGGER AS $$
DECLARE
  manager_name TEXT;
  client_name TEXT;
BEGIN
  SELECT name INTO manager_name FROM users WHERE id = NEW.manager_id;
  SELECT name INTO client_name FROM users WHERE id = NEW.client_id;
  
  PERFORM log_activity(
    NEW.client_id,
    NEW.manager_id,
    'manager_assign',
    'admin',
    format('Cliente %s atribuído ao gerente %s',
      client_name,
      manager_name
    ),
    jsonb_build_object(
      'manager_id', NEW.manager_id,
      'manager_name', manager_name,
      'client_id', NEW.client_id,
      'client_name', client_name
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_manager_assignment ON manager_clients;
CREATE TRIGGER trigger_manager_assignment
AFTER INSERT ON manager_clients
FOR EACH ROW
EXECUTE FUNCTION log_manager_assignment();

-- Trigger: Notificação enviada
CREATE OR REPLACE FUNCTION log_notification_sent()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
BEGIN
  SELECT name INTO user_name FROM users WHERE id = NEW.user_id;
  
  PERFORM log_activity(
    NEW.user_id,
    NULL,
    'notification_sent',
    'admin',
    format('Notificação enviada para %s: %s',
      user_name,
      NEW.title
    ),
    jsonb_build_object(
      'notification_id', NEW.id,
      'title', NEW.title,
      'type', NEW.type
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notification_sent ON notifications;
CREATE TRIGGER trigger_notification_sent
AFTER INSERT ON notifications
FOR EACH ROW
EXECUTE FUNCTION log_notification_sent();

-- ====================
-- 7. SUPORTE
-- ====================

-- Trigger: Novo ticket criado
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

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
      NEW.title
    ),
    jsonb_build_object(
      'ticket_id', NEW.id,
      'title', NEW.title,
      'priority', NEW.priority
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ticket_created ON support_tickets;
CREATE TRIGGER trigger_ticket_created
AFTER INSERT ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION log_ticket_created();

-- Trigger: Status do ticket alterado
CREATE OR REPLACE FUNCTION log_ticket_status_change()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
BEGIN
  IF NEW.status != OLD.status THEN
    SELECT name INTO user_name FROM users WHERE id = NEW.user_id;
    
    PERFORM log_activity(
      NEW.user_id,
      NULL,
      'ticket_status_change',
      'admin',
      format('Ticket de %s alterado: %s → %s',
        user_name,
        OLD.status,
        NEW.status
      ),
      jsonb_build_object(
        'ticket_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ticket_status_change ON support_tickets;
CREATE TRIGGER trigger_ticket_status_change
AFTER UPDATE ON support_tickets
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION log_ticket_status_change();

-- ==========================================
-- Inserir configurações de exemplo
-- ==========================================

INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('pix_send_fee_percentage', '0.5', 'percentage', 'Taxa percentual para envio via PIX'),
('pix_receive_fee_percentage', '0', 'percentage', 'Taxa percentual para recebimento via PIX'),
('interest_rate_monthly', '0.8', 'percentage', 'Taxa de juros mensal')
ON CONFLICT (setting_key) DO NOTHING;

-- ==========================================
-- Resumo Final
-- ==========================================

SELECT 'Todos os triggers foram ativados!' as status;

-- Ver categorias de logs disponíveis
SELECT DISTINCT action_category, COUNT(*) as total
FROM activity_logs
GROUP BY action_category
ORDER BY total DESC;
