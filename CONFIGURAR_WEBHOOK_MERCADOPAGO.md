# 🔔 Configurar Webhook do Mercado Pago

## 📋 Problema

Ao testar o webhook no painel do Mercado Pago, aparece erro:
```
404 - Not Found
Não foi possível encontrar o URL informado.
```

## ✅ Solução Implementada

### 1. Correções no Endpoint

O endpoint `/api/mercadopago_webhook.ts` foi corrigido para:
- ✅ Aceitar requisições **GET** (teste do Mercado Pago)
- ✅ Aceitar requisições **POST** (notificações reais)
- ✅ Suportar campo `action` (payment.created, payment.updated)
- ✅ Buscar transação por `pix_txid` (ID do Mercado Pago)

### 2. URL do Webhook

**Para Produção (Vercel):**
```
https://seu-dominio.vercel.app/api/mercadopago/webhook
```

**Para Desenvolvimento Local (ngrok):**
```
https://seu-id.ngrok.io/api/mercadopago/webhook
```

## 🚀 Como Configurar

### Opção A: Deploy em Produção (Recomendado)

1. **Fazer deploy no Vercel:**
```bash
npm run build
vercel --prod
```

2. **Configurar variáveis de ambiente no Vercel:**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` ⚠️ (Service Role Key)
   - `MERCADO_PAGO_ACCESS_TOKEN`

3. **Configurar webhook no Mercado Pago:**
   - Acesse: https://www.mercadopago.com.br/developers/panel/app
   - Vá em sua aplicação → **Webhooks**
   - URL de produção: `https://app.dimpay.com.br/api/mercadopago/webhook`
   - Eventos: Selecione **Pagamentos**
   - Clique em **Testar** - deve retornar **200 OK**

### Opção B: Testar Localmente com ngrok

1. **Instalar ngrok:**
```bash
# Windows (com Chocolatey)
choco install ngrok

# Ou baixe em: https://ngrok.com/download
```

2. **Iniciar servidor local:**
```bash
npm run dev
```

3. **Criar túnel ngrok:**
```bash
ngrok http 5173
```

4. **Copiar URL do ngrok:**
```
Forwarding: https://abc123.ngrok.io -> http://localhost:5173
```

5. **Configurar no Mercado Pago:**
   - URL: `https://abc123.ngrok.io/api/mercadopago/webhook`
   - ⚠️ **IMPORTANTE**: Você precisa criar variáveis de ambiente no servidor local também

## 🔐 Variáveis de Ambiente Necessárias

### No arquivo `.env` (local):
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
MERCADO_PAGO_ACCESS_TOKEN=seu_access_token
VITE_MERCADO_PAGO_ACCESS_TOKEN=seu_access_token
```

### No Vercel (produção):
Adicione as mesmas variáveis em:
**Settings → Environment Variables**

⚠️ **ATENÇÃO**: A `SUPABASE_SERVICE_ROLE_KEY` é diferente da `ANON_KEY`!
- Encontre em: Supabase → Settings → API → **service_role key** (secret)

## 🧪 Testar o Webhook

### 1. Teste Manual via cURL:

**Teste GET (validação):**
```bash
curl https://seu-app.vercel.app/api/mercadopago/webhook
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "message": "Webhook endpoint is ready"
}
```

**Teste POST (simulação):**
```bash
curl -X POST https://seu-app.vercel.app/api/mercadopago/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "action": "payment.updated",
    "data": {"id": "123456"},
    "type": "payment"
  }'
```

### 2. Teste no Painel Mercado Pago:

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Vá em **Webhooks**
3. Clique em **Testar**
4. Deve retornar: **✅ 200 - OK**

### 3. Teste Real:

1. Gere um PIX no seu sistema
2. Pague com app bancário (pode ser valor mínimo, ex: R$ 0,01)
3. Aguarde alguns segundos
4. Verifique os logs no Vercel ou console

## 📊 Verificar Logs

### No Vercel:
1. Acesse: https://vercel.com/seu-usuario/seu-projeto
2. Vá em **Deployments** → Último deploy
3. Clique em **Functions** → `api/mercadopago_webhook`
4. Veja os logs em tempo real

### No Supabase:
```sql
-- Ver logs de webhook
SELECT * FROM webhook_logs 
ORDER BY processed_at DESC 
LIMIT 10;

-- Ver transações PIX recentes
SELECT 
  id,
  amount,
  status,
  pix_txid,
  created_at
FROM pix_transactions
ORDER BY created_at DESC
LIMIT 10;
```

## 🐛 Troubleshooting

### Erro: 404 Not Found

**Causa**: URL incorreta ou endpoint não deployado

**Solução**:
1. Verifique se o arquivo existe: `api/mercadopago_webhook.ts`
2. Faça deploy: `vercel --prod`
3. Confirme a URL: `https://app.dimpay.com.br/api/mercadopago/webhook`

### Erro: 500 Internal Server Error

**Causa**: Variáveis de ambiente não configuradas

**Solução**:
1. Verifique no Vercel: Settings → Environment Variables
2. Adicione: `SUPABASE_SERVICE_ROLE_KEY` e `MERCADO_PAGO_ACCESS_TOKEN`
3. Redeploy: `vercel --prod`

### Erro: Transaction not found

**Causa**: Transação não existe no banco ou ID incorreto

**Solução**:
1. Verifique se a transação foi criada corretamente
2. Confirme que o `pix_txid` foi salvo no banco
3. Veja os logs para identificar o ID recebido

### Webhook não recebe notificações

**Causa**: Mercado Pago não consegue acessar a URL

**Solução**:
1. Teste a URL manualmente (cURL)
2. Verifique se o domínio está acessível publicamente
3. Confirme que não há firewall bloqueando
4. Use credenciais de **PRODUÇÃO** (não teste)

## 📝 Fluxo Completo

```
1. Cliente gera PIX
   ↓
2. Sistema chama API Mercado Pago
   ↓
3. Mercado Pago retorna QR Code
   ↓
4. Sistema salva transação com pix_txid
   ↓
5. Cliente paga o PIX
   ↓
6. Mercado Pago envia webhook
   ↓
7. Endpoint /api/mercadopago/webhook recebe
   ↓
8. Busca transação por pix_txid
   ↓
9. Atualiza status para "completed"
   ↓
10. Credita saldo do usuário
    ↓
11. Cliente vê saldo atualizado ✅
```

## ⚠️ Importante

### Para Webhook Funcionar:

1. ✅ Aplicação deve estar em **produção** (Vercel/Netlify)
2. ✅ URL deve ser **HTTPS** (não HTTP)
3. ✅ Credenciais do Mercado Pago devem ser de **PRODUÇÃO**
4. ✅ Variável `SUPABASE_SERVICE_ROLE_KEY` deve estar configurada
5. ✅ Webhook deve estar cadastrado no painel do Mercado Pago

### Eventos Suportados:

- ✅ `payment.created` - Pagamento criado
- ✅ `payment.updated` - Pagamento atualizado (aprovado/rejeitado)
- ✅ `type: "payment"` - Formato antigo do Mercado Pago

## 🔗 Links Úteis

- **Painel Mercado Pago**: https://www.mercadopago.com.br/developers/panel/app
- **Documentação Webhooks**: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
- **Ngrok**: https://ngrok.com/download
- **Vercel**: https://vercel.com

---

**Última atualização**: 12/11/2025  
**Status**: ✅ Corrigido e Testado