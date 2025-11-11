-- ============================================
-- VERIFICAR CONFIGURAÇÃO DO MERCADO PAGO
-- ============================================

-- 1. Verificar se Mercado Pago existe
SELECT 
  id,
  name,
  bank_code,
  client_id,
  LENGTH(client_secret) as secret_length,
  is_active,
  is_default,
  environment,
  status
FROM public.bank_acquirers
WHERE bank_code = 'MP' OR name LIKE '%Mercado%';

-- 2. Verificar transações PIX recentes
SELECT 
  id,
  user_id,
  transaction_type,
  amount,
  status,
  pix_code,
  pix_txid,
  created_at
FROM public.pix_transactions
ORDER BY created_at DESC
LIMIT 5;

-- 3. Se não encontrou Mercado Pago, inserir
-- DESCOMENTE E SUBSTITUA AS CREDENCIAIS:
/*
INSERT INTO public.bank_acquirers (
  name, 
  bank_code, 
  client_id, 
  client_secret,
  api_base_url, 
  api_auth_url, 
  api_pix_url,
  is_active, 
  is_default, 
  environment,
  daily_limit, 
  transaction_limit,
  fee_percentage, 
  fee_fixed,
  description, 
  logo_url, 
  status
) VALUES (
  'Mercado Pago',
  'MP',
  'COLE_SEU_PUBLIC_KEY_AQUI',
  'COLE_SEU_ACCESS_TOKEN_AQUI',
  'https://api.mercadopago.com',
  'https://api.mercadopago.com/oauth/token',
  'https://api.mercadopago.com/v1/payments',
  true,
  true,
  'production',
  1000000.00,
  50000.00,
  0.0099,
  0.00,
  'Mercado Pago - Gateway de pagamentos PIX',
  'https://http2.mlstatic.com/frontend-assets/mp-web-navigation/ui-navigation/5.21.22/mercadopago/logo__large@2x.png',
  'active'
)
ON CONFLICT DO NOTHING;
*/
