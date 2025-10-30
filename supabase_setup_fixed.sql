-- ================================================
-- CONFIGURAÇÃO SUPABASE - VERSÃO CORRIGIDA
-- Gateway Pagamento - Sem Erros
-- ================================================

-- ================================================
-- PASSO 1: DELETAR TRIGGERS E FUNÇÕES ANTIGAS
-- ================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS set_updated_at ON public.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_updated_at();

-- ================================================
-- PASSO 2: DELETAR POLÍTICAS ANTIGAS
-- ================================================

DROP POLICY IF EXISTS "Usuários podem ver próprio perfil" ON public.users;
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON public.users;
DROP POLICY IF EXISTS "Admins podem ver todos usuários" ON public.users;
DROP POLICY IF EXISTS "Admins podem atualizar todos usuários" ON public.users;
DROP POLICY IF EXISTS "Permitir insert via trigger" ON public.users;
DROP POLICY IF EXISTS "Permitir insert para authenticated" ON public.users;
DROP POLICY IF EXISTS "Admins podem deletar usuários" ON public.users;

-- ================================================
-- PASSO 3: DELETAR TABELA (SE EXISTIR)
-- ================================================

-- CUIDADO: Isso apaga todos os dados!
-- Comente esta linha se já tiver dados importantes:
DROP TABLE IF EXISTS public.users CASCADE;

-- ================================================
-- PASSO 4: CRIAR TABELA USERS
-- ================================================

CREATE TABLE public.users (
  -- Identificação
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  
  -- Controle de Acesso
  role TEXT DEFAULT 'user' NOT NULL CHECK (role IN ('admin', 'user')),
  status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'suspended', 'blocked')),
  
  -- Documentos
  document TEXT,
  document_type TEXT CHECK (document_type IN ('cpf', 'cnpj')),
  company_name TEXT,
  
  -- KYC (Know Your Customer)
  kyc_status TEXT DEFAULT 'pending' NOT NULL CHECK (kyc_status IN ('pending', 'approved', 'rejected')),
  kyc_submitted_at TIMESTAMPTZ,
  kyc_approved_at TIMESTAMPTZ,
  kyc_rejection_reason TEXT,
  
  -- 2FA (opcional - não usado atualmente)
  two_fa_enabled BOOLEAN DEFAULT FALSE,
  two_fa_secret TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ================================================
-- PASSO 5: CRIAR ÍNDICES
-- ================================================

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_status ON public.users(status);
CREATE INDEX idx_users_kyc_status ON public.users(kyc_status);
CREATE INDEX idx_users_created_at ON public.users(created_at);

-- ================================================
-- PASSO 6: HABILITAR RLS
-- ================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ================================================
-- PASSO 7: CRIAR FUNÇÕES
-- ================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para criar usuário automaticamente
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

-- ================================================
-- PASSO 8: CRIAR TRIGGERS
-- ================================================

-- Trigger para atualizar updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para criar usuário automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ================================================
-- PASSO 9: CRIAR POLÍTICAS RLS
-- ================================================

-- Política 1: Usuários podem VER próprio perfil
CREATE POLICY "users_select_own"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Política 2: Usuários podem ATUALIZAR próprio perfil
CREATE POLICY "users_update_own"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Política 3: Admins podem VER todos usuários
CREATE POLICY "admins_select_all"
ON public.users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Política 4: Admins podem ATUALIZAR todos usuários
CREATE POLICY "admins_update_all"
ON public.users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Política 5: Permitir INSERT para usuários autenticados (registro)
CREATE POLICY "users_insert_own"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Política 6: Admins podem DELETAR usuários
CREATE POLICY "admins_delete_all"
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
-- PASSO 10: VERIFICAÇÕES
-- ================================================

-- Ver estrutura da tabela
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'users' AND table_schema = 'public'
-- ORDER BY ordinal_position;

-- Ver políticas
-- SELECT * FROM pg_policies WHERE tablename = 'users';

-- Ver triggers
-- SELECT * FROM pg_trigger WHERE tgrelid = 'public.users'::regclass;

-- Contar usuários
-- SELECT COUNT(*) FROM public.users;

-- ================================================
-- CONCLUÍDO!
-- ================================================

-- Próximos passos:
-- 1. Criar primeiro admin via Authentication → Users no dashboard
-- 2. Executar: UPDATE public.users SET role = 'admin' WHERE email = 'seu_email@example.com';
-- 3. Testar registro de novo usuário
-- 4. Testar login

SELECT 'Configuração concluída com sucesso!' AS status;
