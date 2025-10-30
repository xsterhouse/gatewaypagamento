# 🔧 Guia: Configurar Supabase - Resolver Erro "Erro ao criar perfil do usuário"

## 🎯 Problema

Ao tentar criar conta de teste, aparece o erro:
```
Erro ao criar perfil do usuário
```

## 🔍 Causa

A tabela `users` no Supabase:
- ❌ Não existe
- ❌ Não tem permissões corretas (RLS)
- ❌ Não tem trigger para criar automaticamente

## ✅ Solução Completa

### 📋 Passo a Passo

---

### **Passo 1: Acessar Supabase Dashboard**

1. Acesse: https://supabase.com/dashboard
2. Faça login
3. Selecione seu projeto
4. Vá em **"SQL Editor"** no menu lateral

---

### **Passo 2: Executar SQL de Configuração**

1. No SQL Editor, clique em **"New query"**
2. Copie **TODO** o conteúdo do arquivo `supabase_setup.sql`
3. Cole no editor
4. Clique em **"Run"** (ou pressione Ctrl+Enter)
5. Aguarde a execução (deve levar 2-5 segundos)
6. ✅ Deve aparecer "Success. No rows returned"

---

### **Passo 3: Verificar se Funcionou**

#### Verificação 1: Tabela Criada
1. Vá em **"Table Editor"**
2. Procure a tabela **"users"**
3. ✅ Deve aparecer na lista

#### Verificação 2: Políticas RLS
1. Vá em **"Authentication"** → **"Policies"**
2. Selecione a tabela **"users"**
3. ✅ Deve ter 6 políticas:
   - Usuários podem ver próprio perfil
   - Usuários podem atualizar próprio perfil
   - Admins podem ver todos usuários
   - Admins podem atualizar todos usuários
   - Permitir insert para authenticated
   - Admins podem deletar usuários

#### Verificação 3: Trigger
1. Vá em **"Database"** → **"Triggers"**
2. ✅ Deve ter trigger: `on_auth_user_created`

---

### **Passo 4: Criar Usuário Admin**

#### Método 1: Via Dashboard (Recomendado)

1. Vá em **"Authentication"** → **"Users"**
2. Clique em **"Add user"** → **"Create new user"**
3. Preencha:
   - **Email**: seu_email@example.com
   - **Password**: sua_senha_forte (mínimo 8 caracteres)
   - **Auto Confirm User**: ✅ Marcar
4. Clique em **"Create user"**
5. Aguarde alguns segundos
6. Vá em **"Table Editor"** → **"users"**
7. ✅ Deve aparecer o usuário criado automaticamente (trigger!)

#### Método 2: Via SQL

```sql
-- No SQL Editor:
UPDATE public.users
SET role = 'admin'
WHERE email = 'seu_email@example.com';
```

---

### **Passo 5: Testar no Sistema**

#### Teste 1: Login
1. Acesse seu sistema
2. Vá em `/login`
3. Digite email e senha do admin criado
4. ✅ Deve fazer login com sucesso
5. ✅ Deve redirecionar para `/admin/dashboard`

#### Teste 2: Registro Novo Usuário
1. Faça logout
2. Vá em `/register`
3. Preencha todos os dados
4. Use código OTP da tela
5. ✅ Deve criar conta com sucesso
6. ✅ Deve fazer login automático
7. ✅ NÃO deve mostrar erro

---

## 🔍 Troubleshooting

### Erro: "relation public.users does not exist"

**Solução:**
1. A tabela não foi criada
2. Execute o SQL novamente
3. Verifique se está no projeto correto

### Erro: "permission denied for table users"

**Solução:**
1. RLS não está configurado
2. Execute o SQL novamente (seção de políticas)
3. Verifique se RLS está habilitado

### Erro: "duplicate key value violates unique constraint"

**Solução:**
1. Usuário já existe na tabela auth.users mas não em public.users
2. Execute:
   ```sql
   -- No SQL Editor:
   DELETE FROM auth.users WHERE email = 'email_do_usuario@example.com';
   ```
3. Tente criar novamente

### Trigger não funciona

**Solução:**
1. Vá em Database → Triggers
2. Verifique se `on_auth_user_created` existe
3. Se não existir, execute:
   ```sql
   -- Copie a seção 4 do supabase_setup.sql
   -- Execute no SQL Editor
   ```

---

## 📊 Estrutura da Tabela Users

