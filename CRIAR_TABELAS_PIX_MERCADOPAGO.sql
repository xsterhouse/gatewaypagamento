-- ============================================
-- CRIAR TABELAS PARA PIX COM MERCADO PAGO
-- ============================================

-- 1. TABELA DE TRANSAÇÕES PIX
CREATE TABLE IF NOT EXISTS public.pix_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Tipo de transação
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
  
  -- Valores
  amount DECIMAL(10, 2) NOT NULL,
  fee DECIMAL(10, 2) DEFAULT 0,
  net_amount DECIMAL(10, 2) NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Aguardando pagamento
    'processing',   -- Processando
    'completed',    -- Concluído
    'failed',       -- Falhou
    'cancelled'     -- Cancelado
  )),
  
  -- Mercado Pago
  mp_payment_id TEXT UNIQUE,
  mp_qr_code TEXT,
  mp_qr_code_base64 TEXT,
  mp_external_reference TEXT,
  
  -- PIX Info
  pix_key TEXT,
  pix_key_type TEXT CHECK (pix_key_type IN ('cpf', 'cnpj', 'email', 'phone', 'random')),
  
  -- Metadados
  description TEXT,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- 2. TABELA DE SALDOS DOS USUÁRIOS
CREATE TABLE IF NOT EXISTS public.user_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Saldos
  available_balance DECIMAL(10, 2) DEFAULT 0 NOT NULL CHECK (available_balance >= 0),
  locked_balance DECIMAL(10, 2) DEFAULT 0 NOT NULL CHECK (locked_balance >= 0),
  total_balance DECIMAL(10, 2) GENERATED ALWAYS AS (available_balance + locked_balance) STORED,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. CRIAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_pix_transactions_user_id ON public.pix_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_status ON public.pix_transactions(status);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_mp_payment_id ON public.pix_transactions(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_created_at ON public.pix_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_type ON public.pix_transactions(type);

CREATE INDEX IF NOT EXISTS idx_user_balances_user_id ON public.user_balances(user_id);

-- 4. HABILITAR RLS
ALTER TABLE public.pix_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_balances ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS RLS - PIX TRANSACTIONS

-- Usuários veem apenas suas transações
CREATE POLICY "users_view_own_pix_transactions"
ON public.pix_transactions FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Usuários podem criar suas transações
CREATE POLICY "users_create_own_pix_transactions"
ON public.pix_transactions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Admins veem todas as transações
CREATE POLICY "admins_view_all_pix_transactions"
ON public.pix_transactions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'master')
  )
);

-- Admins podem atualizar transações
CREATE POLICY "admins_update_pix_transactions"
ON public.pix_transactions FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'master')
  )
);

-- 6. POLÍTICAS RLS - USER BALANCES

-- Usuários veem apenas seu saldo
CREATE POLICY "users_view_own_balance"
ON public.user_balances FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Sistema pode criar saldos
CREATE POLICY "system_create_balances"
ON public.user_balances FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Admins veem todos os saldos
CREATE POLICY "admins_view_all_balances"
ON public.user_balances FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'master')
  )
);

-- 7. FUNÇÃO PARA CRIAR SALDO AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION public.create_user_balance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_balances (user_id, available_balance, locked_balance)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. TRIGGER PARA CRIAR SALDO QUANDO USUÁRIO É CRIADO
DROP TRIGGER IF EXISTS create_balance_on_user_creation ON public.users;
CREATE TRIGGER create_balance_on_user_creation
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_balance();

-- 9. FUNÇÃO PARA ATUALIZAR SALDO
CREATE OR REPLACE FUNCTION public.update_user_balance(
  p_user_id UUID,
  p_amount DECIMAL(10, 2),
  p_operation TEXT -- 'add' ou 'subtract'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_balance DECIMAL(10, 2);
BEGIN
  -- Verificar saldo atual
  SELECT available_balance INTO v_current_balance
  FROM public.user_balances
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- Se não existe, criar
  IF NOT FOUND THEN
    INSERT INTO public.user_balances (user_id, available_balance, locked_balance)
    VALUES (p_user_id, 0, 0);
    v_current_balance := 0;
  END IF;
  
  -- Validar operação de subtração
  IF p_operation = 'subtract' AND v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Saldo insuficiente';
  END IF;
  
  -- Atualizar saldo
  IF p_operation = 'add' THEN
    UPDATE public.user_balances
    SET available_balance = available_balance + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  ELSIF p_operation = 'subtract' THEN
    UPDATE public.user_balances
    SET available_balance = available_balance - p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  ELSE
    RAISE EXCEPTION 'Operação inválida: %', p_operation;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. VERIFICAR TABELAS CRIADAS
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('pix_transactions', 'user_balances')
ORDER BY table_name;

-- 11. VERIFICAR POLÍTICAS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('pix_transactions', 'user_balances')
ORDER BY tablename, policyname;
