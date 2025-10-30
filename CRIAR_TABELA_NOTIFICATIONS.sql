-- ================================================
-- TABELA: Notifications (Notificações)
-- ================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Conteúdo
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  metadata JSONB,  -- Dados adicionais (link, ação, etc)
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- RLS (Row Level Security)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Usuários veem apenas suas notificações
CREATE POLICY "users_view_own_notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Usuários podem atualizar suas notificações (marcar como lida)
CREATE POLICY "users_update_own_notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Usuários podem deletar suas notificações
CREATE POLICY "users_delete_own_notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Sistema/Admin pode inserir notificações para qualquer usuário
CREATE POLICY "system_insert_notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Admins podem ver todas as notificações
CREATE POLICY "admins_view_all_notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Trigger para updated read_at
CREATE OR REPLACE FUNCTION update_notification_read_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = true AND OLD.is_read = false THEN
    NEW.read_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notifications_read_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION update_notification_read_at();

-- Função para criar notificação
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    metadata
  ) VALUES (
    p_user_id,
    p_title,
    p_message,
    p_type,
    p_metadata
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar notificação para todos os usuários
CREATE OR REPLACE FUNCTION broadcast_notification(
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info'
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type)
  SELECT id, p_title, p_message, p_type
  FROM auth.users;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- NOTIFICAÇÕES DE EXEMPLO (OPCIONAL)
-- ================================================

-- Inserir notificação de boas-vindas para novos usuários
CREATE OR REPLACE FUNCTION create_welcome_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type
  ) VALUES (
    NEW.id,
    'Bem-vindo ao DiMPay! 🎉',
    'Sua conta foi criada com sucesso. Explore todas as funcionalidades do sistema.',
    'success'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER welcome_notification_on_user_creation
AFTER INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION create_welcome_notification();

-- ================================================
-- EXEMPLOS DE USO
-- ================================================

-- Criar notificação manual
/*
SELECT create_notification(
  'user-id-aqui',
  'Depósito Recebido',
  'Seu depósito de R$ 100,00 foi processado com sucesso.',
  'success',
  '{"amount": 100, "currency": "BRL"}'::jsonb
);
*/

-- Broadcast para todos
/*
SELECT broadcast_notification(
  'Manutenção Programada',
  'O sistema estará em manutenção amanhã das 02h às 04h.',
  'warning'
);
*/

-- Ver notificações não lidas de um usuário
/*
SELECT * FROM notifications
WHERE user_id = auth.uid()
AND is_read = false
ORDER BY created_at DESC;
*/

-- Marcar como lida
/*
UPDATE notifications
SET is_read = true
WHERE id = 'notification-id';
*/

-- ================================================
-- VERIFICAÇÃO
-- ================================================

SELECT 'Tabela notifications criada com sucesso!' as status;

-- Ver estatísticas
SELECT 
  COUNT(*) as total_notifications,
  COUNT(CASE WHEN is_read = false THEN 1 END) as unread,
  COUNT(DISTINCT user_id) as users_with_notifications
FROM public.notifications;
