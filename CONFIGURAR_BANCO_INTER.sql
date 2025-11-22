-- ========================================
-- CONFIGURAÇÃO BANCO INTER
-- ========================================
-- Este script adiciona o Banco Inter como adquirente
-- para transações PIX e Boletos
-- ========================================

-- 1. Verificar se o Banco Inter já existe
DO $$ 
BEGIN
  -- Se não existir, inserir
  IF NOT EXISTS (SELECT 1 FROM bank_acquirers WHERE bank_code = '077') THEN
    INSERT INTO bank_acquirers (
      name,
      bank_code,
      description,
      pix_key,
      pix_key_type,
      account_number,
      account_digit,
      agency,
      agency_digit,
      client_id,
      client_secret,
      api_base_url,
      api_auth_url,
      api_pix_url,
      is_active,
      is_default,
      environment,
      status,
      daily_limit,
      transaction_limit,
      fee_percentage,
      fee_fixed,
      webhook_enabled
    ) VALUES (
      'Banco Inter',
      '077',
      'Banco Inter - PIX e Boletos',
      'SEU_CNPJ_AQUI', -- Substitua pela sua chave PIX
      'cnpj',
      '12345678', -- Substitua pelo número da sua conta
      '9',
      '0001',
      NULL,
      'SEU_CLIENT_ID_AQUI', -- Substitua pelo Client ID do Banco Inter
      'SEU_CLIENT_SECRET_AQUI', -- Substitua pelo Client Secret do Banco Inter
      'https://cdpj.partners.bancointer.com.br',
      'https://cdpj.partners.bancointer.com.br/oauth/v2/token',
      'https://cdpj.partners.bancointer.com.br/banking/v2/pix',
      true,
      false, -- Defina como true se quiser que seja o adquirente padrão
      'production', -- Use 'sandbox' para testes
      'active',
      100000.00, -- Limite diário: R$ 100.000,00
      10000.00,  -- Limite por transação: R$ 10.000,00
      0.50,      -- Taxa percentual: 0.5%
      0.00,      -- Taxa fixa: R$ 0,00
      true
    );
    RAISE NOTICE 'Banco Inter inserido com sucesso!';
  ELSE
    -- Se já existir, atualizar
    UPDATE bank_acquirers
    SET 
      name = 'Banco Inter',
      description = 'Banco Inter - PIX e Boletos',
      api_base_url = 'https://cdpj.partners.bancointer.com.br',
      api_auth_url = 'https://cdpj.partners.bancointer.com.br/oauth/v2/token',
      api_pix_url = 'https://cdpj.partners.bancointer.com.br/banking/v2/pix',
      is_active = true,
      status = 'active',
      updated_at = NOW()
    WHERE bank_code = '077';
    RAISE NOTICE 'Banco Inter atualizado com sucesso!';
  END IF;
END $$;

-- 2. Verificar se a tabela bank_acquirers tem todas as colunas necessárias
DO $$ 
BEGIN
  -- Adicionar coluna logo_url se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bank_acquirers' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE bank_acquirers ADD COLUMN logo_url TEXT;
  END IF;

  -- Adicionar coluna webhook_events se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bank_acquirers' AND column_name = 'webhook_events'
  ) THEN
    ALTER TABLE bank_acquirers ADD COLUMN webhook_events TEXT[];
  END IF;

  -- Adicionar coluna created_by se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bank_acquirers' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE bank_acquirers ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- 3. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_bank_acquirers_bank_code ON bank_acquirers(bank_code);
CREATE INDEX IF NOT EXISTS idx_bank_acquirers_is_active ON bank_acquirers(is_active);
CREATE INDEX IF NOT EXISTS idx_bank_acquirers_is_default ON bank_acquirers(is_default);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_acquirer_id ON pix_transactions(acquirer_id);

