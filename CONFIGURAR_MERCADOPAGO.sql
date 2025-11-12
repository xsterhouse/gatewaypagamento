-- ========================================
-- CONFIGURAÇÃO DO ADQUIRENTE MERCADO PAGO
-- ========================================
-- Este script configura o Mercado Pago como adquirente padrão
-- para processar pagamentos PIX reais.
--
-- IMPORTANTE: Execute este script no Supabase SQL Editor
-- ========================================

-- 1. Verificar se já existe um adquirente Mercado Pago
SELECT * FROM bank_acquirers WHERE bank_code = 'MP';

-- 2. Atualizar adquirente Mercado Pago se já existir
UPDATE bank_acquirers
SET 
  name = 'Mercado Pago',
  pix_key = 'contato@dimpay.com.br',
  pix_key_type = 'email',
  is_active = true,
  is_default = true,
  environment = 'production',
  status = 'active',
  description = 'Gateway de pagamento Mercado Pago para PIX',
  fee_percentage = 0.035,  -- 3.5% de taxa
  fee_fixed = 0.60,        -- Taxa mínima de R$ 0,60
  transaction_limit = 10000,  -- Limite de R$ 10.000 por transação
  daily_limit = 50000,        -- Limite diário de R$ 50.000
  updated_at = now()
WHERE bank_code = 'MP';

-- 3. Criar o adquirente Mercado Pago se NÃO existir
INSERT INTO bank_acquirers (
  name,
  bank_code,
  pix_key,
  pix_key_type,
  is_active,
  is_default,
  environment,
  status,
  description,
  fee_percentage,
  fee_fixed,
  transaction_limit,
  daily_limit
)
SELECT 
  'Mercado Pago',
  'MP',
  'contato@dimpay.com.br',
  'email',
  true,
  true,
  'production',
  'active',
  'Gateway de pagamento Mercado Pago para PIX',
  0.035,  -- 3.5% de taxa
  0.60,   -- Taxa mínima de R$ 0,60
  10000,  -- Limite de R$ 10.000 por transação
  50000   -- Limite diário de R$ 50.000
WHERE NOT EXISTS (
  SELECT 1 FROM bank_acquirers WHERE bank_code = 'MP'
);

-- 4. Desativar outros adquirentes como padrão (opcional)
UPDATE bank_acquirers 
SET is_default = false 
WHERE bank_code != 'MP';

-- 5. Verificar configuração final
SELECT 
  id,
  name,
  bank_code,
  is_active,
  is_default,
  environment,
  status,
  fee_percentage,
  fee_fixed,
  created_at
FROM bank_acquirers
ORDER BY is_default DESC, name;

-- ========================================
-- RESULTADO ESPERADO:
-- ========================================
-- Você deve ver o Mercado Pago como:
-- - is_active: true
-- - is_default: true
-- - status: active
-- - environment: production
-- ========================================
