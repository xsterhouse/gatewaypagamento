# Troubleshooting Webhook MercadoPago

## Problema: 404 - Not Found

O erro `404 - Not Found` indica que o MercadoPago não consegue encontrar seu webhook.

## Possíveis Causas e Soluções

### 1. Deploy Não Realizado
**Problema:** A API ainda não foi deployada para produção.

**Solução:**
```bash
# Fazer deploy na Vercel
pnpm run build
vercel --prod

# Ou fazer push e aguardar deploy automático
git push origin main
```

### 2. URL Incorreta
**Problema:** URL configurada no MercadoPago está errada.

**Solução:**
- URL correta: `https://seu-projeto.vercel.app/api/mercadopago`
- Substitua `seu-projeto` pelo seu domínio real na Vercel

### 3. Webhook Não Existe
**Problema:** Arquivo `mercadopago_webhook.ts` não está na pasta `api/`

**Verificação:**
```bash
# Verificar se arquivo existe
ls api/mercadopago_webhook.ts
```

### 4. Configuração CORS
**Problema:** MercadoPago não consegue acessar por CORS.

**Solução:** O webhook já tem CORS configurado:
```typescript
res.setHeader('Access-Control-Allow-Origin', '*')
```

## Teste Manual do Webhook

### 1. Teste Local
```bash
# Iniciar servidor local
pnpm dev

# Testar em outro terminal
curl -X GET http://localhost:3000/api/mercadopago
```

### 2. Teste Produção
```bash
# Substitua pelo seu domínio real
curl -X GET https://seu-projeto.vercel.app/api/mercadopago
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "message": "Webhook endpoint is ready"
}
```

## Configuração Correta no MercadoPago

### 1. URL do Webhook
```
https://seu-projeto.vercel.app/api/mercadopago
```

### 2. Eventos para Receber
- ✅ `payment`
- ✅ `payment.created`
- ✅ `payment.updated`

### 3. Passos no Painel MercadoPago
1. Vá para **Integrações > Webhooks**
2. Cole a URL acima
3. Selecione os eventos
4. Clique em **Salvar**
5. Aguarde alguns segundos
6. Clique em **Testar**

## Solução Temporária

Se o webhook não funcionar imediatamente:

1. **Use sem webhook por enquanto:**
   - As faturas serão geradas
   - PIX será criado
   - Apenas não receberá atualizações automáticas

2. **Configure webhook após deploy:**
   - Faça o deploy primeiro
   - Teste a URL manualmente
   - Depois configure no MercadoPago

## Logs para Debug

Adicione estes logs para debug:
```typescript
// No início do webhook
console.log('🔔 Webhook accessed at:', new Date().toISOString())
console.log('🔔 Method:', req.method)
console.log('🔔 URL:', req.url)
console.log('🔔 Headers:', Object.keys(req.headers))
```

## Verificação Final

Antes de configurar no MercadoPago:

1. ✅ Deploy realizado
2. ✅ URL acessível via browser
3. ✅ Teste manual com curl funciona
4. ✅ Logs aparecem no console da Vercel

Se todos passos acima funcionarem, o webhook funcionará no MercadoPago.
