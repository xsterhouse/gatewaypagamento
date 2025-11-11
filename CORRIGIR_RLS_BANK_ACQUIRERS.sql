-- ============================================
-- CORRIGIR POLÍTICAS RLS - BANK_ACQUIRERS
-- ============================================

-- Permitir que usuários autenticados leiam adquirentes ativos
DROP POLICY IF EXISTS "Users can view active acquirers" ON public.bank_acquirers;

CREATE POLICY "Users can view active acquirers" ON public.bank_acquirers
  FOR SELECT
  USING (
    is_active = true AND 
    status = 'active' AND
    auth.role() = 'authenticated'
  );

-- Permitir que admins vejam todos
DROP POLICY IF EXISTS "Admins can view all acquirers" ON public.bank_acquirers;

CREATE POLICY "Admins can view all acquirers" ON public.bank_acquirers
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Verificar políticas existentes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'bank_acquirers';
