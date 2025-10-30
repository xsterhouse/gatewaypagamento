-- ==========================================
-- Script SQL: Adicionar Campos de Gerente
-- ==========================================

-- 1. Adicionar campos para gerentes na tabela users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS max_clients INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS current_clients INTEGER DEFAULT 0;

-- 1.1 Criar tabela manager_clients (atribuição de clientes a gerentes)
CREATE TABLE IF NOT EXISTS manager_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manager_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(client_id)
);

-- 1.2 Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_manager_clients_manager ON manager_clients(manager_id);
CREATE INDEX IF NOT EXISTS idx_manager_clients_client ON manager_clients(client_id);

-- 2. Criar bucket de storage para fotos de gerentes
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Política de storage para permitir upload
CREATE POLICY "Permitir upload de avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Permitir leitura pública de avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Permitir atualização de avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Permitir deleção de avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- 4. Função para atribuir cliente automaticamente a gerente com menos clientes
CREATE OR REPLACE FUNCTION assign_client_to_manager()
RETURNS TRIGGER AS $$
DECLARE
  manager_id UUID;
BEGIN
  -- Encontrar gerente com menos clientes e que ainda tem espaço
  SELECT u.id INTO manager_id
  FROM users u
  WHERE u.role = 'manager'
    AND u.status = 'active'
    AND (
      SELECT COUNT(*) 
      FROM manager_clients mc 
      WHERE mc.manager_id = u.id
    ) < u.max_clients
  ORDER BY (
    SELECT COUNT(*) 
    FROM manager_clients mc 
    WHERE mc.manager_id = u.id
  ) ASC
  LIMIT 1;

  -- Se encontrou um gerente, atribuir o cliente
  IF manager_id IS NOT NULL THEN
    INSERT INTO manager_clients (manager_id, client_id)
    VALUES (manager_id, NEW.id)
    ON CONFLICT (client_id) DO NOTHING;
    
    -- Atualizar contador de clientes do gerente
    UPDATE users
    SET current_clients = (
      SELECT COUNT(*) 
      FROM manager_clients 
      WHERE manager_id = users.id
    )
    WHERE id = manager_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger para atribuir cliente quando KYC for aprovado
CREATE TRIGGER auto_assign_manager_on_kyc_approval
AFTER UPDATE OF kyc_status ON users
FOR EACH ROW
WHEN (
  NEW.role = 'customer' 
  AND NEW.kyc_status = 'approved' 
  AND OLD.kyc_status != 'approved'
)
EXECUTE FUNCTION assign_client_to_manager();

-- 6. Função para enviar notificação ao cliente sobre seu gerente
CREATE OR REPLACE FUNCTION notify_client_about_manager()
RETURNS TRIGGER AS $$
DECLARE
  manager_record RECORD;
  notification_message TEXT;
BEGIN
  -- Buscar informações do gerente
  SELECT u.name, u.whatsapp, u.photo_url
  INTO manager_record
  FROM users u
  WHERE u.id = NEW.manager_id;

  -- Criar mensagem de notificação
  notification_message := format(
    'Seu gerente de conta é %s. WhatsApp: %s',
    manager_record.name,
    manager_record.whatsapp
  );

  -- Inserir notificação (você pode criar uma tabela notifications)
  INSERT INTO notifications (user_id, title, message, type, created_at)
  VALUES (
    NEW.client_id,
    'Gerente de Conta Atribuído',
    notification_message,
    'manager_assigned',
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger para notificar cliente após atribuição
CREATE TRIGGER notify_after_manager_assignment
AFTER INSERT ON manager_clients
FOR EACH ROW
EXECUTE FUNCTION notify_client_about_manager();

-- 8. Criar tabela de notificações (se não existir)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 9. Criar índices adicionais para notificações
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);

-- 10. Atualizar current_clients para gerentes existentes
UPDATE users
SET current_clients = (
  SELECT COUNT(*) 
  FROM manager_clients 
  WHERE manager_id = users.id
)
WHERE role = 'manager';

-- ==========================================
-- Consultas Úteis
-- ==========================================

-- Ver gerentes e seus clientes
SELECT 
  u.name as gerente,
  u.whatsapp,
  u.current_clients,
  u.max_clients,
  ARRAY_AGG(c.name) as clientes
FROM users u
LEFT JOIN manager_clients mc ON mc.manager_id = u.id
LEFT JOIN users c ON c.id = mc.client_id
WHERE u.role = 'manager'
GROUP BY u.id, u.name, u.whatsapp, u.current_clients, u.max_clients;

-- Ver clientes sem gerente
SELECT id, name, email
FROM users
WHERE role = 'customer'
  AND kyc_status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM manager_clients WHERE client_id = users.id
  );
