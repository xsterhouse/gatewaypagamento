# 🔑 Credenciais para Vercel - Environment Variables

## 📋 Copie e Cole Exatamente Assim:

### Variável 1: VITE_SUPABASE_URL

**Name:**
```
VITE_SUPABASE_URL
```

**Value:**
```
https://plbcnvnsvytzqrhgybjd.supabase.co
```

**Environments:** Marque TODAS:
- ✅ Production
- ✅ Preview  
- ✅ Development

---

### Variável 2: VITE_SUPABASE_ANON_KEY

**Name:**
```
VITE_SUPABASE_ANON_KEY
```

**Value:** 
```
[VOCÊ PRECISA PEGAR ESTA CHAVE NO SUPABASE]
```

**Como pegar a chave:**
1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto: **plbcnvnsvytzqrhgybjd**
3. Vá em **Settings** (⚙️ no menu lateral)
4. Clique em **API**
5. Procure por **Project API keys**
6. Copie a chave **anon** / **public** (começa com `eyJhbGc...`)

**Environments:** Marque TODAS:
- ✅ Production
- ✅ Preview
- ✅ Development

---

## 🎯 Passo a Passo na Vercel:

### 1. Acesse a Vercel
- URL: https://vercel.com/dashboard
- Selecione o projeto: **gatewaypagamento**

### 2. Vá em Settings
- Clique em **Settings** no menu superior
- No menu lateral, clique em **Environment Variables**

### 3. Adicione a Primeira Variável
1. Clique em **Add New**
2. **Name:** `VITE_SUPABASE_URL`
3. **Value:** `https://plbcnvnsvytzqrhgybjd.supabase.co`
4. **Environments:** Marque Production, Preview, Development
5. Clique em **Save**

### 4. Adicione a Segunda Variável
1. Clique em **Add New** novamente
2. **Name:** `VITE_SUPABASE_ANON_KEY`
3. **Value:** Cole a chave que você copiou do Supabase
4. **Environments:** Marque Production, Preview, Development
5. Clique em **Save**

### 5. Faça Redeploy
1. Vá na aba **Deployments**
2. Clique nos **3 pontinhos (...)** do último deployment
3. Clique em **Redeploy**
4. Aguarde 2-5 minutos

---

## ✅ Verificação

Após o redeploy, acesse seu site e:
1. Abra o Console (F12)
2. Se não houver erro de "supabaseUrl is required", está funcionando!
3. Teste fazer login

---

## 🆘 Se Não Souber a Chave Anon

Execute este SQL no Supabase SQL Editor:

```sql
-- Verificar se você tem acesso
SELECT current_user;

-- Ver configurações do projeto
SELECT * FROM pg_settings WHERE name LIKE '%supabase%';
```

Ou simplesmente:
1. Vá em: https://supabase.com/dashboard/project/plbcnvnsvytzqrhgybjd/settings/api
2. A chave estará lá!

---

## 📝 Resumo das Variáveis

| Name | Value | Onde Pegar |
|------|-------|------------|
| `VITE_SUPABASE_URL` | `https://plbcnvnsvytzqrhgybjd.supabase.co` | ✅ Já está aqui |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGc...` | Supabase → Settings → API |

---

## ⚠️ IMPORTANTE

- ✅ Marque TODAS as environments (Production, Preview, Development)
- ✅ Faça redeploy após adicionar as variáveis
- ✅ Aguarde 2-5 minutos para o build completar
- ✅ Limpe o cache do navegador após o deploy

---

**Pronto! Depois de configurar, seu sistema vai funcionar perfeitamente na Vercel!** 🚀
