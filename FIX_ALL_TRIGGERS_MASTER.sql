-- ========================================
-- FIX MASTER - CORRIGE TODOS OS TRIGGERS
-- Execute este SQL para corrigir TUDO de uma vez
-- ========================================

-- ================================================
-- 1. DESABILITAR TODOS OS TRIGGERS PROBLEMÁTICOS
-- ================================================

-- Triggers de usuário
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;

-- Triggers de carteira
DROP TRIGGER IF EXISTS create_default_wallet_on_user_creation ON users;

-- Triggers de notificação
DROP TRIGGER IF EXISTS create_welcome_notification ON users;
DROP TRIGGER IF EXISTS notify_user_on_signup ON auth.users;

-- ================================================
-- 2. CORRIGIR TABELA USERS
-- ================================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS max_clients INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS current_clients INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS cpf TEXT,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Atualizar constraint de role
DO $$ 
BEGIN
  ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
  ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('user', 'admin', 'manager'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- ================================================
-- 3. CORRIGIR TABELA WALLETS
-- ================================================

ALTER TABLE wallets DROP COLUMN IF EXISTS currency_name;

-- ================================================
-- 4. CORRIGIR TABELA NOTIFICATIONS
-- ================================================

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS type TEXT;

-- Se existe notification_type, copiar para type
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'notification_type'
  ) THEN
    UPDATE notifications 
    SET type = notification_type 
    WHERE type IS NULL AND notification_type IS NOT NULL;
  END IF;
END $$;

-- ================================================
-- 5. RECRIAR FUNÇÕES CORRIGIDAS
-- ================================================

-- Função para criar usuário (com EXCEPTION handler)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    name,
    role,
    status,
    kyc_status,
    max_clients,
    current_clients
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    'active',
    'pending',
    50,
    0
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao criar usuário: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar carteira padrão (com EXCEPTION handler)
CREATE OR REPLACE FUNCTION create_default_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wallets (
    user_id,
    currency_code,
    currency_type,
    balance,
    available_balance,
    blocked_balance,
    is_active
  ) VALUES (
    NEW.id,
    'BRL',
    'fiat',
    0,
    0,
    0,
    true
  )
  ON CONFLICT (user_id, currency_code) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao criar carteira: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar notificação de boas-vindas (com EXCEPTION handler)
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
    RAISE WARNING 'Erro ao criar notificação: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- 6. RECRIAR TRIGGERS (OPCIONAL - COMENTE SE NÃO QUISER)
-- ================================================

-- Trigger para criar usuário
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger para criar carteira
CREATE TRIGGER create_default_wallet_on_user_creation
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_wallet();

-- Trigger para criar notificação (OPCIONAL)
-- CREATE TRIGGER create_welcome_notification
--   AFTER INSERT ON public.users
--   FOR EACH ROW
--   EXECUTE FUNCTION create_welcome_notification();

-- ================================================
-- 7. POLÍTICAS RLS PARA ADMINS
-- ================================================

-- Permitir admin inserir gerentes
DROP POLICY IF EXISTS "Admins can insert managers" ON users;
CREATE POLICY "Admins can insert managers"
ON users FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Permitir admin atualizar gerentes
DROP POLICY IF EXISTS "Admins can update managers" ON users;
CREATE POLICY "Admins can update managers"
ON users FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Permitir admin deletar gerentes
DROP POLICY IF EXISTS "Admins can delete managers" ON users;
CREATE POLICY "Admins can delete managers"
ON users FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ================================================
-- 8. VERIFICAÇÃO FINAL
-- ================================================

-- Verificar triggers ativos
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_schema = 'public'
   OR event_object_schema = 'auth'
ORDER BY event_object_table, trigger_name;

-- Verificar estrutura das tabelas
SELECT 'users' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
UNION ALL
SELECT 'wallets', column_name, data_type
FROM information_schema.columns
WHERE table_name = 'wallets'
UNION ALL
SELECT 'notifications', column_name, data_type
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY table_name, column_name;
