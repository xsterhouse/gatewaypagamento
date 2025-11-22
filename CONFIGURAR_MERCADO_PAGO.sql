-- ============================================
-- CONFIGURAR MERCADO PAGO
-- ============================================

-- Verificar se a tabela bank_acquirers existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'bank_acquirers';

-- Inserir configuração do Mercado Pago
INSERT INTO public.bank_acquirers (
  acquirer_name,
  acquirer_type,
  api_base_url,
  api_pix_url,
  client_id,
  client_secret,
  webhook_url,
  is_active,
  supports_pix,
  supports_boleto,
  supports_ted,
  created_at,
  updated_at
) VALUES (
  'Mercado Pago',
  'payment_gateway',
  'https://api.mercadopago.com',
  'https://api.mercadopago.com/v1/payments',
  'SEU_CLIENT_ID_AQUI', -- ⚠️ SUBSTITUIR pelo seu Client ID
  'SEU_ACCESS_TOKEN_AQUI', -- ⚠️ SUBSTITUIR pelo seu Access Token
  'https://plbcnvnsvytzqrhgybjd.supabase.co/functions/v1/mercadopago-webhook', -- ⚠️ VERIFICAR URL
  true,
  true, -- Suporta PIX
  true, -- Suporta Boleto
  false, -- Não suporta TED
  NOW(),
  NOW()
)
ON CONFLICT (acquirer_name) 
DO UPDATE SET
  is_active = true,
  supports_pix = true,
  supports_boleto = true,
  updated_at = NOW();

-- Verificar se foi criado
SELECT 
  id,
  acquirer_name,
  acquirer_type,
  is_active,
  supports_pix,
  supports_boleto,
  api_base_url,
  webhook_url
FROM public.bank_acquirers
WHERE acquirer_name = 'Mercado Pago';

SELECT '✅ Mercado Pago configurado com sucesso!' as status;

-- ============================================
-- INSTRUÇÕES IMPORTANTES
-- ============================================

/*
⚠️ ATENÇÃO: Você precisa substituir os valores antes de executar!

1. SEU_CLIENT_ID_AQUI
   - Obtenha em: https://www.mercadopago.com.br/developers/panel/app
   - Exemplo: "1234567890123456"

2. SEU_ACCESS_TOKEN_AQUI
   - Obtenha em: https://www.mercadopago.com.br/developers/panel/app
   - Exemplo: "APP_USR-1234567890123456-123456-abcdef1234567890abcdef1234567890-123456789"
   - ⚠️ Use o Access Token de PRODUÇÃO para ambiente real
   - ⚠️ Use o Access Token de TEST para testes

3. Webhook URL
   - Formato: https://SEU_PROJETO.supabase.co/functions/v1/mercadopago-webhook
   - Verifique o URL correto no Supabase Dashboard → Edge Functions

4. Configurar Webhook no Mercado Pago:
   - Acesse: https://www.mercadopago.com.br/developers/panel/app
   - Vá em "Webhooks"
   - Adicione a URL do webhook
   - Selecione eventos: "Payments"
   - Salve

EXEMPLO DE CONFIGURAÇÃO CORRETA:

INSERT INTO public.bank_acquirers (
  acquirer_name,
  acquirer_type,
  api_base_url,
  api_pix_url,
  client_id,
  client_secret,
  webhook_url,
  is_active,
  supports_pix,
  supports_boleto,
  supports_ted
) VALUES (
  'Mercado Pago',
  'payment_gateway',
  'https://api.mercadopago.com',
  'https://api.mercadopago.com/v1/payments',
  '1234567890123456',
  'APP_USR-1234567890123456-123456-abcdef1234567890abcdef1234567890-123456789',
  'https://plbcnvnsvytzqrhgybjd.supabase.co/functions/v1/mercadopago-webhook',
  true,
  true,
  true,
  false
);
*/
