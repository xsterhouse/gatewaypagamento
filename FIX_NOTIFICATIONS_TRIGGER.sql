-- ========================================
-- FIX TRIGGER DE NOTIFICAÇÕES
-- ========================================

-- 1. Verificar estrutura da tabela notifications
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- 2. Verificar triggers relacionados a notificações
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%notif%'
   OR action_statement LIKE '%notification%';

-- 3. Verificar funções relacionadas a notificações
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_definition LIKE '%notification%';

-- 4. Adicionar coluna type se não existir
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS type TEXT;

-- 5. Se a coluna já existe mas com nome diferente, vamos usar notification_type
-- Verificar se existe notification_type
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'notification_type'
  ) THEN
    -- Se notification_type existe, criar alias ou renomear
    ALTER TABLE notifications 
    ADD COLUMN IF NOT EXISTS type TEXT;
    
    -- Copiar dados se type não tinha dados
    UPDATE notifications 
    SET type = notification_type 
    WHERE type IS NULL AND notification_type IS NOT NULL;
  END IF;
END $$;

-- 6. Desabilitar temporariamente triggers problemáticos de notificação
DROP TRIGGER IF EXISTS create_welcome_notification ON users;
DROP TRIGGER IF EXISTS notify_user_on_signup ON auth.users;

-- 7. Criar função corrigida para notificações (se necessário)
CREATE OR REPLACE FUNCTION create_welcome_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    notification_type,
    is_read
  ) VALUES (
    NEW.id,
    'Bem-vindo!',
    'Sua conta foi criada com sucesso.',
    'info',
    false
  )
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log o erro mas não falha a criação do usuário
    RAISE WARNING 'Erro ao criar notificação de boas-vindas: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Verificar estrutura final
SELECT 
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;
