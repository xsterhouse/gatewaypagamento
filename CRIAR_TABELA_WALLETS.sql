-- ================================================
-- TABELA: Wallets (Carteiras)
-- ================================================

CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Informações da moeda
  currency_code TEXT NOT NULL,        -- BRL, BTC, ETH, USDT, etc
  currency_type TEXT NOT NULL CHECK (currency_type IN ('fiat', 'crypto')),
  
  -- Saldos
  balance DECIMAL(20, 8) DEFAULT 0 NOT NULL,
  available_balance DECIMAL(20, 8) DEFAULT 0 NOT NULL,
  blocked_balance DECIMAL(20, 8) DEFAULT 0 NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Índices e constraints
  CONSTRAINT positive_balance CHECK (balance >= 0),
  CONSTRAINT positive_available CHECK (available_balance >= 0),
  CONSTRAINT positive_blocked CHECK (blocked_balance >= 0),
  CONSTRAINT balance_equation CHECK (balance = available_balance + blocked_balance),
  CONSTRAINT unique_user_currency UNIQUE(user_id, currency_code)
);

-- ================================================
-- Índices para Performance
-- ================================================

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_currency_code ON public.wallets(currency_code);
CREATE INDEX IF NOT EXISTS idx_wallets_currency_type ON public.wallets(currency_type);
CREATE INDEX IF NOT EXISTS idx_wallets_is_active ON public.wallets(is_active);

-- ================================================
-- RLS (Row Level Security)
-- ================================================

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Usuários veem apenas suas próprias carteiras
CREATE POLICY "users_view_own_wallets"
ON public.wallets
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Usuários podem inserir suas próprias carteiras (via sistema)
CREATE POLICY "users_insert_own_wallets"
ON public.wallets
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Usuários podem atualizar suas próprias carteiras (via sistema)
CREATE POLICY "users_update_own_wallets"
ON public.wallets
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Admins podem ver todas as carteiras
CREATE POLICY "admins_view_all_wallets"
ON public.wallets
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Admins podem gerenciar todas as carteiras
CREATE POLICY "admins_manage_all_wallets"
ON public.wallets
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

CREATE OR REPLACE FUNCTION update_wallets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wallets_updated_at
BEFORE UPDATE ON public.wallets
FOR EACH ROW
EXECUTE FUNCTION update_wallets_updated_at();

-- ================================================
-- Função para criar carteira padrão (BRL)
-- ================================================

CREATE OR REPLACE FUNCTION create_default_wallet()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar carteira BRL automaticamente para novos usuários
  INSERT INTO public.wallets (
    user_id,
    currency_code,
    currency_type,
    balance,
    available_balance,
    blocked_balance
  ) VALUES (
    NEW.id,
    'BRL',
    'fiat',
    0,
    0,
    0
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar carteira BRL ao criar usuário
CREATE TRIGGER create_default_wallet_on_user_creation
AFTER INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION create_default_wallet();

-- ================================================
-- Funções auxiliares
-- ================================================

-- Função para adicionar saldo
CREATE OR REPLACE FUNCTION add_balance(
  wallet_id UUID,
  amount DECIMAL(20, 8)
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.wallets
  SET 
    balance = balance + amount,
    available_balance = available_balance + amount
  WHERE id = wallet_id
  AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para bloquear saldo
CREATE OR REPLACE FUNCTION block_balance(
  wallet_id UUID,
  amount DECIMAL(20, 8)
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.wallets
  SET 
    available_balance = available_balance - amount,
    blocked_balance = blocked_balance + amount
  WHERE id = wallet_id
  AND user_id = auth.uid()
  AND available_balance >= amount;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para desbloquear saldo
CREATE OR REPLACE FUNCTION unblock_balance(
  wallet_id UUID,
  amount DECIMAL(20, 8)
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.wallets
  SET 
    available_balance = available_balance + amount,
    blocked_balance = blocked_balance - amount
  WHERE id = wallet_id
  AND user_id = auth.uid()
  AND blocked_balance >= amount;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para remover saldo
CREATE OR REPLACE FUNCTION remove_balance(
  wallet_id UUID,
  amount DECIMAL(20, 8)
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.wallets
  SET 
    balance = balance - amount,
    available_balance = available_balance - amount
  WHERE id = wallet_id
  AND user_id = auth.uid()
  AND available_balance >= amount;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- Dados de exemplo (Moedas suportadas)
-- ================================================

-- Criar função para adicionar moedas suportadas
CREATE TABLE IF NOT EXISTS public.supported_currencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('fiat', 'crypto')),
  symbol TEXT,
  decimals INTEGER DEFAULT 2,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir moedas suportadas
INSERT INTO public.supported_currencies (code, name, type, symbol, decimals) VALUES
('BRL', 'Real Brasileiro', 'fiat', 'R$', 2),
('USD', 'Dólar Americano', 'fiat', '$', 2),
('EUR', 'Euro', 'fiat', '€', 2),
('BTC', 'Bitcoin', 'crypto', '₿', 8),
('ETH', 'Ethereum', 'crypto', 'Ξ', 8),
('USDT', 'Tether', 'crypto', '₮', 6)
ON CONFLICT (code) DO NOTHING;

-- ================================================
-- VERIFICAÇÃO
-- ================================================

SELECT 
  'Tabela wallets criada com sucesso!' as status,
  COUNT(*) as total_policies
FROM pg_policies
WHERE tablename = 'wallets';

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'wallets'
ORDER BY ordinal_position;
