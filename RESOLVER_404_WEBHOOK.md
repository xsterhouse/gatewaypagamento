# 🔧 Resolver Erro 404 do Webhook - Guia Rápido

## ❌ Erro Atual
```
404: NOT_FOUND
Code: NOT_FOUND
ID: gru1::zv2rd-1762956747502-5917b9890eb6
```

## ✅ Solução em 3 Passos

### Passo 1: Build do Projeto

```bash
npm run build
```

Aguarde finalizar. Deve criar a pasta `dist/`.

### Passo 2: Deploy no Vercel

```bash
vercel --prod
```

**O que vai acontecer:**
1. Vercel vai perguntar algumas coisas (responda conforme abaixo)
2. Vai fazer upload dos arquivos
3. Vai retornar a URL do projeto

**Respostas sugeridas:**
- `Set up and deploy?` → **Y** (Yes)
- `Which scope?` → Escolha sua conta
- `Link to existing project?` → **N** (No) se for primeira vez, **Y** se já existe
- `What's your project's name?` → `gatewaypagamento` (ou outro nome)
- `In which directory is your code located?` → `./` (deixe padrão)
- `Want to override the settings?` → **N** (No)

### Passo 3: Configurar Variáveis de Ambiente

**Acesse:** https://vercel.com/dashboard

1. Clique no seu projeto
2. Vá em **Settings** (⚙️)
3. Clique em **Environment Variables**
4. Adicione CADA variável abaixo:

```
Nome: VITE_SUPABASE_URL
Valor: https://swokojvoiqowqoyngues.supabase.co

Nome: VITE_SUPABASE_ANON_KEY
Valor: [sua anon key do Supabase]

Nome: SUPABASE_SERVICE_ROLE_KEY
Valor: [sua service role key do Supabase - DIFERENTE da anon key]

Nome: MERCADO_PAGO_ACCESS_TOKEN
Valor: [seu access token do Mercado Pago]

Nome: VITE_MERCADO_PAGO_ACCESS_TOKEN
Valor: [mesmo access token do Mercado Pago]
```

⚠️ **IMPORTANTE**: 
- Marque **Production**, **Preview** e **Development** para cada variável
- A `SUPABASE_SERVICE_ROLE_KEY` está em: Supabase → Settings → API → **service_role** (secret)

### Passo 4: Redeploy

Após adicionar as variáveis, faça um novo deploy:

```bash
vercel --prod
```

### Passo 5: Obter a URL

Após o deploy, copie a URL que aparece:
```
✅ Production: https://seu-projeto-abc123.vercel.app
```

### Passo 6: Testar o Webhook

Abra o navegador ou use cURL:

```bash
curl https://seu-projeto-abc123.vercel.app/api/mercadopago/webhook
```

**Deve retornar:**
```json
{
  "status": "ok",
  "message": "Webhook endpoint is ready"
}
```

Se retornar isso, **FUNCIONOU!** ✅

### Passo 7: Configurar no Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Selecione sua aplicação
3. Vá em **Webhooks**
4. Cole a URL: `https://seu-projeto-abc123.vercel.app/api/mercadopago/webhook`
5. Selecione eventos: **Pagamentos**
6. Clique em **Testar**
7. Deve retornar: **✅ 200 - OK**

## 🎯 Resumo dos Comandos

```bash
# 1. Build
npm run build

# 2. Deploy
vercel --prod

# 3. Após configurar variáveis no dashboard, redeploy
vercel --prod

# 4. Testar
curl https://sua-url.vercel.app/api/mercadopago/webhook
```

## 🐛 Se Ainda Der Erro

### Erro: "Build failed"

**Solução:**
```bash
# Limpar cache e reinstalar
rm -rf node_modules dist
npm install
npm run build
vercel --prod
```

### Erro: "Function invocation failed"

**Causa**: Variáveis de ambiente não configuradas

**Solução**:
1. Verifique se TODAS as variáveis foram adicionadas no Vercel Dashboard
2. Redeploy: `vercel --prod`

### Erro: Ainda retorna 404

**Verificar arquivo vercel.json:**

Deve ter este conteúdo:
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

Se não tiver, o arquivo já existe e está correto no seu projeto.

### Testar URL direta (sem rewrite):

```bash
curl https://sua-url.vercel.app/api/mercadopago_webhook
```

## 📞 Precisa de Ajuda?

1. **Ver logs do deploy:**
   ```bash
   vercel logs
   ```

2. **Ver status do projeto:**
   - Acesse: https://vercel.com/dashboard
   - Clique no projeto
   - Veja **Deployments** → último deploy
   - Clique em **Functions** para ver logs

3. **Verificar se variáveis estão configuradas:**
   - Dashboard → Projeto → Settings → Environment Variables
   - Deve ter 5 variáveis listadas

## ✅ Checklist Final

- [ ] `npm run build` executado com sucesso
- [ ] `vercel --prod` executado com sucesso
- [ ] URL do projeto obtida (https://...)
- [ ] 5 variáveis de ambiente configuradas no Vercel Dashboard
- [ ] Redeploy feito após configurar variáveis
- [ ] Teste GET retorna `{"status":"ok"}`
- [ ] URL configurada no painel Mercado Pago
- [ ] Teste do Mercado Pago retorna 200 OK

---

**Tempo estimado**: 10-15 minutos  
**Dificuldade**: Fácil  
**Status**: Pronto para executar
