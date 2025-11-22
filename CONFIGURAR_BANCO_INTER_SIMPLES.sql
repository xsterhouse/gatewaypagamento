-- ========================================
-- CONFIGURAÇÃO RÁPIDA BANCO INTER
-- ========================================
-- Execute este script APÓS substituir os valores marcados
-- ========================================

-- ⚠️ IMPORTANTE: Substitua os valores abaixo antes de executar!
-- 
-- SEU_CLIENT_ID_AQUI       → Client ID do portal Banco Inter
-- SEU_CLIENT_SECRET_AQUI   → Client Secret do portal Banco Inter
-- SEU_CNPJ_AQUI           → Sua chave PIX (CNPJ)
-- 12345678                → Número da sua conta (sem dígito)
-- 9                       → Dígito da conta
-- 0001                    → Agência

-- Verificar se já existe e inserir/atualizar
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM bank_acquirers WHERE bank_code = '077') THEN
    -- INSERIR NOVO
    INSERT INTO bank_acquirers (
      name,
      bank_code,
      description,
      pix_key,
      pix_key_type,
      account_number,
      account_digit,
      agency,
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
      'SEU_CNPJ_AQUI',
      'cnpj',
      '12345678',
      '9',
      '0001',
      'SEU_CLIENT_ID_AQUI',
      'SEU_CLIENT_SECRET_AQUI',
      'https://cdpj.partners.bancointer.com.br',
      'https://cdpj.partners.bancointer.com.br/oauth/v2/token',
      'https://cdpj.partners.bancointer.com.br/banking/v2/pix',
      true,
      false,
      'production',
      'active',
      100000.00,
      10000.00,
      0.50,
      0.00,
      true
    );
    RAISE NOTICE '✅ Banco Inter inserido com sucesso!';
  ELSE
    -- ATUALIZAR EXISTENTE
    UPDATE bank_acquirers
    SET 
      client_id = 'SEU_CLIENT_ID_AQUI',
      client_secret = 'SEU_CLIENT_SECRET_AQUI',
      pix_key = 'SEU_CNPJ_AQUI',
      account_number = '12345678',
      account_digit = '9',
      agency = '0001',
      is_active = true,
      status = 'active',
      updated_at = NOW()
    WHERE bank_code = '077';
    RAISE NOTICE '✅ Banco Inter atualizado com sucesso!';
  END IF;
END $$;

-- Verificar configuração
SELECT 
  '✅ CONFIGURAÇÃO ATUAL' as status,
  name,
  bank_code,
  is_active,
  environment,
  status,
  CASE 
    WHEN client_id LIKE 'SEU_%' THEN '❌ Não configurado'
    ELSE '✅ Configurado'
  END as credenciais,
  CASE 
    WHEN pix_key LIKE 'SEU_%' THEN '❌ Não configurado'
    ELSE '✅ Configurado'
  END as chave_pix
FROM bank_acquirers
WHERE bank_code = '077';

-- ========================================
-- PRÓXIMOS PASSOS
-- ========================================
-- 
-- 1. Configure os secrets no Supabase (Edge Functions):
--    - BANCO_INTER_CERTIFICATE (certificado em base64)
--    - BANCO_INTER_CERTIFICATE_KEY (chave privada em base64)
--    - BANCO_INTER_ACCOUNT_NUMBER (número da conta)
--
-- 2. Deploy das Edge Functions:
--    supabase functions deploy banco-inter-create-pix
--    supabase functions deploy banco-inter-send-pix
--    supabase functions deploy banco-inter-create-boleto
--
-- 3. Teste a configuração:
--    SELECT * FROM validate_banco_inter_config();
--
-- ========================================
