-- ================================================
-- CONFIGURAÇÃO COMPLETA DO SUPABASE
-- Gateway Pagamento - Tabela Users
-- ================================================

-- 1. CRIAR TABELA USERS (se não existir)
-- ================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'blocked')),
  
  -- Documentos
  document TEXT,
  document_type TEXT CHECK (document_type IN ('cpf', 'cnpj')),
  company_name TEXT,
  
  -- KYC
  kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected')),
  kyc_submitted_at TIMESTAMPTZ,
  kyc_approved_at TIMESTAMPTZ,
  kyc_rejection_reason TEXT,
  
  -- 2FA (opcional - não usado atualmente)
  two_fa_enabled BOOLEAN DEFAULT FALSE,
  two_fa_secret TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 2. CRIAR ÍNDICES PARA PERFORMANCE
-- ================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON public.users(kyc_status);

-- ================================================
-- 3. TRIGGER: ATUALIZAR updated_at AUTOMATICAMENTE
-- ================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.users;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ================================================
-- 4. TRIGGER: CRIAR USUÁRIO AUTOMATICAMENTE NO REGISTRO
-- ================================================
-- Este trigger cria automaticamente um registro na tabela users
-- quando um novo usuário é criado via auth.users (registro)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    'active'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar novo trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ================================================
-- 5. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ================================================

-- Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Usuários podem ver próprio perfil" ON public.users;
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON public.users;
DROP POLICY IF EXISTS "Admins podem ver todos usuários" ON public.users;
DROP POLICY IF EXISTS "Admins podem atualizar todos usuários" ON public.users;
DROP POLICY IF EXISTS "Permitir insert via trigger" ON public.users;
DROP POLICY IF EXISTS "Permitir insert para authenticated" ON public.users;

-- POLÍTICA 1: Usuários podem VER próprio perfil
CREATE POLICY "Usuários podem ver próprio perfil"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- POLÍTICA 2: Usuários podem ATUALIZAR próprio perfil
CREATE POLICY "Usuários podem atualizar próprio perfil"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- POLÍTICA 3: Admins podem VER todos usuários
CREATE POLICY "Admins podem ver todos usuários"
ON public.users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- POLÍTICA 4: Admins podem ATUALIZAR todos usuários
CREATE POLICY "Admins podem atualizar todos usuários"
ON public.users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- POLÍTICA 5: Permitir INSERT para usuários autenticados (registro)
CREATE POLICY "Permitir insert para authenticated"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- POLÍTICA 6: Admins podem DELETAR usuários
CREATE POLICY "Admins podem deletar usuários"
ON public.users
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ================================================
-- 6. CRIAR PRIMEIRO ADMIN (OPCIONAL)
-- ================================================
-- Descomente e modifique com os dados do seu admin

/*
-- Primeiro, crie o usuário via Supabase Auth Dashboard ou via código
-- Depois, atualize para admin:

UPDATE public.users
SET role = 'admin'
WHERE email = 'seu_email_admin@example.com';
*/

-- ================================================
-- 7. VERIFICAÇÕES
-- ================================================

-- Ver todos os usuários
-- SELECT * FROM public.users;

-- Ver configurações RLS
-- SELECT * FROM pg_policies WHERE tablename = 'users';

-- Ver triggers
-- SELECT * FROM pg_trigger WHERE tgname LIKE '%user%';

-- ================================================
-- 8. LIMPAR DADOS DE TESTE (SE NECESSÁRIO)
-- ================================================

/*
-- CUIDADO! Isso apaga TODOS os usuários
-- Use apenas em desenvolvimento

DELETE FROM public.users WHERE role != 'admin';

-- Ou apagar tudo e começar do zero:
-- TRUNCATE public.users CASCADE;
*/

-- ================================================
-- FIM DA CONFIGURAÇÃO
-- ================================================

-- Para aplicar:
-- 1. Copie este SQL
-- 2. Vá ao Supabase Dashboard
-- 3. SQL Editor
-- 4. Cole e execute
-- 5. Pronto!
