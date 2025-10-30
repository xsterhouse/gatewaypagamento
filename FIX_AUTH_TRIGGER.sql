-- ========================================
-- FIX TRIGGER DE CRIAÇÃO AUTOMÁTICA DE USUÁRIO
-- ========================================

-- 1. Verificar se existe trigger que cria usuário automaticamente
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
   OR trigger_name LIKE '%user%'
   OR trigger_name LIKE '%profile%';

-- 2. Verificar funções relacionadas
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_name LIKE '%user%' OR routine_name LIKE '%profile%');

-- 3. Desabilitar trigger problemático (se existir)
-- Substitua 'on_auth_user_created' pelo nome real do trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;

-- 4. Criar função corrigida para criar usuário
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
    -- Log o erro mas não falha o signup
    RAISE WARNING 'Erro ao criar usuário na tabela users: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Recriar trigger com a função corrigida
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6. Garantir que a tabela users tem todos os campos
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS max_clients INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS current_clients INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS cpf TEXT;

-- 7. Atualizar constraint de role
DO $$ 
BEGIN
  ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
  ALTER TABLE public.users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('user', 'admin', 'manager'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 8. Verificar se o trigger foi criado
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
