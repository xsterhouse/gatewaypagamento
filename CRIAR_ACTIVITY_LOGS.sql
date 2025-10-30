-- ==========================================
-- Script SQL: Sistema de Logs de Atividades
-- ==========================================

-- 1. Criar tabela de logs de atividades
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  action_category TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_admin ON activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_category ON activity_logs(action_category);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON activity_logs(action_type);

-- 3. Função para registrar log de atividade
CREATE OR REPLACE FUNCTION log_activity(
  p_user_id UUID,
  p_admin_id UUID,
  p_action_type TEXT,
  p_action_category TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO activity_logs (
    user_id,
    admin_id,
    action_type,
    action_category,
    description,
    metadata
  ) VALUES (
    p_user_id,
    p_admin_id,
    p_action_type,
    p_action_category,
    p_description,
    p_metadata
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger: Log de login de usuário
CREATE OR REPLACE FUNCTION log_user_login()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_activity(
    NEW.id,
    NULL,
    'login',
    'auth',
    'Usuário fez login no sistema',
    jsonb_build_object('email', NEW.email, 'role', NEW.role)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger: Log de criação de usuário
CREATE OR REPLACE FUNCTION log_user_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_activity(
    NEW.id,
    NULL,
    'user_create',
    'user_management',
    format('Novo usuário criado: %s', NEW.name),
    jsonb_build_object('email', NEW.email, 'role', NEW.role)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_created
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION log_user_created();

-- 6. Trigger: Log de atualização de status de usuário
CREATE OR REPLACE FUNCTION log_user_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    PERFORM log_activity(
      NEW.id,
      NULL,
      CASE 
        WHEN NEW.status = 'suspended' THEN 'user_suspend'
        WHEN NEW.status = 'active' THEN 'user_activate'
        WHEN NEW.status = 'blocked' THEN 'user_block'
        ELSE 'user_status_change'
      END,
      'user_management',
      format('Status alterado de %s para %s', OLD.status, NEW.status),
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'suspension_reason', NEW.suspension_reason
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_status_change
AFTER UPDATE ON users
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION log_user_status_change();

-- 7. Trigger: Log de aprovação/rejeição de KYC
CREATE OR REPLACE FUNCTION log_kyc_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.kyc_status != OLD.kyc_status THEN
    PERFORM log_activity(
      NEW.id,
      NULL,
      CASE 
        WHEN NEW.kyc_status = 'approved' THEN 'kyc_approve'
        WHEN NEW.kyc_status = 'rejected' THEN 'kyc_reject'
        ELSE 'kyc_status_change'
      END,
      'kyc',
      format('KYC %s', 
        CASE 
          WHEN NEW.kyc_status = 'approved' THEN 'aprovado'
          WHEN NEW.kyc_status = 'rejected' THEN 'rejeitado'
          ELSE NEW.kyc_status
        END
      ),
      jsonb_build_object(
        'old_status', OLD.kyc_status,
        'new_status', NEW.kyc_status,
        'rejection_reason', NEW.kyc_rejection_reason
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_kyc_status_change
AFTER UPDATE ON users
FOR EACH ROW
WHEN (OLD.kyc_status IS DISTINCT FROM NEW.kyc_status)
EXECUTE FUNCTION log_kyc_status_change();

-- 8. Trigger: Log de transações (OPCIONAL - apenas se a tabela transactions existir)
-- Descomente se você tiver a tabela transactions
/*
CREATE OR REPLACE FUNCTION log_transaction_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_activity(
    NEW.user_id,
    NULL,
    'transaction',
    'transaction',
    format('%s de R$ %s',
      CASE NEW.type
        WHEN 'credit' THEN 'Crédito'
        WHEN 'debit' THEN 'Débito'
        ELSE NEW.type
      END,
      NEW.amount
    ),
    jsonb_build_object(
      'type', NEW.type,
      'amount', NEW.amount,
      'description', NEW.description,
      'status', NEW.status
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_transaction_created
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION log_transaction_created();
*/

-- 9. Trigger: Log de alteração de saldo (OPCIONAL - apenas se a coluna balance existir)
-- Descomente se sua tabela users tiver a coluna balance
/*
CREATE OR REPLACE FUNCTION log_balance_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.balance != OLD.balance THEN
    PERFORM log_activity(
      NEW.id,
      NULL,
      CASE 
        WHEN NEW.balance > OLD.balance THEN 'balance_increase'
        ELSE 'balance_decrease'
      END,
      'transaction',
      format('Saldo alterado de R$ %s para R$ %s',
        OLD.balance,
        NEW.balance
      ),
      jsonb_build_object(
        'old_balance', OLD.balance,
        'new_balance', NEW.balance,
        'difference', NEW.balance - OLD.balance
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_balance_change
AFTER UPDATE ON users
FOR EACH ROW
WHEN (OLD.balance IS DISTINCT FROM NEW.balance)
EXECUTE FUNCTION log_balance_change();
*/

-- 10. Trigger: Log de configurações do sistema (OPCIONAL - apenas se a tabela system_settings existir)
-- Descomente se você tiver a tabela system_settings
/*
CREATE OR REPLACE FUNCTION log_settings_change()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_activity(
    NULL,
    NEW.updated_by,
    'settings_change',
    'settings',
    format('Configuração %s alterada', NEW.setting_key),
    jsonb_build_object(
      'setting_key', NEW.setting_key,
      'old_value', OLD.setting_value,
      'new_value', NEW.setting_value
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_settings_change
AFTER UPDATE ON system_settings
FOR EACH ROW
WHEN (OLD.setting_value IS DISTINCT FROM NEW.setting_value)
EXECUTE FUNCTION log_settings_change();
*/

-- ==========================================
-- Inserir alguns logs de exemplo
-- ==========================================

-- Log de sistema iniciado
INSERT INTO activity_logs (
  user_id,
  admin_id,
  action_type,
  action_category,
  description,
  metadata
) VALUES (
  NULL,
  NULL,
  'system_init',
  'admin',
  'Sistema de logs de atividades inicializado',
  jsonb_build_object('version', '1.0.0')
);

-- ==========================================
-- Consultas Úteis (EXEMPLOS - Não executadas)
-- ==========================================
-- Copie e cole as queries abaixo conforme necessário

/*
-- Ver últimos 20 logs
SELECT 
  al.id,
  u.name as user_name,
  a.name as admin_name,
  al.action_type,
  al.action_category,
  al.description,
  al.created_at
FROM activity_logs al
LEFT JOIN users u ON u.id = al.user_id
LEFT JOIN users a ON a.id = al.admin_id
ORDER BY al.created_at DESC
LIMIT 20;

-- Ver logs por categoria
SELECT 
  action_category,
  COUNT(*) as total
FROM activity_logs
GROUP BY action_category
ORDER BY total DESC;

-- Ver logs de um usuário específico
SELECT 
  al.action_type,
  al.description,
  al.created_at
FROM activity_logs al
WHERE al.user_id = 'UUID_DO_USUARIO'  -- Substitua pelo UUID real
ORDER BY al.created_at DESC;

-- Ver atividades administrativas
SELECT 
  al.description,
  a.name as admin_name,
  al.created_at
FROM activity_logs al
JOIN users a ON a.id = al.admin_id
WHERE al.admin_id IS NOT NULL
ORDER BY al.created_at DESC;
*/
