-- Atualizar credenciais do Banco Inter com certeza de limpeza
-- Substitua os valores abaixo pelos seus dados reais

UPDATE bank_acquirers
SET 
  client_id = TRIM('a81d6aa1-b003-488f-8e54-d3917060c79f'), -- Substitua se necessário
  client_secret = TRIM('29ce1816-4d58-49fa-95e3-bf3fb727244c'), -- Substitua se necessário
  environment = 'production', -- Garante que é produção
  updated_at = NOW()
WHERE bank_code = '077';

-- Verificar se a atualização funcionou
SELECT client_id, environment FROM bank_acquirers WHERE bank_code = '077';
