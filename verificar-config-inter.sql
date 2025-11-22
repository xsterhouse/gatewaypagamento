-- Verificar configuração do Banco Inter
SELECT 
  id,
  name,
  bank_code,
  client_id,
  -- Não mostramos o secret completo por segurança
  left(client_secret, 5) || '...' as client_secret_prefix,
  environment,
  api_auth_url,
  api_pix_url,
  pix_key,
  is_active
FROM bank_acquirers 
WHERE bank_code = '077';
