-- ========================================
-- TESTES - BANCO INTER
-- ========================================
-- Execute estes comandos para verificar a configuração
-- ========================================

-- 1. Verificar se o Banco Inter está cadastrado
SELECT 
  '1️⃣ BANCO INTER CADASTRADO' as teste,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ SIM'
    ELSE '❌ NÃO - Execute CONFIGURAR_BANCO_INTER.sql'
  END as resultado
FROM bank_acquirers
WHERE bank_code = '077';

-- 2. Verificar configuração completa
SELECT 
  '2️⃣ CONFIGURAÇÃO COMPLETA' as teste,
  name,
  bank_code,
  is_active,
  environment,
  status,
  CASE 
    WHEN client_id IS NOT NULL AND client_id != '' AND NOT client_id LIKE 'SEU_%' 
    THEN '✅ Client ID OK'
    ELSE '❌ Client ID não configurado'
  END as client_id_status,
  CASE 
    WHEN client_secret IS NOT NULL AND client_secret != '' AND NOT client_secret LIKE 'SEU_%'
    THEN '✅ Client Secret OK'
    ELSE '❌ Client Secret não configurado'
  END as client_secret_status,
  CASE 
    WHEN pix_key IS NOT NULL AND pix_key != '' AND NOT pix_key LIKE 'SEU_%'
    THEN '✅ Chave PIX OK'
    ELSE '❌ Chave PIX não configurada'
  END as pix_key_status,
  CASE 
    WHEN account_number IS NOT NULL AND account_number != ''
    THEN '✅ Conta OK'
    ELSE '❌ Conta não configurada'
  END as account_status
FROM bank_acquirers
WHERE bank_code = '077';

-- 3. Verificar URLs da API
SELECT 
  '3️⃣ URLs DA API' as teste,
  api_base_url,
  api_auth_url,
  api_pix_url,
  CASE 
    WHEN api_base_url IS NOT NULL AND api_auth_url IS NOT NULL AND api_pix_url IS NOT NULL
    THEN '✅ URLs configuradas'
    ELSE '❌ URLs faltando'
  END as status
FROM bank_acquirers
WHERE bank_code = '077';

-- 4. Verificar limites e taxas
SELECT 
  '4️⃣ LIMITES E TAXAS' as teste,
  daily_limit as limite_diario,
  transaction_limit as limite_transacao,
  fee_percentage as taxa_percentual,
  fee_fixed as taxa_fixa,
  CASE 
    WHEN daily_limit > 0 AND transaction_limit > 0
    THEN '✅ Limites configurados'
    ELSE '⚠️ Verificar limites'
  END as status
FROM bank_acquirers
WHERE bank_code = '077';

-- 5. Verificar transações (se houver)
SELECT 
  '5️⃣ TRANSAÇÕES' as teste,
  COUNT(*) as total_transacoes,
  COUNT(*) FILTER (WHERE status = 'completed') as completadas,
  COUNT(*) FILTER (WHERE status = 'pending') as pendentes,
  COUNT(*) FILTER (WHERE status = 'failed') as falhas,
  COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as valor_total
FROM pix_transactions pt
WHERE EXISTS (
  SELECT 1 FROM bank_acquirers ba 
  WHERE ba.id::text = pt.acquirer_id 
  AND ba.bank_code = '077'
);

-- 6. Testar função de validação (se existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'validate_banco_inter_config'
  ) THEN
    RAISE NOTICE '6️⃣ FUNÇÃO DE VALIDAÇÃO: ✅ Existe';
  ELSE
    RAISE NOTICE '6️⃣ FUNÇÃO DE VALIDAÇÃO: ⚠️ Não existe - Execute CONFIGURAR_BANCO_INTER.sql';
  END IF;
END $$;

-- 7. Verificar view de estatísticas (se existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_views 
    WHERE viewname = 'banco_inter_stats'
  ) THEN
    RAISE NOTICE '7️⃣ VIEW DE ESTATÍSTICAS: ✅ Existe';
  ELSE
    RAISE NOTICE '7️⃣ VIEW DE ESTATÍSTICAS: ⚠️ Não existe - Execute CONFIGURAR_BANCO_INTER.sql';
  END IF;
END $$;

-- 8. Resumo final
SELECT 
  '8️⃣ RESUMO FINAL' as teste,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM bank_acquirers WHERE bank_code = '077') THEN '❌ Banco Inter não configurado'
    WHEN client_id LIKE 'SEU_%' OR client_secret LIKE 'SEU_%' THEN '⚠️ Credenciais não atualizadas'
    WHEN NOT is_active THEN '⚠️ Banco Inter inativo'
    ELSE '✅ Tudo OK - Pronto para usar!'
  END as status_geral,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM bank_acquirers WHERE bank_code = '077') THEN 'Execute CONFIGURAR_BANCO_INTER.sql'
    WHEN client_id LIKE 'SEU_%' OR client_secret LIKE 'SEU_%' THEN 'Atualize as credenciais no SQL'
    WHEN NOT is_active THEN 'Ative o banco: UPDATE bank_acquirers SET is_active = true WHERE bank_code = ''077'''
    ELSE 'Configure os certificados no Supabase e faça deploy das Edge Functions'
  END as proxima_acao
FROM bank_acquirers
WHERE bank_code = '077'
LIMIT 1;

-- ========================================
-- CHECKLIST
-- ========================================
-- 
-- ✅ Banco Inter cadastrado
-- ✅ Client ID configurado
-- ✅ Client Secret configurado
-- ✅ Chave PIX configurada
-- ✅ Conta bancária configurada
-- ✅ URLs da API configuradas
-- ✅ Limites e taxas definidos
-- ✅ Banco ativo
-- 
-- Próximos passos:
-- 1. Configure certificados no Supabase (Edge Functions)
-- 2. Deploy das Edge Functions
-- 3. Teste criando uma cobrança PIX
-- 
-- ========================================
