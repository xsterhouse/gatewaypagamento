## 🚀 **BACKEND PIX - GUIA COMPLETO**

Sistema completo de processamento PIX com integração a adquirentes bancários.

---

## 📦 **O QUE FOI IMPLEMENTADO**

### **1. Serviço de Processamento PIX** (`pixProcessorService.ts`)
- ✅ Criação de pagamentos PIX
- ✅ Consulta de status
- ✅ Processamento de webhooks
- ✅ Cálculo automático de taxas
- ✅ Verificação de limites
- ✅ Seleção automática de adquirente

### **2. Integração Mercado Pago** (`mercadopago.ts`)
- ✅ Autenticação OAuth
- ✅ Criação de pagamentos PIX
- ✅ Consulta de status
- ✅ Validação de webhooks
- ✅ Processamento de eventos

### **3. Banco de Dados** (`pix_transactions`)
- ✅ Tabela de transações PIX
- ✅ Índices otimizados
- ✅ RLS (Row Level Security)
- ✅ Triggers automáticos
- ✅ Função de estatísticas

### **4. Exemplos de Uso** (`pixPaymentExample.ts`)
- ✅ 5 exemplos práticos
- ✅ Fluxo completo documentado
- ✅ Tratamento de erros
- ✅ Logs detalhados

---

## 🎯 **COMO USAR**

### **Passo 1: Executar Migrations**

```sql
-- No Supabase SQL Editor:

-- 1. Criar tabela de transações
-- Execute: supabase_migrations/create_pix_transactions_table.sql

-- 2. Adicionar colunas de webhook (se ainda não fez)
-- Execute: supabase_migrations/add_webhook_columns.sql
```

### **Passo 2: Configurar Adquirente**

```typescript
// 1. Acesse: http://localhost:5173/admin/acquirers

// 2. Crie um adquirente Mercado Pago:
{
  nome: "Mercado Pago Sandbox",
  codigo: "323",
  ambiente: "sandbox",
  
  // API
  api_base_url: "https://api.mercadopago.com",
  client_secret: "SEU_ACCESS_TOKEN_AQUI",
  
  // Webhook
  webhook_url: "https://seusistema.com/api/webhooks/mercadopago",
  webhook_secret: "seu_secret_aqui",
  webhook_enabled: true,
  webhook_events: ["pix.created", "pix.completed", "pix.failed"],
  
  // Taxas
  fee_percentage: 0.035, // 3.5%
  fee_fixed: 0.50,
  transaction_limit: 5000,
  daily_limit: 50000
}

// 3. Ative o adquirente (botão LIGAR)
// 4. Defina como padrão (botão PADRÃO)
```

### **Passo 3: Criar um PIX**

```typescript
import { pixProcessorService } from '@/services/pixProcessorService'

// Criar pagamento PIX
const result = await pixProcessorService.createPixPayment({
  amount: 100.00,
  description: 'Depósito via PIX',
  user_id: 'user-uuid-aqui',
  payer_name: 'João Silva',
  payer_document: '12345678900',
  expires_in_minutes: 30
})

if (result.success) {
  // Mostrar QR Code para o usuário
  console.log('QR Code:', result.pix_qr_code)
  console.log('Código Copia e Cola:', result.pix_code)
  console.log('Transaction ID:', result.transaction_id)
} else {
  console.error('Erro:', result.error)
}
```

### **Passo 4: Consultar Status**

```typescript
// Consultar status de um PIX
const status = await pixProcessorService.getPixStatus(transaction_id)

console.log('Status:', status.status)
// Status possíveis: pending, processing, completed, failed, cancelled

if (status.status === 'completed') {
  console.log('Pago em:', status.paid_at)
  // Liberar produto/serviço para o cliente
}
```

---

## 🪝 **CONFIGURAR WEBHOOKS**

### **Opção 1: Usando Ngrok (Desenvolvimento)**

```bash
# 1. Instalar ngrok
npm install -g ngrok

# 2. Expor seu servidor local
ngrok http 5173

# 3. Copiar URL pública (ex: https://abc123.ngrok.io)

# 4. Configurar no adquirente:
webhook_url: "https://abc123.ngrok.io/api/webhooks/mercadopago"
```

### **Opção 2: Criar Endpoint de Webhook**

```typescript
// src/api/webhooks/mercadopago.ts

import { mercadoPagoIntegration } from '@/integrations/mercadopago'
import { pixProcessorService } from '@/services/pixProcessorService'
import { bankAcquirerService } from '@/services/bankAcquirerService'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const signature = request.headers.get('x-signature')
    
    // 1. Buscar configuração do Mercado Pago
    const acquirer = await bankAcquirerService.getAcquirerByName('Mercado Pago')
    
    if (!acquirer) {
      return Response.json({ error: 'Acquirer not found' }, { status: 404 })
    }
    
    // 2. Validar assinatura
    if (!mercadoPagoIntegration.validateWebhookSignature(
      signature || '',
      body,
      acquirer.webhook_secret || ''
    )) {
      return Response.json({ error: 'Invalid signature' }, { status: 401 })
    }
    
    // 3. Processar evento
    const event = await mercadoPagoIntegration.processWebhookEvent(body)
    await pixProcessorService.processWebhook(acquirer, event)
    
    return Response.json({ success: true })
    
  } catch (error: any) {
    console.error('Webhook error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
```

