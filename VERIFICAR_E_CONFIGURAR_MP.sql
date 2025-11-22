-- ============================================
-- VERIFICAR ESTRUTURA DA TABELA bank_acquirers
-- ============================================

-- 1. Ver estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'bank_acquirers'
ORDER BY ordinal_position;

-- 2. Ver dados atuais
SELECT * FROM public.bank_acquirers LIMIT 5;

-- ============================================
-- CONFIGURAR MERCADO PAGO (VERSÃO CORRIGIDA)
-- ============================================

-- Verificar se já existe
SELECT * FROM public.bank_acquirers 
WHERE name = 'Mercado Pago' OR name LIKE '%Mercado%';

-- OPÇÃO 1: Se a coluna for "name" ao invés de "acquirer_name"
INSERT INTO public.bank_acquirers (
  name,
  type,
  api_url,
  client_id,
  client_secret,
  webhook_url,
  is_active,
  created_at,
  updated_at
) VALUES (
  'Mercado Pago',
  'payment_gateway',
  'https://api.mercadopago.com',
  '5125534099643365',
  'APP_USR-5125534099643365-111117-8c88d93181e7b2af84638a1e300829bc-2711450788',
  'https://plbcnvnsvytzqrhgybjd.supabase.co/functions/v1/mercadopago-webhook',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (name) 
DO UPDATE SET
  client_id = '5125534099643365',
  client_secret = 'APP_USR-5125534099643365-111117-8c88d93181e7b2af84638a1e300829bc-2711450788',
  webhook_url = 'https://plbcnvnsvytzqrhgybjd.supabase.co/functions/v1/mercadopago-webhook',
  is_active = true,
  updated_at = NOW();

-- Verificar se foi criado/atualizado
SELECT * FROM public.bank_acquirers WHERE name = 'Mercado Pago';

SELECT '✅ Mercado Pago configurado!' as status;
