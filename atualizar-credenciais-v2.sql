-- Atualizar credenciais do Banco Inter (Novas Credenciais)
UPDATE bank_acquirers
SET 
  client_id = '4d6bc9a6-2ace-4c02-9081-325562b0bdc0',
  client_secret = '8e25bb66-b1e3-40e4-9673-d4997b8db8cd',
  environment = 'production',
  updated_at = NOW()
WHERE bank_code = '077';

-- Confirmar atualização
SELECT client_id, client_secret, updated_at FROM bank_acquirers WHERE bank_code = '077';
