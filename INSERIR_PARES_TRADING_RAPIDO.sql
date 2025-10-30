-- ================================================
-- INSERIR PARES DE TRADING (RÁPIDO)
-- ================================================
-- Execute este SQL se a página Exchange estiver vazia

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS public.trading_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency TEXT NOT NULL,
  quote_currency TEXT NOT NULL,
  fee_percentage DECIMAL(5, 2) DEFAULT 0.5 NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_trading_pair UNIQUE(base_currency, quote_currency)
);

-- Inserir os 8 pares principais
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

-- Verificar
SELECT 
  base_currency || '/' || quote_currency as par,
  fee_percentage || '%' as taxa,
  is_active as ativo
FROM public.trading_pairs
ORDER BY base_currency;

-- Resultado esperado:
-- BTC/BRL   0.50%  true
-- ETH/BRL   0.50%  true
-- USDT/BRL  0.25%  true
-- ... (8 pares no total)
