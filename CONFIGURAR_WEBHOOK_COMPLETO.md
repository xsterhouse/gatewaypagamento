# 🪝 Guia Completo de Configuração do Webhook PIX

## 📋 Pré-requisitos

- ✅ Sistema já deployado (Vercel/Netlify)
- ✅ Adquirente cadastrado no sistema
- ✅ Acesso ao portal do banco (Banco Inter, etc)

---

## 🚀 Passo 1: Deploy do Webhook

### **Opção A: Vercel (Recomendado)**

1. **Instalar Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Fazer login:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

4. **Anotar a URL:**
   ```
   https://seu-projeto.vercel.app
   ```

### **Opção B: Netlify**

1. **Instalar Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login e deploy:**
   ```bash
   netlify login
   netlify deploy --prod
   ```

---

## 🔐 Passo 2: Gerar Secret do Webhook

Execute no terminal ou console do navegador:

```javascript
// Gerar secret seguro
const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
  .map(b => b.toString(16).padStart(2, '0'))
  .join('')

console.log('Secret do Webhook:', secret)
// Copie e guarde em local seguro!
```

Ou use este comando:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🏦 Passo 3: Configurar no Banco Inter

### **3.1 Acessar Portal**

1. Acesse: https://developers.bancointer.com.br/
2. Login com suas credenciais
3. Vá em **Aplicações** → Sua aplicação PIX

### **3.2 Configurar Webhook**

1. **Menu:** Webhooks ou Notificações
2. **Adicionar Webhook:**
   - **URL:** `https://seu-projeto.vercel.app/api/webhooks/pix`
   - **Método:** POST
   - **Eventos:** Selecione todos relacionados a PIX:
     - ✅ `pix.created` (PIX criado)
     - ✅ `pix.received` (PIX recebido/pago)
     - ✅ `pix.completed` (PIX completado)
     - ✅ `pix.failed` (PIX falhou)
     - ✅ `pix.reversed` (PIX estornado)

3. **Headers Customizados:**
   - `x-acquirer-id`: [ID do adquirente no seu sistema]
   - `x-signature`: [será gerado automaticamente pelo banco]

4. **Secret:** Cole o secret que você gerou no Passo 2

5. **Salvar**

### **3.3 Obter ID do Adquirente**

Execute no Supabase SQL Editor:

```sql
SELECT id, name 
FROM bank_acquirers 
WHERE name LIKE '%Inter%';
```

Copie o `id` e use como `x-acquirer-id`.

---

## 🔧 Passo 4: Salvar Secret no Sistema

### **No Supabase SQL Editor:**

```sql
UPDATE bank_acquirers 
SET 
  webhook_url = 'https://seu-projeto.vercel.app/api/webhooks/pix',
  webhook_secret = 'cole-o-secret-aqui',
  webhook_enabled = true,
  webhook_events = ARRAY[
    'pix.created',
    'pix.received', 
    'pix.completed',
    'pix.failed',
    'pix.reversed'
  ]
WHERE name LIKE '%Inter%';
```

---

## 🧪 Passo 5: Testar Webhook

### **5.1 Teste Manual (Desenvolvimento)**

Use ferramentas como **Postman** ou **curl**:

```bash
curl -X POST https://seu-projeto.vercel.app/api/webhooks/pix \
  -H "Content-Type: application/json" \
  -H "x-acquirer-id: cole-id-do-adquirente" \
  -H "x-signature: test-signature" \
  -d '{
    "type": "pix.completed",
    "transaction_id": "uuid-da-transacao",
    "user_id": "uuid-do-usuario",
    "amount": 100.00,
    "description": "Teste de webhook",
    "e2e_id": "E12345678202411081234567890AB"
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

### **5.2 Teste Real**

1. **Gere um PIX de teste** no sistema
2. **Pague via app do banco** (ambiente sandbox)
3. **Verifique os logs:**

```sql
-- Ver logs de webhooks
SELECT 
  event_type,
  success,
  error_message,
  processed_at,
  payload
FROM webhook_logs
ORDER BY processed_at DESC
LIMIT 5;
```

### **5.3 Verificar se Saldo foi Creditado**

```sql
-- Ver transações completadas
SELECT 
  id,
  user_id,
  amount,
  status,
  created_at,
  updated_at