```sql
users
├── id (UUID) - Primary Key, referência auth.users
├── email (TEXT) - Email do usuário (unique)
├── name (TEXT) - Nome completo
├── role (TEXT) - 'admin' ou 'user'
├── status (TEXT) - 'active', 'suspended', 'blocked'
├── document (TEXT) - CPF/CNPJ
├── document_type (TEXT) - 'cpf' ou 'cnpj'
├── company_name (TEXT) - Nome da empresa (CNPJ)
├── kyc_status (TEXT) - 'pending', 'approved', 'rejected'
├── kyc_submitted_at (TIMESTAMPTZ)
├── kyc_approved_at (TIMESTAMPTZ)
├── kyc_rejection_reason (TEXT)
├── two_fa_enabled (BOOLEAN)
├── two_fa_secret (TEXT)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

---

## 🔒 Políticas RLS Explicadas

### Para Usuários Normais:
- ✅ Pode **VER** próprio perfil
- ✅ Pode **ATUALIZAR** próprio perfil
- ✅ Pode **INSERIR** próprio perfil (registro)
- ❌ NÃO pode ver outros usuários
- ❌ NÃO pode atualizar outros usuários

### Para Admins:
- ✅ Pode **VER** todos usuários
- ✅ Pode **ATUALIZAR** todos usuários
- ✅ Pode **DELETAR** usuários
- ✅ Pode fazer tudo que usuário normal faz

---

## 🤖 Como o Trigger Funciona

```
1. Usuário se registra via auth.signUp()
   ↓
2. Supabase cria registro em auth.users
   ↓
3. TRIGGER detecta nova inserção
   ↓
4. TRIGGER cria registro em public.users automaticamente
   ↓
5. Sistema encontra usuário e faz login ✅
```

**Campos preenchidos automaticamente pelo trigger:**
- `id` → Mesmo ID do auth.users
- `email` → Email usado no registro
- `name` → Nome do metadata ou parte do email
- `role` → 'user' (pode mudar para admin depois)
- `status` → 'active'

---

## 📝 Comandos Úteis SQL

### Ver todos os usuários:
```sql
SELECT id, email, name, role, status, created_at
FROM public.users
ORDER BY created_at DESC;
```

### Contar usuários por role:
```sql
SELECT role, COUNT(*) as total
FROM public.users
GROUP BY role;
```

### Ver usuários pendentes de KYC:
```sql
SELECT email, name, kyc_status, kyc_submitted_at
FROM public.users
WHERE kyc_status = 'pending'
ORDER BY kyc_submitted_at DESC;
```

### Tornar usuário admin:
```sql
UPDATE public.users
SET role = 'admin'
WHERE email = 'email@example.com';
```

### Suspender usuário:
```sql
UPDATE public.users
SET status = 'suspended'
WHERE email = 'email@example.com';
```

### Ver último login:
```sql
SELECT u.email, u.name, au.last_sign_in_at
FROM public.users u
JOIN auth.users au ON u.id = au.id
ORDER BY au.last_sign_in_at DESC;
```

---

## 🎯 Checklist de Configuração

Antes de testar, confirme:

- [ ] Tabela `users` existe
- [ ] Tabela tem todas as colunas necessárias
- [ ] RLS está habilitado
- [ ] 6 políticas RLS estão ativas
- [ ] Trigger `on_auth_user_created` existe
- [ ] Trigger está habilitado
- [ ] Pelo menos 1 usuário admin criado
- [ ] Admin pode fazer login
- [ ] Novo usuário pode se registrar
- [ ] Registro cria entrada na tabela automaticamente

---

## 🚀 Próximos Passos

Após configurar:

1. **Teste completo:**
   - Criar novo usuário via /register
   - Fazer login
   - Verificar se dados aparecem
   - Testar impersonation (admin)

2. **Criar usuários de teste:**
   - 1 admin
   - 2-3 usuários normais
   - Testar diferentes cenários

3. **Verificar dados:**
   - Vá em Table Editor → users
   - Confirme que todos os campos estão preenchidos
   - Verifique timestamps

---

## 📞 Suporte

### Documentação Supabase:
- RLS: https://supabase.com/docs/guides/auth/row-level-security
- Triggers: https://supabase.com/docs/guides/database/postgres/triggers
- Auth: https://supabase.com/docs/guides/auth

### Logs de Erro:
1. No Supabase Dashboard
2. Vá em **"Logs"** → **"Postgres Logs"**
3. Veja erros em tempo real

---

## ✨ Resumo Rápido

```bash
# 1. Copiar SQL
cp supabase_setup.sql → clipboard

# 2. Supabase Dashboard
https://supabase.com/dashboard → SQL Editor

# 3. Colar e executar
Ctrl+V → Ctrl+Enter

# 4. Criar admin
Authentication → Users → Add user

# 5. Testar
/register → Preencher → ✅ Deve funcionar!
```

---

**✨ Após seguir estes passos, o erro "Erro ao criar perfil do usuário" será resolvido! ✨**
