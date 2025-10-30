-- ================================================
-- INSERIR PREÇOS RÁPIDO (SOLUÇÃO IMEDIATA)
-- ================================================

-- 1. Criar tabela se não existir
CREATE TABLE IF NOT EXISTS public.crypto_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cryptocurrency_symbol TEXT NOT NULL,
  price_brl DECIMAL(20, 8) NOT NULL,
  price_usd DECIMAL(20, 8),
  change_24h DECIMAL(10, 4) DEFAULT 0,
  volume_24h DECIMAL(20, 8),
  market_cap DECIMAL(30, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Inserir preços (valores de exemplo - Oct 2024)
INSERT INTO public.crypto_prices (
  cryptocurrency_symbol,
  price_brl,
  price_usd,
  change_24h
) VALUES
('BTC', 350000.00, 70000.00, 2.5),
('ETH', 18500.00, 3700.00, 1.2),
('USDT', 5.02, 1.00, -0.1),
('BNB', 2100.00, 420.00, 0.8),
('SOL', 850.00, 170.00, 3.2),
('ADA', 2.80, 0.56, -0.5),
('DOT', 35.00, 7.00, 1.0),
('MATIC', 4.20, 0.84, 0.5);

-- 3. Verificar
SELECT 
  cryptocurrency_symbol as moeda,
  'R$ ' || price_brl as preco_brl,
  change_24h || '%' as variacao_24h,
  created_at as atualizado
FROM public.crypto_prices
ORDER BY cryptocurrency_symbol;

-- Resultado esperado:
-- BTC    R$ 350000.00  2.5%   2024-10-28...
-- ETH    R$ 18500.00   1.2%   2024-10-28...
-- ...

-- ================================================
-- IMPORTANTE:
-- ================================================
-- Estes são preços de EXEMPLO para você ver funcionando
-- Para preços REAIS, clique "Atualizar Preços" na interface
-- O botão busca da API CoinGecko automaticamente
