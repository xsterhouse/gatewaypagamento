-- ================================================
-- POLÍTICAS RLS SUPER SIMPLES - GARANTIDO FUNCIONAR
-- ================================================

-- PASSO 1: Limpar tudo
-- ================================================

-- Deletar TODAS as políticas
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.users';
    END LOOP;
END $$;

-- ================================================
-- PASSO 2: Desabilitar RLS
-- ================================================

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- ================================================
-- PASSO 3: TESTAR LOGIN AGORA
-- ================================================
-- Com RLS desabilitado, o login DEVE funcionar
-- Tente fazer login antes de continuar
-- ================================================

-- Verificar usuários
SELECT 
  email,
  role,
  status,
  '✅ Tente fazer login AGORA' as acao
FROM public.users
ORDER BY role DESC;

-- ================================================
-- PASSO 4: SE LOGIN FUNCIONOU, crie políticas simples
-- ================================================

-- Habilitar RLS novamente
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- POLÍTICA MAIS SIMPLES POSSÍVEL: Todo mundo autenticado vê tudo
CREATE POLICY "allow_all_authenticated"
ON public.users
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ================================================
-- RESULTADO:
-- ================================================
-- ✅ RLS habilitado
-- ✅ 1 política super permissiva
-- ✅ Qualquer usuário autenticado vê todos os dados
-- ✅ Login deve funcionar perfeitamente
-- 
-- NOTA: Esta política é MUITO permissiva
-- Funciona para desenvolvimento/teste
-- Para produção, ajuste depois
-- ================================================

-- Verificar
SELECT 
  'RLS Status:' as info,
  CASE 
    WHEN rowsecurity THEN '✅ Habilitado'
    ELSE '❌ Desabilitado'
  END as status
FROM pg_tables
WHERE tablename = 'users';

SELECT 
  'Políticas ativas:' as info,
  COUNT(*) as total
FROM pg_policies
WHERE tablename = 'users';
