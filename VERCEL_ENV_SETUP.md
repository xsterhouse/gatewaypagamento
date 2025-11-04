# 🚀 Configurar Variáveis de Ambiente na Vercel

## ❌ Erro: "supabaseUrl is required"

Se você está vendo este erro em produção, significa que as variáveis de ambiente do Supabase não foram configuradas na Vercel.

## ✅ Como Corrigir

### 1. Acesse o Painel da Vercel

1. Vá para: https://vercel.com
2. Faça login
3. Selecione seu projeto: **gatewaypagamento**

### 2. Configure as Variáveis de Ambiente

1. Clique em **Settings** (Configurações)
2. No menu lateral, clique em **Environment Variables**
3. Adicione as seguintes variáveis:

#### Variável 1: VITE_SUPABASE_URL
```
Name: VITE_SUPABASE_URL
Value: https://plbcnvnsvytzqrhgybjd.supabase.co
Environment: Production, Preview, Development (marque todas)
```

#### Variável 2: VITE_SUPABASE_ANON_KEY
```
Name: VITE_SUPABASE_ANON_KEY
Value: [SUA CHAVE ANON DO SUPABASE]
Environment: Production, Preview, Development (marque todas)
```

**⚠️ IMPORTANTE:** A chave anon está no seu Supabase:
- Acesse: https://supabase.com/dashboard
- Selecione seu projeto
- Vá em **Settings** → **API**
- Copie a **anon/public key**

### 3. Faça Redeploy

Após adicionar as variáveis:

1. Vá na aba **Deployments**
2. Clique nos 3 pontinhos do último deploy
3. Clique em **Redeploy**
4. Aguarde o build terminar

## 📋 Checklist

- [ ] VITE_SUPABASE_URL configurada
- [ ] VITE_SUPABASE_ANON_KEY configurada
- [ ] Ambas marcadas para Production, Preview e Development
- [ ] Redeploy realizado
- [ ] Site funcionando sem erros

## 🔍 Como Verificar se Funcionou

1. Acesse seu site em produção
2. Abra o Console do navegador (F12)
3. Se não houver erro "supabaseUrl is required", está funcionando! ✅

## 📸 Exemplo Visual

```
Vercel Dashboard
├── Settings
│   └── Environment Variables
│       ├── VITE_SUPABASE_URL = https://...
│       └── VITE_SUPABASE_ANON_KEY = eyJhbGc...
└── Deployments
    └── Redeploy (após adicionar variáveis)
```

## ⚠️ Erros Comuns

### Erro: "Variável não encontrada após redeploy"
**Solução:** Certifique-se de marcar **Production** ao adicionar a variável.

### Erro: "Invalid API key"
**Solução:** Verifique se copiou a chave **anon/public** correta do Supabase.

### Erro: "Site ainda com erro após redeploy"
**Solução:** 
1. Limpe o cache do navegador (Ctrl + Shift + Delete)
2. Aguarde 2-3 minutos para propagação
3. Tente em uma aba anônima

## 🆘 Precisa de Ajuda?

Se o erro persistir:
1. Verifique os logs do build na Vercel
2. Confirme que as variáveis estão visíveis em Settings → Environment Variables
3. Tente fazer um novo deploy (não redeploy)

## 📝 Variáveis Opcionais

### VITE_RESEND_API_KEY (Email)
```
Name: VITE_RESEND_API_KEY
Value: re_[sua_chave_resend]
Environment: Production, Preview, Development
```

**Nota:** Esta variável é opcional. Se não configurada, os emails não serão enviados, mas o sistema funcionará normalmente.

## ✅ Configuração Completa

Quando tudo estiver configurado, você verá:

```
Environment Variables (2)
✅ VITE_SUPABASE_URL
✅ VITE_SUPABASE_ANON_KEY

Latest Deployment: ✅ Ready
```

Pronto! Seu sistema está configurado e funcionando! 🎉
