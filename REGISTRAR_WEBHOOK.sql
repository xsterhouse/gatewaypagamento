-- ==================================================
-- REGISTRAR WEBHOOK BANCO INTER
-- ==================================================

-- 0. Ativar extensão HTTP (necessário)
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";

-- 1. Descobrir a URL do seu projeto Supabase
-- Substitua 'SUA_PROJECT_REF' pelo ID do seu projeto (ex: plbcnvnsvytzqrhgybjd)
-- A URL será: https://SUA_PROJECT_REF.supabase.co/functions/v1/banco-inter-webhook

DO $$
DECLARE
  project_ref text := 'plbcnvnsvytzqrhgybjd'; -- SEU PROJECT REF AQUI
  webhook_url text;
  register_url text;
  response_status int;
  response_body text;
  request_id int;
BEGIN
  webhook_url := 'https://' || project_ref || '.supabase.co/functions/v1/banco-inter-webhook';
  register_url := 'https://' || project_ref || '.supabase.co/functions/v1/banco-inter-register-webhook';

  RAISE NOTICE 'Tentando registrar webhook: %', webhook_url;

  -- Chamar a Edge Function para registrar usando a extensão http
  -- Nota: Removido o cast explícito que estava dando erro
  SELECT 
    status,
    content::text
  INTO
    response_status,
    response_body
  FROM
    extensions.http((
      'POST',
      register_url,
      ARRAY[extensions.http_header('Content-Type', 'application/json')],
      'application/json',
      json_build_object('webhookUrl', webhook_url)::text
    ));

  RAISE NOTICE 'Status: %', response_status;
  RAISE NOTICE 'Resposta: %', response_body;

  IF response_status = 200 THEN
    RAISE NOTICE '✅ Webhook registrado com sucesso!';
  ELSE
    RAISE NOTICE '❌ Erro ao registrar webhook.';
  END IF;

END $$;
