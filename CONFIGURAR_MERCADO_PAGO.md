# Configurar Mercado Pago como Adquirente (Conta Mãe)

## Visão Geral

O Mercado Pago será usado como **adquirente** para processar pagamentos PIX dos seus clientes. Você (conta mãe) receberá os pagamentos e redistribuirá para os clientes conforme necessário.

## Passo 1: Criar Conta no Mercado Pago

1. Acesse: https://www.mercadopago.com.br/
2. Crie uma conta **Pessoa Jurídica** (CNPJ)
3. Complete o KYC do Mercado Pago
4. Ative a funcionalidade de **PIX**

## Passo 2: Obter Credenciais da API

### 2.1 Acessar Painel de Desenvolvedores

1. Acesse: https://www.mercadopago.com.br/developers
2. Vá em **"Suas integrações"**
3. Clique em **"Criar aplicação"**

### 2.2 Configurar Aplicação

- **Nome da aplicação:** DiMPay Gateway
- **Produto:** Pagamentos online e presenciais
- **Modelo de integração:** Checkout Transparente

### 2.3 Obter Credenciais

Você receberá:
- **Public Key** (pk_test_... ou pk_live_...)
- **Access Token** (TEST-... ou APP_USR-...)

⚠️ **IMPORTANTE:** Use credenciais de **PRODUÇÃO** (não teste) quando for ao ar.

## Passo 3: Configurar Variáveis de Ambiente

Adicione no arquivo `.env`:

```env
# Mercado Pago - Produção
VITE_MERCADO_PAGO_PUBLIC_KEY=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Mercado Pago - Teste (para desenvolvimento)
VITE_MERCADO_PAGO_PUBLIC_KEY_TEST=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MERCADO_PAGO_ACCESS_TOKEN_TEST=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Webhook URL (Vercel)
MERCADO_PAGO_WEBHOOK_URL=https://app.dimpay.com.br/api/mercadopago/webhook
```

## Passo 4: Instalar SDK do Mercado Pago

```bash
npm install mercadopago
```

## Passo 5: Arquitetura do Sistema

### Fluxo de Pagamento PIX

```
Cliente DiMPay
    ↓
Solicita PIX (R$ 100)
    ↓
Backend gera QR Code (Mercado Pago)
    ↓
Cliente paga via PIX
    ↓
Mercado Pago recebe (Conta Mãe)
    ↓
Webhook notifica DiMPay
    ↓
DiMPay credita saldo do cliente
    ↓
Cliente vê saldo atualizado
```

### Fluxo de Saque PIX

```
Cliente DiMPay
    ↓
Solicita saque (R$ 50)
    ↓
Backend valida saldo
    ↓
Mercado Pago envia PIX (da Conta Mãe)
    ↓
Cliente recebe na conta bancária
    ↓
DiMPay debita saldo do cliente
```

## Passo 6: Estrutura de Tabelas

### Tabela: `pix_transactions`

```sql
CREATE TABLE IF NOT EXISTS public.pix_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Tipo de transação
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
  
  -- Valores
  amount DECIMAL(10, 2) NOT NULL,
  fee DECIMAL(10, 2) DEFAULT 0,
  net_amount DECIMAL(10, 2) NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Aguardando pagamento
    'processing',   -- Processando
    'completed',    -- Concluído
    'failed',       -- Falhou
    'cancelled'     -- Cancelado
  )),
  
  -- Mercado Pago
  mp_payment_id TEXT UNIQUE,
  mp_qr_code TEXT,
  mp_qr_code_base64 TEXT,
  mp_external_reference TEXT,
  
  -- PIX Info
  pix_key TEXT,
  pix_key_type TEXT CHECK (pix_key_type IN ('cpf', 'cnpj', 'email', 'phone', 'random')),
  
  -- Metadados
  description TEXT,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pix_transactions_user_id ON public.pix_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_status ON public.pix_transactions(status);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_mp_payment_id ON public.pix_transactions(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_created_at ON public.pix_transactions(created_at DESC);
```

### Tabela: `user_balances`

```sql
CREATE TABLE IF NOT EXISTS public.user_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Saldos
  available_balance DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  locked_balance DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  total_balance DECIMAL(10, 2) GENERATED ALWAYS AS (available_balance + locked_balance) STORED,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_user_balances_user_id ON public.user_balances(user_id);
```

## Passo 7: Políticas RLS

```sql
-- Habilitar RLS
ALTER TABLE public.pix_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_balances ENABLE ROW LEVEL SECURITY;

-- Usuários veem apenas suas transações
CREATE POLICY "users_view_own_pix_transactions"
ON public.pix_transactions FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Usuários veem apenas seu saldo
CREATE POLICY "users_view_own_balance"
ON public.user_balances FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Admins veem tudo
CREATE POLICY "admins_view_all_pix_transactions"
ON public.pix_transactions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'master')
  )
);

CREATE POLICY "admins_view_all_balances"
ON public.user_balances FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'master')
  )
);
```

## Passo 8: Próximos Passos

1. ✅ Criar conta Mercado Pago
2. ✅ Obter credenciais da API
3. ✅ Adicionar variáveis de ambiente
4. ✅ Instalar SDK
5. ⏳ Criar tabelas no Supabase
6. ⏳ Implementar API de depósito PIX
7. ⏳ Implementar API de saque PIX
8. ⏳ Configurar webhook
9. ⏳ Criar interface de depósito
10. ⏳ Criar interface de saque

## Recursos Úteis

- **Documentação Mercado Pago PIX:** https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-configuration/pix
- **API Reference:** https://www.mercadopago.com.br/developers/pt/reference
- **Webhooks:** https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
- **Sandbox (Teste):** https://www.mercadopago.com.br/developers/pt/docs/checkout-api/testing

## Custos Mercado Pago

- **PIX Recebimento:** ~0,99% por transação
- **PIX Envio:** Grátis (até certo limite)
- **Saque para conta bancária:** Pode ter taxa

⚠️ **Verifique as taxas atuais no painel do Mercado Pago**
