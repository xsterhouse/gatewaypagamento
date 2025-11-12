# 🚀 Deploy no Vercel - Guia Rápido

## ❌ Erro Atual

```
404: NOT_FOUND
Code: NOT_FOUND
```

**Causa**: O código não foi deployado no Vercel ou as rotas não estão configuradas.

## ✅ Solução: Deploy Completo

### 1. Instalar Vercel CLI (se não tiver)

```bash
npm install -g vercel
```

### 2. Login no Vercel

```bash
vercel login
```

Escolha uma opção:
- GitHub
- GitLab
- Bitbucket
- Email

### 3. Fazer Deploy

**Primeira vez (criar projeto):**
```bash
vercel
```

Responda as perguntas:
- Set up and deploy? **Y**
- Which scope? Escolha sua conta
- Link to existing project? **N**
- What's your project's name? `gatewaypagamento` (ou outro nome)
- In which directory is your code located? `./`
- Want to override the settings? **N**

**Deploy em produção:**
```bash
vercel --prod
```

### 4. Configurar Variáveis de Ambiente

**Opção A: Via CLI**
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add MERCADO_PAGO_ACCESS_TOKEN
vercel env add VITE_MERCADO_PAGO_ACCESS_TOKEN
```

**Opção B: Via Dashboard**
1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Adicione cada variável:

```
VITE_SUPABASE_URL = https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY = sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY = sua_service_role_key_aqui
MERCADO_PAGO_ACCESS_TOKEN = seu_access_token_aqui
VITE_MERCADO_PAGO_ACCESS_TOKEN = seu_access_token_aqui
```

⚠️ **IMPORTANTE**: Marque para aplicar em **Production**, **Preview** e **Development**

### 5. Redeploy Após Adicionar Variáveis

```bash
vercel --prod
```

### 6. Obter URL do Projeto

Após o deploy, você verá:
```
✅ Production: https://seu-projeto.vercel.app
```

### 7. Testar o Webhook

**Teste GET:**
```bash
curl https://seu-projeto.vercel.app/api/mercadopago/webhook
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "message": "Webhook endpoint is ready"
}
```

Se retornar isso, está funcionando! ✅

## 🔍 Verificar Deploy

### Ver logs em tempo real:
```bash
vercel logs seu-projeto.vercel.app
```

### Ver lista de deploys:
```bash
vercel ls
```

### Ver detalhes do projeto:
```bash
vercel inspect seu-projeto.vercel.app
```

## 🐛 Troubleshooting

### Erro: "Command not found: vercel"

**Solução:**
```bash
npm install -g vercel
```

### Erro: "No token found"

**Solução:**
```bash
vercel login
```

### Erro: 404 após deploy

**Causa**: Arquivo `vercel.json` pode estar incorreto

**Solução**: Verificar se o arquivo existe e está correto:
```json
{
  "rewrites": [
    {
      "source": "/api/mercadopago/webhook",
      "destination": "/api/mercadopago_webhook"
    }
  ]
}
```

### Erro: 500 Internal Server Error

**Causa**: Variáveis de ambiente não configuradas

**Solução**:
1. Adicione as variáveis no Vercel Dashboard
2. Redeploy: `vercel --prod`

### Webhook ainda retorna 404

**Verificar**:
1. Arquivo existe: `api/mercadopago_webhook.ts` ✅
2. Deploy foi feito: `vercel --prod` ✅
3. URL correta: `/api/mercadopago/webhook` (com rewrite)

**Testar URL direta** (sem rewrite):
```bash
curl https://seu-projeto.vercel.app/api/mercadopago_webhook
```

## 📋 Checklist Completo

- [ ] Vercel CLI instalado
- [ ] Login feito (`vercel login`)
- [ ] Deploy inicial (`vercel`)
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy em produção (`vercel --prod`)
- [ ] URL obtida (https://seu-projeto.vercel.app)
- [ ] Teste GET funcionando
- [ ] Webhook configurado no Mercado Pago

## 🎯 Comandos Rápidos

```bash
# Deploy completo
npm run build
vercel --prod

# Ver logs
vercel logs

# Ver variáveis de ambiente
vercel env ls

# Remover projeto (se precisar recomeçar)
vercel remove seu-projeto
```

## 🔗 Links Úteis

- **Dashboard Vercel**: https://vercel.com/dashboard
- **Documentação**: https://vercel.com/docs
- **CLI Reference**: https://vercel.com/docs/cli

## 💡 Dica Importante

Após configurar as variáveis de ambiente no Vercel Dashboard, **SEMPRE faça um redeploy**:

```bash
vercel --prod
```

As variáveis só são aplicadas em novos deploys!

---

**Próximo passo**: Após o deploy funcionar, configure a URL no painel do Mercado Pago.