-- 4. Adicionar comentários para documentação
COMMENT ON COLUMN bank_acquirers.bank_code IS 'Código do banco (ex: 077 para Banco Inter)';
COMMENT ON COLUMN bank_acquirers.client_id IS 'Client ID da API do banco';
COMMENT ON COLUMN bank_acquirers.client_secret IS 'Client Secret da API do banco (criptografado)';
COMMENT ON COLUMN bank_acquirers.pix_key IS 'Chave PIX do banco para recebimentos';
COMMENT ON COLUMN bank_acquirers.environment IS 'Ambiente: sandbox ou production';

-- 5. Criar função para validar configuração do Banco Inter
CREATE OR REPLACE FUNCTION validate_banco_inter_config()
RETURNS TABLE (
  config_valid BOOLEAN,
  missing_fields TEXT[]
) AS $$
DECLARE
  acquirer RECORD;
  missing TEXT[] := ARRAY[]::TEXT[];
BEGIN
  SELECT * INTO acquirer
  FROM bank_acquirers
  WHERE bank_code = '077'
  LIMIT 1;

  IF acquirer IS NULL THEN
    RETURN QUERY SELECT false, ARRAY['Banco Inter não configurado']::TEXT[];
    RETURN;
  END IF;

  IF acquirer.client_id IS NULL OR acquirer.client_id = '' THEN
    missing := array_append(missing, 'client_id');
  END IF;

  IF acquirer.client_secret IS NULL OR acquirer.client_secret = '' THEN
    missing := array_append(missing, 'client_secret');
  END IF;

  IF acquirer.pix_key IS NULL OR acquirer.pix_key = '' THEN
    missing := array_append(missing, 'pix_key');
  END IF;

  IF acquirer.account_number IS NULL OR acquirer.account_number = '' THEN
    missing := array_append(missing, 'account_number');
  END IF;

  IF array_length(missing, 1) > 0 THEN
    RETURN QUERY SELECT false, missing;
  ELSE
    RETURN QUERY SELECT true, ARRAY[]::TEXT[];
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 6. Criar view para estatísticas do Banco Inter
CREATE OR REPLACE VIEW banco_inter_stats AS
SELECT 
  COUNT(*) FILTER (WHERE status = 'completed') as total_completed,
  COUNT(*) FILTER (WHERE status = 'pending') as total_pending,
  COUNT(*) FILTER (WHERE status = 'failed') as total_failed,
  COUNT(*) FILTER (WHERE transaction_type = 'deposit') as total_deposits,
  COUNT(*) FILTER (WHERE transaction_type = 'withdrawal') as total_withdrawals,
  SUM(amount) FILTER (WHERE status = 'completed' AND transaction_type = 'deposit') as total_deposit_amount,
  SUM(amount) FILTER (WHERE status = 'completed' AND transaction_type = 'withdrawal') as total_withdrawal_amount,
  SUM(fee_amount) FILTER (WHERE status = 'completed') as total_fees,
  DATE_TRUNC('day', created_at) as date
FROM pix_transactions pt
WHERE EXISTS (
  SELECT 1 FROM bank_acquirers ba 
  WHERE ba.id::text = pt.acquirer_id 
  AND ba.bank_code = '077'
)
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- 7. Exibir resultado da configuração
SELECT 
  'Banco Inter configurado com sucesso!' as message,
  name,
  bank_code,
  is_active,
  environment,
  status
FROM bank_acquirers
WHERE bank_code = '077';

-- 8. Verificar configuração
SELECT * FROM validate_banco_inter_config();

-- ========================================
-- INSTRUÇÕES DE USO
-- ========================================
-- 
-- 1. Substitua os valores marcados com "SEU_" pelas suas credenciais reais
-- 2. Execute este script no SQL Editor do Supabase
-- 3. Configure as variáveis de ambiente no Supabase:
--    - BANCO_INTER_CERTIFICATE (certificado em base64)
--    - BANCO_INTER_CERTIFICATE_KEY (chave privada em base64)
-- 4. Teste a integração com a função validate_banco_inter_config()
-- 
-- Para obter as credenciais:
-- - Acesse: https://developers.bancointer.com.br/
-- - Crie uma aplicação PIX
-- - Copie Client ID e Client Secret
-- - Configure certificado digital
-- 
-- ========================================
