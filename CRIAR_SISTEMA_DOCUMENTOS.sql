-- ================================================
-- SISTEMA DE UPLOAD DE DOCUMENTOS KYC
-- ================================================

-- PASSO 1: Criar tabela de documentos
-- ================================================

CREATE TABLE IF NOT EXISTS public.user_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('cpf', 'cnpj', 'comprovante_residencia', 'selfie')),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Índices
  CONSTRAINT unique_user_document UNIQUE (user_id, document_type, uploaded_at)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON public.user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_type ON public.user_documents(document_type);

-- ================================================
-- PASSO 2: Habilitar RLS
-- ================================================

ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

-- ================================================
-- PASSO 3: Criar políticas RLS
-- ================================================

-- Usuários podem ver próprios documentos
CREATE POLICY "users_view_own_documents"
ON public.user_documents
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Usuários podem inserir próprios documentos
CREATE POLICY "users_insert_own_documents"
ON public.user_documents
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Usuários podem deletar próprios documentos
CREATE POLICY "users_delete_own_documents"
ON public.user_documents
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Admins podem ver todos os documentos
CREATE POLICY "admins_view_all_documents"
ON public.user_documents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ================================================
-- PASSO 4: Criar bucket de storage (via Dashboard)
-- ================================================

-- IMPORTANTE: Execute estes passos no Supabase Dashboard:
-- 
-- 1. Vá em Storage → Create bucket
-- 2. Nome: kyc-documents
-- 3. Public: SIM (marcar)
-- 4. File size limit: 5MB
-- 5. Allowed mime types: image/jpeg,image/jpg,image/png,application/pdf
-- 
-- OU execute este SQL se tiver permissão:

INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', true)
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- PASSO 5: Políticas de Storage
-- ================================================

-- Permitir upload de arquivos
CREATE POLICY "Users can upload own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kyc-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir leitura de arquivos
CREATE POLICY "Public can view documents"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'kyc-documents');

-- Permitir deletar próprios arquivos
CREATE POLICY "Users can delete own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'kyc-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ================================================
-- PASSO 6: Verificação
-- ================================================

-- Ver estrutura da tabela
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_documents'
ORDER BY ordinal_position;

-- Ver políticas
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'user_documents';

-- Ver bucket
SELECT * FROM storage.buckets WHERE id = 'kyc-documents';

-- ================================================
-- RESULTADO ESPERADO:
-- ================================================
-- ✅ Tabela user_documents criada
-- ✅ 4 políticas RLS ativas
-- ✅ Bucket kyc-documents criado
-- ✅ 3 políticas de storage ativas
-- ✅ Usuários podem fazer upload
-- ✅ Admins podem ver todos os documentos
-- ================================================

SELECT 'Sistema de documentos configurado com sucesso!' as status;
