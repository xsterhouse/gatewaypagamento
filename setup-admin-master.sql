-- ============================================
-- CONFIGURAÇÃO DO ADMIN MASTER
-- Email: admin@dimpay.com
-- Senha: Celso101020@
-- ============================================

-- 1. ATUALIZAR SENHA DO ADMIN
-- Execute este comando no SQL Editor do Supabase

-- Primeiro, encontre o UUID do admin
SELECT id, email, role FROM auth.users WHERE email = 'admin@dimpay.com';

-- Atualizar senha (substitua 'USER_UUID' pelo ID retornado acima)
UPDATE auth.users 
SET 
  encrypted_password = crypt('Celso101020@', gen_salt('bf')),
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = 'admin@dimpay.com';

-- 2. GARANTIR QUE O ADMIN ESTÁ CONFIRMADO
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  confirmed_at = NOW()
WHERE email = 'admin@dimpay.com';

-- 3. CRIAR/ATUALIZAR PERFIL DO ADMIN NA TABELA PROFILES
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
  id,
  email,
  'Admin Master',
  'admin',
  NOW(),
  NOW()
FROM auth.users 
WHERE email = 'admin@dimpay.com'
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'admin',
  full_name = 'Admin Master',
  updated_at = NOW();

-- 4. VERIFICAR CONFIGURAÇÃO
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  p.full_name,
  p.role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@dimpay.com';

-- ============================================
-- PERMISSÕES DO ADMIN MASTER
-- ============================================

-- O admin@dimpay.com terá as seguintes permissões:

-- ✅ CADASTRO E GESTÃO DE USUÁRIOS:
--    - Criar novos usuários
--    - Editar dados de usuários
--    - Excluir usuários
--    - Visualizar todos os usuários

-- ✅ GESTÃO DE DOCUMENTOS:
--    - Autorizar/Rejeitar documentos KYC
--    - Visualizar todos os documentos
--    - Fazer download de documentos

-- ✅ GESTÃO DE GERENTES:
--    - Criar contas de gerentes
--    - Atribuir permissões
--    - Editar/Excluir gerentes

-- ✅ GESTÃO DE CLIENTES:
--    - Visualizar todos os clientes
--    - Editar dados de clientes
--    - Excluir clientes
--    - Aprovar/Rejeitar cadastros

-- ✅ ACESSO TOTAL AO SISTEMA:
--    - Dashboard administrativo
--    - Relatórios completos
--    - Configurações do sistema
--    - Logs de auditoria

-- ============================================
-- SEGURANÇA
-- ============================================

-- A senha 'Celso101020@' atende aos requisitos:
-- ✅ Mínimo 8 caracteres
-- ✅ Letra maiúscula (C)
-- ✅ Letra minúscula (elso)
-- ✅ Número (101020)
-- ✅ Caractere especial (@)

-- IMPORTANTE: 
-- - Esta senha deve ser mantida em segredo
-- - Apenas o admin master deve ter acesso
-- - Recomenda-se ativar 2FA (autenticação de dois fatores)

-- ============================================
-- PRÓXIMOS PASSOS
-- ============================================

-- 1. Execute este script no Supabase SQL Editor
-- 2. Teste o login com admin@dimpay.com / Celso101020@
-- 3. Configure 2FA para maior segurança
-- 4. Documente as credenciais em local seguro
