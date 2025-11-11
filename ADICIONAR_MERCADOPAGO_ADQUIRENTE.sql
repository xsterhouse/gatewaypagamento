-- ============================================
-- ADICIONAR MERCADO PAGO COMO ADQUIRENTE
-- ============================================

-- Inserir Mercado Pago na tabela bank_acquirers
INSERT INTO public.bank_acquirers (
  name,
  bank_code,
  client_id,
  client_secret,
  pix_key,
  pix_key_type,
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
  '', -- Será preenchido via interface
  '', -- Será preenchido via interface
  '', -- Chave PIX (opcional)
  'random',
  'https://api.mercadopago.com',
  'https://api.mercadopago.com/oauth/token',
  'https://api.mercadopago.com/v1/payments',
  true,
  true, -- Definir como padrão
  'production',
  1000000.00, -- R$ 1.000.000,00 limite diário
  50000.00,   -- R$ 50.000,00 por transação
  0.0099,     -- 0,99% de taxa
  0.00,       -- Sem taxa fixa
  'Mercado Pago - Gateway de pagamentos PIX com QR Code dinâmico. Suporta depósitos e saques via PIX.',
  'https://http2.mlstatic.com/frontend-assets/mp-web-navigation/ui-navigation/5.21.22/mercadopago/logo__large@2x.png',
  'active'
)
ON CONFLICT DO NOTHING;

-- Verificar se foi inserido
SELECT 
  id,
  name,
  bank_code,
  is_active,
  is_default,
  environment,
  status,
  created_at
FROM public.bank_acquirers
WHERE name = 'Mercado Pago';
