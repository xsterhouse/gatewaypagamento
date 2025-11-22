-- ============================================
-- DESCOBRIR ESTRUTURA EXATA DA TABELA
-- ============================================

-- Passo 1: Ver TODAS as colunas da tabela bank_acquirers
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'bank_acquirers';

-- Passo 2: Ver dados existentes (se houver)
SELECT * FROM public.bank_acquirers LIMIT 10;

/*
INSTRUÇÕES:
1. Execute este SQL
2. Copie o resultado da primeira query (lista de colunas)
3. Me envie o resultado
4. Vou criar o INSERT correto com base nas colunas reais
*/
