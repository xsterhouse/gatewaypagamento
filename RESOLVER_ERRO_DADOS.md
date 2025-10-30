# ⚡ RESOLVER: Erro ao carregar dados do usuário

## 🎯 Problema
```
❌ Erro ao carregar dados do usuário
```

## 🔍 Causa Provável

Você criou o usuário no **Authentication → Users** do Supabase, mas o registro **NÃO foi criado** na tabela `public.users`.

### Por que isso acontece?
1. Trigger não funcionou
2. Trigger foi criado DEPOIS do usuário
3. Políticas RLS muito restritivas

---

## ⚡ SOLUÇÃO RÁPIDA (1 minuto)

### **PASSO 1:** Executar SQL de Correção

No Supabase SQL Editor:

```sql
-- Copie e execute ESTE SQL:

INSERT INTO public.users (id, email, name, role, status, kyc_status, created_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)) as name,
  'user' as role,
  'active' as status,
  'pending' as kyc_status,
  au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;
```

### **PASSO 2:** Tornar Admin (se necessário)

```sql
UPDATE public.users
SET role = 'admin'
WHERE email = 'admin@test.com';
```

### **PASSO 3:** Verificar

```sql
SELECT email, name, role, status 
FROM public.users 
ORDER BY created_at DESC;
```

**Resultado esperado:**
- ✅ Deve ver seu usuário na lista
- ✅ Role deve ser 'admin' ou 'user'
- ✅ Status deve ser 'active'

### **PASSO 4:** Testar Login

```
/login
Email: admin@test.com (ou seu email)
Senha: sua_senha
✅ Deve funcionar agora!
```

---

## 🔍 Diagnóstico Completo

Se ainda não funcionar, execute o diagnóstico:

### No SQL Editor:

```sql
-- 1. Ver usuários no auth.users
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;

-- 2. Ver usuários no public.users
SELECT id, email, role, status 
FROM public.users 
ORDER BY created_at DESC;

-- 3. Encontrar faltando (estão no auth mas não no public)
SELECT au.email, 'FALTANDO' as status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;
```

**Se aparecer usuários "FALTANDO":**
→ Execute o PASSO 1 novamente

---

## 🐛 Erros Comuns

### Erro: "permission denied for table users"

**Solução temporária:**
```sql
-- Desabilitar RLS temporariamente (APENAS TESTE)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
```

Depois de testar:
```sql
-- Habilitar RLS novamente
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

### Erro: "new row violates row-level security policy"

**Solução:**
```sql
-- Verificar se RLS está bloqueando
SELECT * FROM pg_policies WHERE tablename = 'users';

-- Se necessário, recriar política de INSERT:
DROP POLICY IF EXISTS "users_insert_own" ON public.users;

CREATE POLICY "users_insert_own"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (true);  -- Permite qualquer insert
```

### Erro: "column does not exist"

**Solução:**
```sql
-- Ver estrutura da tabela
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;
```

Se faltarem colunas, execute o `supabase_setup_fixed.sql` novamente.

---

## 📊 Verificar Estado Atual

### Checklist:

Execute cada query e confirme:

- [ ] **Tabela users existe?**
  ```sql
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
  );
  ```
  **Esperado:** `true`

- [ ] **Tem usuários no auth.users?**
  ```sql
  SELECT COUNT(*) FROM auth.users;
  ```
  **Esperado:** > 0

- [ ] **Tem usuários no public.users?**
  ```sql
  SELECT COUNT(*) FROM public.users;
  ```
  **Esperado:** > 0 (igual ao auth.users)

- [ ] **Trigger existe?**
  ```sql
  SELECT trigger_name FROM information_schema.triggers 
  WHERE event_object_table = 'users' 
  AND trigger_name = 'on_auth_user_created';
  ```
  **Esperado:** 1 linha

- [ ] **RLS habilitado?**
  ```sql
  SELECT relrowsecurity FROM pg_class 
  WHERE relname = 'users' AND relnamespace = 'public'::regnamespace;
  ```
  **Esperado:** `true`

- [ ] **Políticas ativas?**
  ```sql
  SELECT COUNT(*) FROM pg_policies WHERE tablename = 'users';
  ```
  **Esperado:** >= 6

---

## 🚀 Começar do Zero (se nada funcionar)

Se tudo falhou, recomece:

### 1. Deletar todos os usuários de teste:
```sql
-- CUIDADO: Isto apaga TODOS os usuários!
DELETE FROM public.users;
DELETE FROM auth.users;
```

### 2. Executar SQL limpo:
- Abra `supabase_setup_fixed.sql`
- Copie TUDO
- Execute no SQL Editor

### 3. Criar usuário via código (não via dashboard):
- Vá em `/register` no seu sistema
- Preencha os dados
- Use código OTP
- ✅ Deve criar automaticamente

### 4. Verificar:
```sql
SELECT * FROM public.users;
```

---

## 💡 Arquivos de Ajuda

| Arquivo | Quando Usar |
|---------|-------------|
| `CORRIGIR_AGORA.sql` | ⭐ Execute primeiro! |
| `diagnostico_usuarios.sql` | Se ainda não funcionar |
| `supabase_setup_fixed.sql` | Para recriar tudo do zero |

---

## 📞 Último Recurso

Se nada funcionar, execute:

```sql
-- 1. Desabilitar RLS temporariamente
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. Criar usuário manualmente
INSERT INTO public.users (
  id, 
  email, 
  name, 
  role, 
  status
) VALUES (
  'cole-id-do-auth-users-aqui',
  'admin@test.com',
  'Admin',
  'admin',
  'active'
);

-- 3. Testar login

-- 4. Habilitar RLS novamente
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

Para pegar o ID do auth.users:
```sql
SELECT id FROM auth.users WHERE email = 'admin@test.com';
```

---

## ✅ Resumo

**Ordem de execução:**

1. ✅ Execute `CORRIGIR_AGORA.sql`
2. ✅ Verifique se apareceu usuário
3. ✅ Tente fazer login
4. ✅ Se não funcionar, execute diagnóstico
5. ✅ Se ainda não funcionar, recrie do zero

---

**⚡ Execute o `CORRIGIR_AGORA.sql` primeiro! ⚡**
