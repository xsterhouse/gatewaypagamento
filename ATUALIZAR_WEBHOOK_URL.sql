-- ============================================
-- ATUALIZAR URL DO WEBHOOK NO MERCADO PAGO
-- ============================================

-- Atualizar URL do webhook para usar a URL direta (sem rewrite)
UPDATE public.bank_acquirers
SET 
  webhook_url = 'https://app.dimpay.com.br/api/mercadopago-webhook',
  webhook_enabled = true,
  webhook_events = '["payment"]'::jsonb
WHERE bank_code = 'MP';

-- Verificar
SELECT 
  name,
  bank_code,
  webhook_url,
  webhook_enabled,
  webhook_events
FROM public.bank_acquirers
WHERE bank_code = 'MP';
