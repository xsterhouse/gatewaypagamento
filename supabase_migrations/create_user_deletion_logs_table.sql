-- ========================================
-- TABELA: user_deletion_logs
-- Descrição: Log de auditoria para exclusões de usuários
-- ========================================

CREATE TABLE IF NOT EXISTS public.user_deletion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deleted_user_id UUID NOT NULL,
  deleted_user_name VARCHAR(255) NOT NULL,
  deleted_user_email VARCHAR(255) NOT NULL,
  deleted_user_document VARCHAR(20),
  deleted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  deletion_reason TEXT NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ========================================
-- ÍNDICES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_user_deletion_logs_deleted_user_id ON public.user_deletion_logs(deleted_user_id);
CREATE INDEX IF NOT EXISTS idx_user_deletion_logs_deleted_by ON public.user_deletion_logs(deleted_by);
CREATE INDEX IF NOT EXISTS idx_user_deletion_logs_deleted_at ON public.user_deletion_logs(deleted_at DESC);

-- ========================================
-- RLS (Row Level Security)
-- ========================================

ALTER TABLE public.user_deletion_logs ENABLE ROW LEVEL SECURITY;

-- Política: Apenas admins e gerentes podem ver logs
DROP POLICY IF EXISTS "Admins e gerentes podem ver logs de exclusão" ON public.user_deletion_logs;
CREATE POLICY "Admins e gerentes podem ver logs de exclusão"
  ON public.user_deletion_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

-- Política: Sistema pode inserir logs
DROP POLICY IF EXISTS "Sistema pode inserir logs" ON public.user_deletion_logs;
CREATE POLICY "Sistema pode inserir logs"
  ON public.user_deletion_logs
  FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE public.user_deletion_logs IS 'Log de auditoria para exclusões de usuários do sistema';
COMMENT ON COLUMN public.user_deletion_logs.deleted_user_id IS 'ID do usuário que foi excluído';
COMMENT ON COLUMN public.user_deletion_logs.deleted_by IS 'ID do admin/gerente que realizou a exclusão';
COMMENT ON COLUMN public.user_deletion_logs.deletion_reason IS 'Motivo da exclusão informado pelo admin';
