# Configurar Mercado Pago via Painel Admin

## ✅ Passo a Passo Simplificado

### 1. Executar SQL para Adicionar Mercado Pago

No **Supabase SQL Editor**, execute:

```sql
INSERT INTO public.bank_acquirers (
  name,
  bank_code,
  client_id,
  client_secret,
  api_base_url,
  api_auth_url,
  api_pix_url,
  is_active,
  is_default,
  environment,
  daily_limit,
  transaction_limit,
  fee_percentage,
  fee_fixed,
  description,
  logo_url,
  status
) VALUES (
  'Mercado Pago',
  'MP',
  'COLE_SEU_PUBLIC_KEY_AQUI',
  'COLE_SEU_ACCESS_TOKEN_AQUI',
  'https://api.mercadopago.com',
  'https://api.mercadopago.com/oauth/token',
  'https://api.mercadopago.com/v1/payments',
  true,
  true,
  'production',
  1000000.00,
  50000.00,
  0.0099,
  0.00,
  'Mercado Pago - Gateway de pagamentos PIX',
  'https://http2.mlstatic.com/frontend-assets/mp-web-navigation/ui-navigation/5.21.22/mercadopago/logo__large@2x.png',
  'active'
)
ON CONFLICT DO NOTHING;
```

### 2. Obter Credenciais do Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers
2. Faça login
3. Vá em **"Suas integrações"** → **"Criar aplicação"**
4. Preencha:
   - **Nome:** DiMPay Gateway
   - **Produto:** Pagamentos online
   - **Modelo:** Checkout Transparente
5. Copie as credenciais:
   - **Public Key** (começa com `APP_USR-` ou `TEST-`)
   - **Access Token** (começa com `APP_USR-` ou `TEST-`)

### 3. Atualizar Credenciais no Banco

Execute este SQL substituindo os valores:

```sql
UPDATE public.bank_acquirers
SET 
  client_id = 'APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  client_secret = 'APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
WHERE name = 'Mercado Pago';
```

### 4. Configurar Variáveis de Ambiente no Vercel

No painel do Vercel:

1. Vá em **Settings** → **Environment Variables**
2. Adicione:

```
MERCADO_PAGO_ACCESS_TOKEN = APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_MERCADO_PAGO_PUBLIC_KEY = APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

3. Clique em **Save**
4. Faça **Redeploy** da aplicação

### 5. Configurar Webhook no Mercado Pago

1. No painel do Mercado Pago, vá em **Webhooks**
2. Clique em **"Adicionar webhook"**
3. Configure:
   - **URL:** `https://app.dimpay.com.br/api/mercadopago/webhook`
   - **Eventos:** Selecione **"Pagamentos"**
4. Salve

### 6. Acessar Painel de Adquirentes

1. Faça login como **admin** no DiMPay
2. Vá em **Configurações** → **Adquirentes Bancários**
3. Você verá o **Mercado Pago** listado
4. Clique em **Editar** para ajustar configurações se necessário

---

## 📋 Campos Importantes

### No Painel de Adquirentes

- **Nome:** Mercado Pago
- **Código do Banco:** MP
- **Client ID:** Public Key do Mercado Pago
- **Client Secret:** Access Token do Mercado Pago
- **Ambiente:** Production (ou Sandbox para testes)
- **Taxa Percentual:** 0.99% (0.0099)
- **Limite Diário:** R$ 1.000.000,00
- **Limite por Transação:** R$ 50.000,00

---

## ✅ Verificar Configuração

Execute este SQL para verificar:

```sql
SELECT 
  name,
  bank_code,
  is_active,
  is_default,
  environment,
  status,
  fee_percentage,
  daily_limit,
  transaction_limit
FROM public.bank_acquirers
WHERE name = 'Mercado Pago';
```

Deve retornar:
- ✅ `is_active = true`
- ✅ `is_default = true`
- ✅ `status = active`
- ✅ `environment = production`

---

## 🎯 Próximos Passos

Após configurar o Mercado Pago:

1. ✅ Criar tabelas PIX (execute `CRIAR_TABELAS_PIX_MERCADOPAGO.sql`)
2. ✅ Adicionar colunas faltantes (execute `ADICIONAR_COLUNAS_PIX.sql`)
3. ✅ Testar depósito PIX
4. ✅ Testar saque PIX

---

## 🔑 Credenciais de Teste (Sandbox)

Para testar antes de ir para produção:

1. Use credenciais de **TEST** do Mercado Pago
2. Mude `environment` para `sandbox`
3. Use cartões de teste: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/testing

---

## 💡 Dicas

- **Sempre use HTTPS** para webhooks
- **Guarde as credenciais** em local seguro
- **Não compartilhe** o Access Token
- **Monitore** as transações no painel do Mercado Pago
- **Configure alertas** para transações suspeitas