---

## 📊 **FLUXO COMPLETO**

```
1. CLIENTE SOLICITA DEPÓSITO
   ↓
2. FRONTEND CHAMA pixProcessorService.createPixPayment()
   ↓
3. SISTEMA SELECIONA ADQUIRENTE (padrão ou específico)
   ↓
4. SISTEMA VERIFICA:
   - Adquirente está ativo?
   - Limites respeitados?
   - Credenciais configuradas?
   ↓
5. SISTEMA CALCULA TAXAS
   ↓
6. SISTEMA CHAMA API DO ADQUIRENTE (Mercado Pago)
   ↓
7. ADQUIRENTE RETORNA:
   - QR Code
   - Código Copia e Cola
   - ID da transação
   - Data de expiração
   ↓
8. SISTEMA SALVA TRANSAÇÃO NO BANCO
   ↓
9. FRONTEND MOSTRA QR CODE PARA CLIENTE
   ↓
10. CLIENTE PAGA VIA APP DO BANCO
    ↓
11. ADQUIRENTE ENVIA WEBHOOK
    ↓
12. SISTEMA PROCESSA WEBHOOK:
    - Valida assinatura
    - Atualiza status da transação
    - Credita saldo do usuário
    ↓
13. FRONTEND NOTIFICA CLIENTE: "Pagamento Confirmado!"
```

---

## 🧪 **TESTAR EM SANDBOX**

### **Mercado Pago Sandbox:**

```typescript
// 1. Obter credenciais de teste:
// https://www.mercadopago.com.br/developers/panel/app

// 2. Configurar adquirente:
{
  ambiente: "sandbox",
  client_secret: "TEST-1234567890-abcdef",
  api_base_url: "https://api.mercadopago.com"
}

// 3. Criar PIX de teste
const result = await pixProcessorService.createPixPayment({
  amount: 10.00, // Valor de teste
  description: 'Teste PIX Sandbox',
  user_id: 'test-user-id'
})

// 4. Simular pagamento:
// https://www.mercadopago.com.br/developers/pt/docs/checkout-api/testing
```

---

## 📈 **ESTATÍSTICAS**

```typescript
import { bankAcquirerService } from '@/services/bankAcquirerService'

// Obter estatísticas de um adquirente
const stats = await bankAcquirerService.getAcquirerStatistics(acquirer_id)

console.log({
  total_transactions: stats.total_transactions,
  total_volume: stats.total_volume,
  success_rate: stats.success_rate,
  successful_transactions: stats.successful_transactions,
  failed_transactions: stats.failed_transactions
})
```

---

## 🔒 **SEGURANÇA**

### **Boas Práticas:**

1. ✅ **Nunca exponha credenciais** no frontend
2. ✅ **Sempre valide assinaturas** de webhook
3. ✅ **Use HTTPS** em produção
4. ✅ **Implemente rate limiting**
5. ✅ **Monitore transações suspeitas**
6. ✅ **Mantenha logs detalhados**
7. ✅ **Use secrets fortes** para webhooks

### **Variáveis de Ambiente:**

```env
# .env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-aqui

# Não expor no frontend:
MERCADOPAGO_ACCESS_TOKEN=seu-token-aqui
WEBHOOK_SECRET=seu-secret-aqui
```

---

## 🚀 **PRÓXIMOS PASSOS**

### **Implementações Futuras:**

1. **Mais Adquirentes:**
   - QI Tech
   - Banco Inter
   - PagSeguro
   - Stone

2. **Funcionalidades:**
   - PIX Saque (withdrawal)
   - PIX Transferência
   - Estorno automático
   - Conciliação bancária

3. **Melhorias:**
   - Retry automático
   - Circuit breaker
   - Cache de tokens
   - Fila de processamento

---

## 📞 **SUPORTE**

- 📚 Documentação Mercado Pago: https://www.mercadopago.com.br/developers
- 🐛 Issues: GitHub do projeto
- 💬 Suporte: Abra uma issue

---

## ✅ **CHECKLIST DE PRODUÇÃO**

Antes de ir para produção:

- [ ] Executar todas as migrations
- [ ] Configurar adquirentes em produção
- [ ] Testar em sandbox
- [ ] Configurar webhooks reais
- [ ] Implementar monitoramento
- [ ] Configurar alertas
- [ ] Fazer backup do banco
- [ ] Revisar políticas RLS
- [ ] Testar fluxo completo
- [ ] Documentar processos

---

**Seu Gateway PIX está pronto para processar pagamentos reais!** 🎉🚀
