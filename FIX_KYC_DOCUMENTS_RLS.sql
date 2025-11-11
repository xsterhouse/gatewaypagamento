-- ============================================
-- CORRIGIR POLÍTICAS RLS PARA KYC_DOCUMENTS
-- ============================================

-- Verificar se a tabela existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'kyc_documents'
);

-- Verificar políticas existentes
SELECT * FROM pg_policies 
WHERE tablename = 'kyc_documents';

-- ============================================
-- REMOVER POLÍTICAS ANTIGAS
-- ============================================

DROP POLICY IF EXISTS "admins_view_all_kyc_documents" ON public.kyc_documents;
DROP POLICY IF EXISTS "users_view_own_kyc_documents" ON public.kyc_documents;
DROP POLICY IF EXISTS "users_insert_own_kyc_documents" ON public.kyc_documents;
DROP POLICY IF EXISTS "users_update_own_kyc_documents" ON public.kyc_documents;
DROP POLICY IF EXISTS "users_delete_own_kyc_documents" ON public.kyc_documents;

-- ============================================
-- CRIAR POLÍTICAS CORRIGIDAS
-- ============================================

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

-- Usuários podem atualizar próprios documentos (upsert)
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

-- Admins e Masters podem ver TODOS os documentos
CREATE POLICY "admins_view_all_kyc_documents"
ON public.kyc_documents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'master')
  )
);

-- Admins e Masters podem atualizar todos os documentos
CREATE POLICY "admins_update_all_kyc_documents"
ON public.kyc_documents
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'master')
  )
);

-- Admins e Masters podem deletar todos os documentos
CREATE POLICY "admins_delete_all_kyc_documents"
ON public.kyc_documents
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'master')
  )
);

-- ============================================
-- VERIFICAR DOCUMENTOS EXISTENTES
-- ============================================

-- Ver todos os documentos (executar como admin)
SELECT 
  kd.id,
  kd.user_id,
  u.name as user_name,
  u.email as user_email,
  kd.document_type,
  kd.file_name,
  kd.uploaded_at
FROM public.kyc_documents kd
LEFT JOIN public.users u ON u.id = kd.user_id
ORDER BY kd.uploaded_at DESC;

-- Contar documentos por usuário
SELECT 
  u.name,
  u.email,
  u.kyc_status,
  COUNT(kd.id) as total_documentos
FROM public.users u
LEFT JOIN public.kyc_documents kd ON kd.user_id = u.id
WHERE u.role = 'user'
GROUP BY u.id, u.name, u.email, u.kyc_status
ORDER BY total_documentos DESC;

-- ============================================
-- TESTE DE PERMISSÕES
-- ============================================

-- Verificar se o usuário atual é admin
SELECT 
  id,
  email,
  role,
  CASE 
    WHEN role IN ('admin', 'master') THEN 'É ADMIN/MASTER'
    ELSE 'NÃO É ADMIN'
  END as status_admin
FROM public.users
WHERE id = auth.uid();
