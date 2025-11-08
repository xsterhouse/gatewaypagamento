# 🪝 Webhook Backend Separado

## ⚠️ Importante

O webhook PIX precisa rodar em um **backend Node.js separado** porque:
- Edge Functions da Vercel não suportam imports complexos
- Frontend (React/Vite) não pode receber webhooks diretamente
- Webhook precisa de acesso ao Supabase server-side

---

## 🚀 Opção 1: Backend Node.js Simples (Recomendado)

### **1. Criar Projeto Backend**

```bash
# Em uma pasta separada
mkdir gateway-webhook-backend
cd gateway-webhook-backend

npm init -y
npm install express @supabase/supabase-js cors dotenv
```

### **2. Criar arquivo `server.js`**

```javascript
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { createClient } = require('@supabase/supabase-js')

const app = express()
const PORT = process.env.PORT || 3001

// Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Service key, não anon key!
)

app.use(cors())
app.use(express.json())

// Endpoint de webhook
app.post('/api/webhooks/pix', async (req, res) => {
  try {
    console.log('🪝 Webhook recebido:', new Date().toISOString())
    
    const signature = req.headers['x-signature'] || ''
    const acquirerId = req.headers['x-acquirer-id'] || ''
    const payload = req.body
    
    console.log('📦 Payload:', payload)
    
    // Validar acquirer
    if (!acquirerId) {
      return res.status(400).json({ error: 'Acquirer ID required' })
    }
    
    // Processar evento
    const eventType = payload.type || payload.event
    const transactionId = payload.transaction_id || payload.data?.transaction_id
    const userId = payload.user_id || payload.data?.user_id
    const amount = payload.amount || payload.data?.amount || 0
    
    console.log(`📊 Evento: ${eventType}, Transação: ${transactionId}`)
    
    // Log do webhook
    await supabase.from('webhook_logs').insert({
      acquirer_id: acquirerId,
      event_type: eventType,
      payload: payload,
      success: true
    })
    
    // Processar PIX completado
    if (eventType === 'pix.completed' || eventType === 'pix.received') {
      console.log('✅ Processando PIX completado...')
      
      // 1. Atualizar transação
      await supabase
        .from('pix_transactions')
        .update({ status: 'completed' })
        .eq('id', transactionId)
      
      // 2. Calcular taxa do sistema (R$ 0,05)
      const systemFee = 0.05
      const netAmount = amount - systemFee
      
      // 3. Buscar ou criar carteira
      let { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .eq('currency_code', 'BRL')
        .single()
      
      if (!wallet) {
        const { data: newWallet } = await supabase
          .from('wallets')
          .insert({
            user_id: userId,
            currency_code: 'BRL',
            balance: 0,
            blocked_balance: 0
          })
          .select()
          .single()
        
        wallet = newWallet
      }
      
      // 4. Creditar saldo
      const newBalance = parseFloat(wallet.balance) + netAmount
      
      await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('id', wallet.id)
      
      // 5. Registrar transação da carteira
      await supabase.from('wallet_transactions').insert({
        wallet_id: wallet.id,
        user_id: userId,
        transaction_type: 'credit',
        amount: netAmount,
        balance_before: wallet.balance,
        balance_after: newBalance,
        description: `Depósito PIX - Recarga de saldo`,
        reference_id: transactionId,
        reference_type: 'pix_transaction'
      })
      
      // 6. Registrar taxa do sistema
      await supabase.from('system_fee_collections').insert({
        user_id: userId,
        transaction_id: transactionId,
        operation_type: 'pix_receive',
        transaction_amount: amount,
        fee_amount: systemFee,
        status: 'collected'
      })
      
      // 7. Criar notificação
      await supabase.from('notifications').insert({
        user_id: userId,
        title: '💰 PIX Recebido!',
        message: `Você recebeu R$ ${netAmount.toFixed(2)} via PIX. O saldo já está disponível.`,
        type: 'success',
        category: 'pix',
        read: false
      })
      
      console.log('✅ PIX processado com sucesso!')
    }
    
    res.json({ success: true, message: 'Webhook processed' })
    
  } catch (error) {
    console.error('❌ Erro:', error)
    
    // Log de erro
    await supabase.from('webhook_logs').insert({
      acquirer_id: req.headers['x-acquirer-id'] || '',
      event_type: req.body.type || 'unknown',
      payload: req.body,
      success: false,
      error_message: error.message
    })
    
    res.status(500).json({ error: error.message })
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`🚀 Webhook server rodando na porta ${PORT}`)
  console.log(`📍 Endpoint: http://localhost:${PORT}/api/webhooks/pix`)
})
```

### **3. Criar arquivo `.env`**

```env
PORT=3001
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_KEY=sua-service-key-aqui
```

⚠️ **IMPORTANTE:** Use a **SERVICE KEY**, não a anon key!

### **4. Rodar localmente**

```bash
node server.js
```

### **5. Deploy no Railway/Render**

**Railway (Recomendado):**
1. Acesse: https://railway.app/
2. New Project → Deploy from GitHub
3. Conecte o repositório do backend
4. Railway detecta Node.js automaticamente
5. Adicione variáveis de ambiente
6. Deploy!

**Render:**
1. Acesse: https://render.com/
2. New → Web Service
3. Conecte GitHub
4. Build Command: `npm install`
5. Start Command: `node server.js`
6. Adicione variáveis de ambiente
7. Deploy!

---

## 🚀 Opção 2: Usar Supabase Edge Functions

### **1. Instalar Supabase CLI**

```bash
npm install -g supabase
supabase login
```

### **2. Criar Edge Function**

```bash
supabase functions new pix-webhook
```

### **3. Editar `supabase/functions/pix-webhook/index.ts`**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload = await req.json()
    const eventType = payload.type || payload.event
    
    console.log('Webhook recebido:', eventType)

    // Processar webhook (mesmo código do server.js)
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    )
  }
})
```

