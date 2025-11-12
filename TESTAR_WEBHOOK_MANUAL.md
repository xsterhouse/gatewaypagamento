# 🧪 Testar Webhook Manualmente

## Como Simular Pagamento Aprovado

### Passo 1: Pegar o ID do Pagamento

No terminal do servidor, você viu:
```
📡 [DEV] Resposta Mercado Pago: {
  status: 201,
  id: 133561550516,  ← ESTE ID
  ...
}
```

### Passo 2: Executar SQL no Supabase

Substitua `133561550516` pelo ID real do seu pagamento:

```sql
-- 1. Encontrar a transação
SELECT id, pix_txid, status, amount 
FROM pix_transactions 
WHERE pix_txid = '133561550516';

-- 2. Atualizar para aprovado
UPDATE pix_transactions
SET 
  status = 'completed',
  completed_at = now(),
  updated_at = now()
WHERE pix_txid = '133561550516';

-- 3. Creditar saldo do usuário
-- Pegue o user_id e net_amount da query anterior
SELECT update_user_balance(
  'user_id_aqui'::uuid,  -- Substitua pelo user_id
  10.00,                  -- Substitua pelo net_amount
  'add'
);

-- 4. Verificar se funcionou
SELECT id, status, completed_at 
FROM pix_transactions 
WHERE pix_txid = '133561550516';
```

### Passo 3: Recarregar a Página

Recarregue a página e o saldo deve estar atualizado!

---

## 🚀 Para Webhook Funcionar Automaticamente

### Opção A: Deploy em Produção (Recomendado)

```bash
npm run build
vercel --prod
```

Depois configure no Mercado Pago:
- URL: `https://app.dimpay.com.br/api/mercadopago/webhook`

### Opção B: Usar ngrok (Desenvolvimento)

```bash
# 1. Instalar ngrok
choco install ngrok

# 2. Criar túnel
ngrok http 5179

# 3. Copiar URL (ex: https://abc123.ngrok.io)

# 4. Configurar no Mercado Pago
# URL: https://abc123.ngrok.io/api/mercadopago/webhook
```

**Mas atenção:** ngrok só funciona enquanto estiver rodando!

---

## 📊 Verificar Logs do Webhook

Quando o webhook funcionar, você verá no terminal:

```
🎯 [DEV] Interceptando requisição para /api/mercadopago/webhook
💳 Payment notification: 133561550516
✅ Transaction updated: completed
```

E no console do navegador:
```
💰 Saldo atualizado!
```
