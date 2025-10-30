# ⚡ Solução Rápida: "Erro ao criar perfil do usuário"

## 🎯 Problema
```
Erro ao criar perfil do usuário
```

## ✅ Solução em 5 Minutos

### **PASSO 1:** Copiar SQL
Abra o arquivo: `supabase_setup.sql`
- Copie **TODO** o conteúdo (Ctrl+A, Ctrl+C)

### **PASSO 2:** Acessar Supabase
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Clique em **"SQL Editor"** (ícone de database no menu)

### **PASSO 3:** Executar SQL
1. Clique em **"New query"**
2. Cole o SQL (Ctrl+V)
3. Clique em **"Run"** (ou Ctrl+Enter)
4. ✅ Deve aparecer "Success"

### **PASSO 4:** Criar Admin
1. Vá em **"Authentication"** → **"Users"**
2. Clique em **"Add user"** → **"Create new user"**
3. Preencha:
   - Email: `admin@test.com`
   - Password: `admin123456`
   - Auto Confirm User: ✅ **MARCAR**
4. Clique em **"Create user"**

### **PASSO 5:** Tornar Admin
No SQL Editor, execute:
```sql
UPDATE public.users
SET role = 'admin'
WHERE email = 'admin@test.com';
```

### **PASSO 6:** Testar
1. Acesse seu sistema
2. Login com:
   - Email: `admin@test.com`
   - Senha: `admin123456`
3. ✅ Deve funcionar!

---

## 📋 Checklist Rápido

Antes de testar:
- [ ] SQL executado no Supabase
- [ ] Tabela `users` criada
- [ ] Trigger ativo
- [ ] RLS habilitado
- [ ] Admin criado
- [ ] Role admin configurado

---

## 🧪 Testar Agora

### Teste 1: Login Admin
```
/login
Email: admin@test.com
Senha: admin123456
✅ Deve entrar no painel admin
```

### Teste 2: Registro Novo
```
/register
Preencher dados
Usar código OTP da tela
✅ Deve criar conta sem erro
```

---

## 🐛 Se Ainda Der Erro

### Erro: "Tabela users não existe"
```sql
-- Execute no SQL Editor:
CREATE TABLE public.users ...
-- (copie seção 1 do supabase_setup.sql)
```

### Erro: "Permissões incorretas"
```sql
-- Execute no SQL Editor:
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- (copie seção 5 do supabase_setup.sql)
```

### Ver Logs de Erro
1. Pressione F12 no navegador
2. Aba "Console"
3. Veja detalhes do erro
4. Código do erro aparece (ex: 42P01)

---

## 💡 O Que Foi Feito

### No Supabase:
- ✅ Criou tabela `users`
- ✅ Configurou 6 políticas RLS
- ✅ Criou trigger automático
- ✅ Criou índices

### No Código:
- ✅ Mensagens de erro mais claras
- ✅ Mostra código de erro específico
- ✅ Logs detalhados no console

---

## 📊 Verificar se Funcionou

### Ver na Tabela:
1. Supabase Dashboard
2. **"Table Editor"** → **"users"**
3. ✅ Deve ter registros de usuários

### Ver Políticas:
1. **"Authentication"** → **"Policies"**
2. Tabela: **"users"**
3. ✅ Deve ter 6 políticas ativas

### Ver Trigger:
1. **"Database"** → **"Triggers"**
2. ✅ Deve ter `on_auth_user_created`

---

## 🎉 Resultado Esperado

Após configurar:
- ✅ Registro funciona sem erro
- ✅ Login funciona
- ✅ Dados aparecem corretamente
- ✅ Admin pode acessar painel
- ✅ Usuários podem se registrar

---

## 📚 Documentação Completa

Para mais detalhes, veja:
- `SUPABASE_CONFIG_GUIDE.md` - Guia completo
- `supabase_setup.sql` - SQL comentado

---

**⚡ Execute os 6 passos e está resolvido! ⚡**
