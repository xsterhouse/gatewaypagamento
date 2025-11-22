-- =================================================
-- SCRIPT PARA REGISTRAR WEBHOOK DO BANCO INTER
-- =================================================
-- Execute este script no SQL Editor do Supabase

-- 1. Defina a URL do seu webhook
--    Esta é a URL da função que o Banco Inter vai chamar
set vars.webhook_url = 'https://plbcnvnsvytzqrhgybjd.supabase.co/functions/v1/banco-inter-webhook';

-- 2. Invoque a Edge Function para registrar o webhook
select
  net.http_post(
    url := 'https://plbcnvnsvytzqrhgybjd.supabase.co/functions/v1/banco-inter-register-webhook',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer seu_anon_key_aqui"}'::jsonb,
    body := jsonb_build_object('webhookUrl', current_setting('vars.webhook_url'))
  ) as response;

-- =================================================
-- SCRIPT PARA TESTAR OS CERTIFICADOS
-- =================================================
-- Execute este script para diagnosticar problemas com os certificados

select
  net.http_post(
    url := 'https://plbcnvnsvytzqrhgybjd.supabase.co/functions/v1/debug-cert',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer seu_anon_key_aqui"}'::jsonb,
    body := '{}'::jsonb
  ) as response;

-- =================================================
-- NOTAS:
-- 1. Substitua 'seu_anon_key_aqui' pela sua chave anônima (public) do Supabase.
-- 2. Após executar, verifique os logs da Edge Function no dashboard do Supabase.
-- 3. Se o registro for bem-sucedido, você verá uma mensagem de sucesso.
-- 4. Se falhar, os logs detalhados ajudarão a identificar o problema.