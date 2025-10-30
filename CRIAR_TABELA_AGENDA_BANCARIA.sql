-- ================================================
-- TABELA: Agenda Bancária (Banking Calendar)
-- ================================================

CREATE TABLE IF NOT EXISTS public.banking_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Tipo de ação
  action_type TEXT NOT NULL CHECK (action_type IN (
    'payment',           -- Pagamento agendado
    'deposit',           -- Depósito esperado
    'recurring',         -- Pagamento recorrente
    'deadline',          -- Vencimento
    'report'            -- Relatório
  )),
  
  -- Informações da ação
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(15, 2) DEFAULT 0,
  
  -- Datas
  scheduled_date TIMESTAMPTZ NOT NULL,
  executed_at TIMESTAMPTZ,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',          -- Pendente
    'scheduled',        -- Agendado
    'executed',         -- Executado
    'cancelled',        -- Cancelado
    'urgent'           -- Urgente
  )),
  
  -- Recorrência
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_type TEXT CHECK (recurrence_type IN (
    'daily',
    'weekly', 
    'monthly',
    'yearly'
  )),
  recurrence_end_date TIMESTAMPTZ,
  
  -- Lembretes
  reminder_enabled BOOLEAN DEFAULT FALSE,
  reminder_days_before INTEGER DEFAULT 1,
  reminder_sent BOOLEAN DEFAULT FALSE,
  
  -- Metadados
  category TEXT,
  tags TEXT[],
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Índices
  CONSTRAINT valid_amount CHECK (amount >= 0)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_banking_calendar_user_id ON public.banking_calendar(user_id);
CREATE INDEX IF NOT EXISTS idx_banking_calendar_date ON public.banking_calendar(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_banking_calendar_status ON public.banking_calendar(status);
CREATE INDEX IF NOT EXISTS idx_banking_calendar_type ON public.banking_calendar(action_type);

-- ================================================
-- RLS (Row Level Security)
-- ================================================

ALTER TABLE public.banking_calendar ENABLE ROW LEVEL SECURITY;

-- Usuários veem apenas suas próprias ações
CREATE POLICY "users_view_own_calendar"
ON public.banking_calendar
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Usuários podem inserir suas próprias ações
CREATE POLICY "users_insert_own_calendar"
ON public.banking_calendar
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Usuários podem atualizar suas próprias ações
CREATE POLICY "users_update_own_calendar"
ON public.banking_calendar
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Usuários podem deletar suas próprias ações
CREATE POLICY "users_delete_own_calendar"
ON public.banking_calendar
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Admins podem ver todas as ações
CREATE POLICY "admins_view_all_calendar"
ON public.banking_calendar
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Admins podem gerenciar todas as ações
CREATE POLICY "admins_manage_all_calendar"
ON public.banking_calendar
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ================================================
-- Trigger para updated_at
-- ================================================

CREATE OR REPLACE FUNCTION update_banking_calendar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER banking_calendar_updated_at
BEFORE UPDATE ON public.banking_calendar
FOR EACH ROW
EXECUTE FUNCTION update_banking_calendar_updated_at();

-- ================================================
-- Função para marcar ação como executada
-- ================================================

CREATE OR REPLACE FUNCTION execute_banking_action(action_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.banking_calendar
  SET 
    status = 'executed',
    executed_at = NOW()
  WHERE id = action_id
  AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- Função para cancelar ação
-- ================================================

CREATE OR REPLACE FUNCTION cancel_banking_action(action_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.banking_calendar
  SET status = 'cancelled'
  WHERE id = action_id
  AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- Inserir dados de exemplo (opcional)
-- ================================================

-- Descomentar para inserir dados de exemplo
/*
INSERT INTO public.banking_calendar (
  user_id, 
  action_type, 
  title, 
  description, 
  amount, 
  scheduled_date, 
  status
) VALUES
(
  auth.uid(),
  'payment',
  'Pagamento Fornecedor XYZ',
  'Transferência mensal para fornecedor',
  5000.00,
  NOW() + INTERVAL '7 days',
  'pending'
),
(
  auth.uid(),
  'deposit',
  'Recebimento Cliente ABC',
  'Fatura #1234',
  12500.00,
  NOW() + INTERVAL '10 days',
  'pending'
);
*/

-- ================================================
-- VERIFICAÇÃO
-- ================================================

SELECT 
  'Tabela banking_calendar criada com sucesso!' as status,
  COUNT(*) as total_policies
FROM pg_policies
WHERE tablename = 'banking_calendar';

SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'banking_calendar'
ORDER BY ordinal_position;
