-- ================================================
-- TABELAS: Exchange & Ordens (Dados Reais)
-- ================================================

-- ================================================
-- 1. TABELA: trading_pairs (Pares de Negociação)
-- ================================================

CREATE TABLE IF NOT EXISTS public.trading_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency TEXT NOT NULL,      -- BTC, ETH, USDT, etc
  quote_currency TEXT NOT NULL,     -- BRL, USD, etc
  fee_percentage DECIMAL(5, 2) DEFAULT 0.5 NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_trading_pair UNIQUE(base_currency, quote_currency)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_trading_pairs_active ON public.trading_pairs(is_active);
CREATE INDEX IF NOT EXISTS idx_trading_pairs_base ON public.trading_pairs(base_currency);

-- ================================================
-- 2. TABELA: crypto_prices (Preços das Criptomoedas)
-- ================================================

CREATE TABLE IF NOT EXISTS public.crypto_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cryptocurrency_symbol TEXT NOT NULL,  -- BTC, ETH, USDT, etc
  price_brl DECIMAL(20, 8) NOT NULL,
  price_usd DECIMAL(20, 8),
  change_24h DECIMAL(10, 4) DEFAULT 0,  -- Variação em %
  volume_24h DECIMAL(20, 8),
  market_cap DECIMAL(30, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_crypto_prices_symbol ON public.crypto_prices(cryptocurrency_symbol);
CREATE INDEX IF NOT EXISTS idx_crypto_prices_created ON public.crypto_prices(created_at DESC);

-- ================================================
-- 3. TABELA: exchange_orders (Ordens de Exchange)
-- ================================================

CREATE TABLE IF NOT EXISTS public.exchange_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trading_pair_id UUID NOT NULL REFERENCES public.trading_pairs(id) ON DELETE RESTRICT,
  
  -- Detalhes da Ordem
  order_type TEXT NOT NULL CHECK (order_type IN ('buy', 'sell')),
  order_mode TEXT NOT NULL CHECK (order_mode IN ('market', 'limit')),
  amount DECIMAL(20, 8) NOT NULL,           -- Quantidade
  price DECIMAL(20, 8) NOT NULL,            -- Preço unitário
  total_value DECIMAL(20, 8) NOT NULL,      -- Valor total
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'partial')),
  filled_amount DECIMAL(20, 8) DEFAULT 0,   -- Quantidade executada
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT positive_price CHECK (price > 0),
  CONSTRAINT positive_total CHECK (total_value > 0)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_exchange_orders_user ON public.exchange_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_exchange_orders_status ON public.exchange_orders(status);
CREATE INDEX IF NOT EXISTS idx_exchange_orders_created ON public.exchange_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exchange_orders_pair ON public.exchange_orders(trading_pair_id);

-- ================================================
-- RLS (Row Level Security)
-- ================================================

-- Trading Pairs (público)
ALTER TABLE public.trading_pairs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trading_pairs_public_read"
ON public.trading_pairs
FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "trading_pairs_admin_all"
ON public.trading_pairs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Crypto Prices (público para leitura)
ALTER TABLE public.crypto_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crypto_prices_public_read"
ON public.crypto_prices
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "crypto_prices_admin_all"
ON public.crypto_prices
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Exchange Orders (usuário vê suas ordens, admin vê todas)
ALTER TABLE public.exchange_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_user_own"
ON public.exchange_orders
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "orders_user_insert"
ON public.exchange_orders
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "orders_admin_all"
ON public.exchange_orders
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ================================================
-- TRIGGERS
-- ================================================

-- Atualizar updated_at
CREATE OR REPLACE FUNCTION update_exchange_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trading_pairs_updated_at
BEFORE UPDATE ON public.trading_pairs
FOR EACH ROW
EXECUTE FUNCTION update_exchange_updated_at();

CREATE TRIGGER exchange_orders_updated_at
BEFORE UPDATE ON public.exchange_orders
FOR EACH ROW
EXECUTE FUNCTION update_exchange_updated_at();

-- ================================================
-- DADOS INICIAIS (Pares de Negociação)
-- ================================================

INSERT INTO public.trading_pairs (base_currency, quote_currency, fee_percentage, is_active) VALUES
('BTC', 'BRL', 0.50, true),
('ETH', 'BRL', 0.50, true),
('USDT', 'BRL', 0.25, true),
('BNB', 'BRL', 0.50, true),
('SOL', 'BRL', 0.50, true),
('ADA', 'BRL', 0.50, true),
('DOT', 'BRL', 0.50, true),
('MATIC', 'BRL', 0.50, true)
ON CONFLICT (base_currency, quote_currency) DO NOTHING;

-- ================================================
-- PREÇOS INICIAIS (ZERADOS - Serão atualizados por API)
-- ================================================
-- Estes preços devem ser atualizados via integração com API (CoinGecko, Binance, etc)

INSERT INTO public.crypto_prices (cryptocurrency_symbol, price_brl, price_usd, change_24h) VALUES
('BTC', 0, 0, 0),
('ETH', 0, 0, 0),
('USDT', 0, 0, 0),
('BNB', 0, 0, 0),
('SOL', 0, 0, 0),
('ADA', 0, 0, 0),
('DOT', 0, 0, 0),
('MATIC', 0, 0, 0);

-- ================================================
-- VERIFICAÇÃO
-- ================================================

SELECT 'Tabelas criadas com sucesso!' as status;

-- Ver pares ativos
SELECT 
  base_currency,
  quote_currency,
  fee_percentage,
  is_active
FROM public.trading_pairs
WHERE is_active = true;

-- Ver estatísticas
SELECT 
  (SELECT COUNT(*) FROM public.trading_pairs WHERE is_active = true) as pares_ativos,
  (SELECT COUNT(*) FROM public.crypto_prices) as precos_cadastrados,
  (SELECT COUNT(*) FROM public.exchange_orders) as total_ordens;
