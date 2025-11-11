-- ============================================
-- ATIVAR MERCADO PAGO COMO PADRÃO
-- ============================================

-- Verificar se is_default está true
SELECT 
  id,
  name,
  bank_code,
  is_active,
  is_default,
  status
FROM public.bank_acquirers
WHERE bank_code = 'MP';

-- Se is_default não estiver true, atualizar:
UPDATE public.bank_acquirers
SET 
  is_active = true,
  is_default = true,
  status = 'active'
WHERE bank_code = 'MP';

-- Verificar novamente
SELECT 
  id,
  name,
  bank_code,
  is_active,
  is_default,
  status
FROM public.bank_acquirers
WHERE bank_code = 'MP';