### **4. Deploy**

```bash
supabase functions deploy pix-webhook
```

URL: `https://seu-projeto.supabase.co/functions/v1/pix-webhook`

---

## 🚀 Opção 3: Usar Confirmação Manual (Temporário)

Enquanto não configura o webhook, use confirmação manual:

```typescript
// No painel admin, criar botão:
import { webhookService } from '@/services/webhookService'

async function confirmarPix(transactionId: string) {
  await webhookService.manualConfirmPix(transactionId)
  toast.success('PIX confirmado!')
}
```

---

## 📋 Configurar no Banco Inter

Depois de fazer deploy do backend:

1. **URL do Webhook:**
   - Railway: `https://seu-app.railway.app/api/webhooks/pix`
   - Render: `https://seu-app.onrender.com/api/webhooks/pix`
   - Supabase: `https://projeto.supabase.co/functions/v1/pix-webhook`

2. **Headers:**
   - `x-acquirer-id`: [ID do adquirente no Supabase]

3. **Eventos:**
   - `pix.completed`
   - `pix.received`
   - `pix.failed`

---

## ✅ Testar Webhook

```bash
# Teste local
curl -X POST http://localhost:3001/api/webhooks/pix \
  -H "Content-Type: application/json" \
  -H "x-acquirer-id: seu-acquirer-id" \
  -d '{
    "type": "pix.completed",
    "transaction_id": "uuid-da-transacao",
    "user_id": "uuid-do-usuario",
    "amount": 100.00
  }'
```

---

## 📊 Monitorar

```sql
-- Ver logs de webhooks
SELECT * FROM webhook_logs 
ORDER BY processed_at DESC 
LIMIT 10;

-- Ver PIX processados
SELECT * FROM pix_transactions 
WHERE status = 'completed'
ORDER BY updated_at DESC 
LIMIT 10;
```

---

## 🎯 Recomendação Final

**Use Railway** - É o mais simples:
1. Deploy em 5 minutos
2. HTTPS automático
3. Logs em tempo real
4. Gratuito para começar

---

**Versão:** 1.0.0  
**Data:** 08/11/2024  
**Status:** ✅ Pronto para Uso
