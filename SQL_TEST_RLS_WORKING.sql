-- =================================================================
-- TESTE DE FUNCIONAMENTO RLS (Row Level Security)
-- =================================================================
-- Este script verifica se o isolamento de dados está funcionando.
-- Execute como um usuário NÃO-ADMIN para ver o resultado.

-- 1. Verificar seu próprio usuário
-- Deve retornar 1 linha (apenas você)
SELECT COUNT(*) as meu_usuario FROM users WHERE id = auth.uid();

-- 2. Tentar ver todos os usuários
-- Deve retornar 1 (apenas você)
SELECT COUNT(*) as total_usuarios_visiveis FROM users;

-- 3. Tentar ver todas as carteiras
-- Deve retornar apenas o número de SUAS carteiras
SELECT COUNT(*) as total_carteiras_visiveis FROM wallets;

-- 4. Tentar ver todas as transações
-- Deve retornar apenas o número de SUAS transações
SELECT COUNT(*) as total_transacoes_visiveis FROM transactions;

-- 5. Tentar ver todas as faturas
-- Deve retornar apenas o número de SUAS faturas
SELECT COUNT(*) as total_faturas_visiveis FROM invoices;

-- =================================================================
-- RESULTADO ESPERADO (para um cliente normal):
-- =================================================================
-- meu_usuario: 1
-- total_usuarios_visiveis: 1
-- total_carteiras_visiveis: [número de suas carteiras]
-- total_transacoes_visiveis: [número de suas transações]
-- total_faturas_visiveis: [número de suas faturas]
-- =================================================================
-- Se o resultado for diferente, as políticas RLS não estão funcionando.