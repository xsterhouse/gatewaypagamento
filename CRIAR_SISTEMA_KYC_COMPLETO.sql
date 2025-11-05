-- ================================================
-- SISTEMA KYC COMPLETO - PESSOA FÍSICA E JURÍDICA
-- ================================================

-- ================================================
-- PASSO 1: Adicionar campos KYC na tabela users
-- ================================================

-- Adicionar campos de pessoa física
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT;

-- Atualizar campo kyc_status para incluir novos estados
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_kyc_status_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_kyc_status_check 
CHECK (kyc_status IN ('pending', 'awaiting_verification', 'approved', 'rejected'));

-- ================================================
-- PASSO 2: Criar tabela de documentos KYC
-- ================================================

CREATE TABLE IF NOT EXISTS public.kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'identity_document',      -- RG, CPF ou CNH
    'address_proof',          -- Comprovante de endereço
    'selfie',                 -- Selfie do rosto
    'selfie_with_document',   -- Selfie segurando documento
    'cnpj_card',              -- Cartão CNPJ
    'company_contract'        -- Contrato Social
  )),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Índice único para evitar duplicatas
  CONSTRAINT unique_user_document_type UNIQUE (user_id, document_type)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_kyc_documents_user_id ON public.kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_type ON public.kyc_documents(document_type);

-- ================================================
-- PASSO 3: Criar tabela de contas jurídicas
-- ================================================

CREATE TABLE IF NOT EXISTS public.corporate_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Dados da empresa
  company_legal_name TEXT NOT NULL,        -- Razão social
  company_trade_name TEXT,                 -- Nome fantasia
  cnpj TEXT NOT NULL UNIQUE,
  company_address TEXT NOT NULL,
  company_phone TEXT NOT NULL,
  
  -- Status KYC da conta jurídica
  kyc_status TEXT DEFAULT 'pending' NOT NULL CHECK (kyc_status IN ('pending', 'awaiting_verification', 'approved', 'rejected')),
  kyc_submitted_at TIMESTAMPTZ,
  kyc_approved_at TIMESTAMPTZ,
  kyc_rejection_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_corporate_accounts_user_id ON public.corporate_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_corporate_accounts_cnpj ON public.corporate_accounts(cnpj);
CREATE INDEX IF NOT EXISTS idx_corporate_accounts_kyc_status ON public.corporate_accounts(kyc_status);

-- ================================================
-- PASSO 4: Habilitar RLS nas novas tabelas
-- ================================================

ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_accounts ENABLE ROW LEVEL SECURITY;

-- ================================================
-- PASSO 5: Políticas RLS para kyc_documents
-- ================================================

-- Usuários podem ver próprios documentos
CREATE POLICY "users_view_own_kyc_documents"
ON public.kyc_documents
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Usuários podem inserir próprios documentos
CREATE POLICY "users_insert_own_kyc_documents"
ON public.kyc_documents
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Usuários podem atualizar próprios documentos
CREATE POLICY "users_update_own_kyc_documents"
ON public.kyc_documents
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Usuários podem deletar próprios documentos
CREATE POLICY "users_delete_own_kyc_documents"
ON public.kyc_documents
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Admins podem ver todos os documentos
CREATE POLICY "admins_view_all_kyc_documents"
ON public.kyc_documents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ================================================
-- PASSO 6: Políticas RLS para corporate_accounts
-- ================================================

-- Usuários podem ver própria conta corporativa
CREATE POLICY "users_view_own_corporate_account"
ON public.corporate_accounts
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Usuários podem inserir própria conta corporativa
CREATE POLICY "users_insert_own_corporate_account"
ON public.corporate_accounts
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Usuários podem atualizar própria conta corporativa
CREATE POLICY "users_update_own_corporate_account"
ON public.corporate_accounts
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admins podem ver todas as contas corporativas
CREATE POLICY "admins_view_all_corporate_accounts"
ON public.corporate_accounts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Admins podem atualizar todas as contas corporativas
CREATE POLICY "admins_update_all_corporate_accounts"
ON public.corporate_accounts
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ================================================
-- PASSO 7: Criar bucket de storage para documentos KYC
-- ================================================

-- Criar bucket (se não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents', 
  'kyc-documents', 
  false,  -- Privado para segurança
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

-- ================================================
-- PASSO 8: Políticas de Storage para kyc-documents
-- ================================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can upload own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all KYC documents" ON storage.objects;

-- Permitir upload de arquivos (usuários autenticados)
CREATE POLICY "Users can upload own KYC documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kyc-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir visualização de próprios arquivos
CREATE POLICY "Users can view own KYC documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir deletar próprios arquivos
CREATE POLICY "Users can delete own KYC documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'kyc-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins podem ver todos os documentos
CREATE POLICY "Admins can view all KYC documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents'
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ================================================
-- PASSO 9: Trigger para atualizar updated_at em corporate_accounts
-- ================================================

CREATE OR REPLACE FUNCTION public.handle_corporate_account_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_corporate_account_updated_at ON public.corporate_accounts;

CREATE TRIGGER set_corporate_account_updated_at
  BEFORE UPDATE ON public.corporate_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_corporate_account_updated_at();

-- ================================================
-- PASSO 10: Verificação
-- ================================================

-- Ver estrutura da tabela kyc_documents
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'kyc_documents'
ORDER BY ordinal_position;

-- Ver estrutura da tabela corporate_accounts
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'corporate_accounts'
ORDER BY ordinal_position;

-- Ver políticas de kyc_documents
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'kyc_documents';

-- Ver políticas de corporate_accounts
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'corporate_accounts';

-- Ver bucket
SELECT * FROM storage.buckets WHERE id = 'kyc-documents';

-- Ver políticas de storage
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%KYC%';

-- ================================================
-- RESULTADO ESPERADO:
-- ================================================
-- ✅ Campos KYC adicionados na tabela users
-- ✅ Tabela kyc_documents criada
-- ✅ Tabela corporate_accounts criada
-- ✅ RLS habilitado em todas as tabelas
-- ✅ Políticas RLS criadas
-- ✅ Bucket kyc-documents criado
-- ✅ Políticas de storage criadas
-- ✅ Triggers criados
-- ================================================

SELECT 'Sistema KYC completo configurado com sucesso!' as status;
