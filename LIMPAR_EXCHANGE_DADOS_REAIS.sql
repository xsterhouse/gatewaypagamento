-- ================================================
-- LIMPAR EXCHANGE & ORDENS (DADOS REAIS)
-- ================================================

-- ================================================
-- 1. VER O QUE EXISTE
-- ================================================

-- Ver ordens existentes
SELECT 
  COUNT(*) as total_ordens,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendentes,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as concluidas,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as canceladas
FROM public.exchange_orders;

-- Ver pares de trading
SELECT * FROM public.trading_pairs;

-- Ver preços
SELECT * FROM public.crypto_prices ORDER BY created_at DESC LIMIT 10;

-- ================================================
-- 2. LIMPAR DADOS DE TESTE (NA ORDEM CORRETA)
-- ================================================

-- 2.1. Limpar ordens PRIMEIRO (dependência)
DELETE FROM public.exchange_orders;

-- 2.2. Limpar preços antigos (opcional)
-- DELETE FROM public.crypto_prices;

-- 2.3. NÃO deletar trading_pairs (são configuração do sistema)
-- DELETE FROM public.trading_pairs;  ← NÃO FAZER

-- ================================================
-- 3. VERIFICAR SE LIMPOU
-- ================================================

SELECT 
  (SELECT COUNT(*) FROM public.exchange_orders) as ordens,
  (SELECT COUNT(*) FROM public.crypto_prices) as precos,
  (SELECT COUNT(*) FROM public.trading_pairs) as pares;

-- Resultado esperado:
-- ordens: 0
-- precos: 0 ou mantém se tiver preços reais
-- pares: 8 (BTC/BRL, ETH/BRL, etc)

-- ================================================
-- 4. RESETAR PREÇOS PARA ZERO (AGUARDAR API)
-- ================================================

-- Zerar todos os preços (serão atualizados via API externa)
UPDATE public.crypto_prices
SET 
  price_brl = 0,
  price_usd = 0,
  change_24h = 0,
  volume_24h = 0,
  market_cap = 0;

-- OU inserir preços zerados se não existir
INSERT INTO public.crypto_prices (cryptocurrency_symbol, price_brl, price_usd, change_24h) VALUES
('BTC', 0, 0, 0),
('ETH', 0, 0, 0),
('USDT', 0, 0, 0),
('BNB', 0, 0, 0),
('SOL', 0, 0, 0),
('ADA', 0, 0, 0),
('DOT', 0, 0, 0),
('MATIC', 0, 0, 0)
ON CONFLICT DO NOTHING;

-- ================================================
-- 5. VERIFICAR ESTATÍSTICAS (CARDS)
-- ================================================

-- Total de ordens
SELECT COUNT(*) as total_orders FROM public.exchange_orders;

-- Ordens pendentes
SELECT COUNT(*) as pending_orders 
FROM public.exchange_orders 
WHERE status = 'pending';

-- Ordens concluídas
SELECT COUNT(*) as completed_orders 
FROM public.exchange_orders 
WHERE status = 'completed';

-- Volume total
SELECT 
  COALESCE(SUM(total_value), 0) as total_volume
FROM public.exchange_orders;

-- Resultado esperado (todos zerados):
-- total_orders: 0
-- pending_orders: 0
-- completed_orders: 0
-- total_volume: 0.00

-- ================================================
-- 6. ESTADO FINAL DO SISTEMA
-- ================================================

-- ✅ Pares de trading configurados (8 pares ativos)
-- ✅ Preços zerados (aguardando integração com API)
-- ✅ Sem ordens de teste
-- ✅ Pronto para ordens REAIS de clientes

-- ================================================
-- COMO O SISTEMA FUNCIONARÁ:
-- ================================================

-- 1. Cliente acessa /exchange
-- 2. Sistema carrega pares de trading (BTC/BRL, ETH/BRL, etc)
-- 3. Sistema carrega preços atuais (via API ou banco)
-- 4. Cliente cria ordem de compra/venda
-- 5. Sistema insere em exchange_orders
-- 6. Admin vê ordem real em /admin/exchange
-- 7. Sistema processa ordem (atualiza wallets)
-- 8. Ordem marcada como completed

-- ================================================
-- INTEGRAÇÃO COM API DE PREÇOS (PRÓXIMO PASSO)
-- ================================================

-- Para obter preços reais, você pode:
-- 1. CoinGecko API (gratuita)
-- 2. Binance API
-- 3. CoinMarketCap API
-- 4. Criar um cronjob que atualiza preços a cada minuto

-- Exemplo de atualização de preço:
/*
UPDATE public.crypto_prices
SET 
  price_brl = 350000.00,  -- Obtido da API
  price_usd = 70000.00,
  change_24h = 2.5,
  volume_24h = 1000000000,
  created_at = NOW()
WHERE cryptocurrency_symbol = 'BTC';
*/

-- ================================================
-- VERIFICAÇÃO FINAL
-- ================================================

SELECT 
  'Sistema limpo!' as status,
  (SELECT COUNT(*) FROM trading_pairs WHERE is_active = true) as pares_ativos,
  (SELECT COUNT(*) FROM crypto_prices) as precos_disponiveis,
  (SELECT COUNT(*) FROM exchange_orders) as ordens_ativas;