FROM pix_transactions
WHERE status = 'completed'
ORDER BY updated_at DESC
LIMIT 5;

-- Ver saldo creditado
SELECT 
  wt.description,
  wt.amount,
  wt.balance_before,
  wt.balance_after,
  wt.created_at
FROM wallet_transactions wt
WHERE wt.transaction_type = 'credit'
ORDER BY wt.created_at DESC
LIMIT 5;
```

---

## 🔍 Passo 6: Monitoramento

### **Ver Logs em Tempo Real (Vercel)**

```bash
vercel logs --follow
```

### **Ver Logs no Supabase**

```sql
-- Webhooks das últimas 24h
SELECT 
  event_type,
  success,
  COUNT(*) as total,
  MAX(processed_at) as ultimo
FROM webhook_logs
WHERE processed_at >= NOW() - INTERVAL '24 hours'
GROUP BY event_type, success
ORDER BY ultimo DESC;

-- Erros recentes
SELECT 
  event_type,
  error_message,
  payload,
  processed_at
FROM webhook_logs
WHERE success = false
ORDER BY processed_at DESC
LIMIT 10;
```

---

## 🐛 Troubleshooting

### **Problema: Webhook não é chamado**

**Verificar:**
1. URL está correta no portal do banco?
2. Aplicação está em produção (não localhost)?
3. Eventos corretos estão selecionados?

**Solução:**
```bash
# Testar se endpoint está acessível
curl https://seu-projeto.vercel.app/api/webhooks/pix

# Deve retornar: {"error":"Method not allowed"}
# Isso significa que está funcionando!
```

### **Problema: Webhook retorna erro 400**

**Causa:** Assinatura inválida ou acquirer_id não encontrado

**Solução:**
```sql
-- Verificar se acquirer existe
SELECT id, name, webhook_secret 
FROM bank_acquirers;

-- Atualizar secret se necessário
UPDATE bank_acquirers 
SET webhook_secret = 'novo-secret'
WHERE id = 'uuid-do-adquirente';
```

### **Problema: Saldo não é creditado**

**Verificar:**
```sql
-- Ver se webhook foi processado
SELECT * FROM webhook_logs 
WHERE event_type = 'pix.completed'
ORDER BY processed_at DESC 
LIMIT 1;

-- Ver se transação foi atualizada
SELECT * FROM pix_transactions
WHERE id = 'transaction-id';

-- Ver se há erro no log
SELECT error_message FROM webhook_logs
WHERE success = false
ORDER BY processed_at DESC
LIMIT 5;
```

---

## 📊 Formato do Payload (Banco Inter)

O Banco Inter envia webhooks neste formato:

```json
{
  "event": "pix.completed",
  "data": {
    "txid": "E12345678202411081234567890AB",
    "endToEndId": "E12345678202411081234567890AB",
    "valor": "100.00",
    "horario": "2024-11-08T15:30:00Z",
    "pagador": {
      "cpf": "12345678900",
      "nome": "João Silva"
    }
  }
}
```

O webhook adapta automaticamente para o formato interno.

---

## ✅ Checklist Final

- [ ] Webhook deployado em produção
- [ ] Secret gerado e salvo
- [ ] Configurado no portal do banco
- [ ] Acquirer ID correto no header
- [ ] Secret salvo no banco de dados
- [ ] Teste manual executado com sucesso
- [ ] Teste real com PIX pago
- [ ] Saldo creditado automaticamente
- [ ] Notificação enviada ao cliente
- [ ] Logs sendo registrados

---

## 🎉 Pronto!

Agora seu sistema está **100% AUTOMÁTICO**:

1. ✅ Cliente gera PIX
2. ✅ Cliente paga
3. ✅ Banco envia webhook
4. ✅ Sistema confirma automaticamente
5. ✅ Saldo é creditado
6. ✅ Cliente recebe notificação

**Zero intervenção manual!** 🚀

---

## 📞 Suporte

**Logs do Webhook:**
```sql
SELECT * FROM webhook_logs 
ORDER BY processed_at DESC 
LIMIT 20;
```

**Testar Confirmação Manual:**
```javascript
import { webhookService } from './src/services/webhookService'
await webhookService.manualConfirmPix('transaction-id')
```

---

**Versão:** 1.0.0  
**Data:** 08/11/2024  
**Status:** ✅ Pronto para Produção
