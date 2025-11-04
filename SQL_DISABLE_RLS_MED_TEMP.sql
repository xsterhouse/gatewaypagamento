-- ========================================
-- DESABILITAR RLS TEMPORARIAMENTE (APENAS PARA TESTE!)
-- ========================================
-- ⚠️ ATENÇÃO: Use isso apenas para testar se o problema é RLS
-- ⚠️ NÃO DEIXE ASSIM EM PRODUÇÃO!
-- ========================================

-- Desabilitar RLS na tabela med_requests
ALTER TABLE med_requests DISABLE ROW LEVEL SECURITY;

-- Testar inserção
-- Após testar, execute o SQL_FIX_POLICIES_MED.sql para reativar com políticas corretas

-- ========================================
-- PARA REATIVAR O RLS DEPOIS DO TESTE:
-- ========================================
-- ALTER TABLE med_requests ENABLE ROW LEVEL SECURITY;
