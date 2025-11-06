# 💳 **CONFIGURAÇÃO MERCADO PAGO - EXEMPLO**

## 📋 **DADOS PARA CRIAR ADQUIRENTE**

### **Aba: Básico**
```
Nome: Mercado Pago Sandbox
Código do Banco: 323
Ambiente: sandbox
Status: ✅ Ativo
```

### **Aba: Dados Bancários**
```
Agência: 0001
Conta: 99999999
Tipo de Conta: Corrente
```

### **Aba: API**
```
URL Base da API: https://api.mercadopago.com
URL de Autenticação: (vazio)
URL PIX: (vazio)

Client ID: (vazio)
Client Secret: TEST-1234567890-123456-abcdefghijklmnopqrstuvwxyz123456-987654321
API Key: (vazio)
```

### **Aba: Webhooks**
```
URL do Webhook: https://seu-dominio.vercel.app/api/webhooks/mercadopago
Secret do Webhook: meu_secret_super_seguro_123
Webhook Habilitado: ✅ SIM

Eventos Habilitados:
✅ pix.created
✅ pix.completed
✅ pix.failed
✅ pix.reversed
```

### **Aba: Taxas**
```
Taxa Percentual: 3.5
Taxa Fixa: 0.50
Limite por Transação: 5000.00
Limite Diário: 50000.00
```

---

## 🔑 **COMO OBTER ACCESS TOKEN**

### **1. Criar Conta Mercado Pago:**
```
https://www.mercadopago.com.br/
```

### **2. Acessar Painel de Desenvolvedores:**
```
https://www.mercadopago.com.br/developers/panel
```

### **3. Criar Aplicação:**
```
1. Clique em "Criar aplicação"
2. Nome: Gateway PIX
3. Produto: Pagamentos online
4. Clique em "Criar aplicação"
```

### **4. Obter Credenciais de Teste:**
```
1. Vá em: Credenciais
2. Clique em: Credenciais de teste
3. Copie: Access Token (TEST-xxxxx)
4. Cole no campo "Client Secret" do adquirente
```

### **5. Obter Credenciais de Produção:**
```
1. Complete o cadastro da sua conta
2. Valide sua identidade
3. Aguarde aprovação do Mercado Pago
4. Vá em: Credenciais → Credenciais de produção
5. Copie: Access Token (APP-xxxxx)
6. Cole no campo "Client Secret" do adquirente
```

---

## 🧪 **TESTAR EM SANDBOX**

### **1. Criar Adquirente com Credenciais de Teste**

### **2. Criar um PIX de Teste:**
```typescript
import { pixProcessorService } from '@/services/pixProcessorService'

const result = await pixProcessorService.createPixPayment({
  amount: 10.00,
  description: 'Teste PIX Sandbox',
  user_id: 'seu-user-id',
  payer_name: 'João Teste',
  payer_document: '12345678900'
})

console.log('QR Code:', result.pix_qr_code)
console.log('Código PIX:', result.pix_code)
```

### **3. Simular Pagamento:**
```
1. Acesse: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/testing
2. Use cartões de teste
3. Ou aprove manualmente no painel
```

---

## 🚀 **IR PARA PRODUÇÃO**

### **Checklist:**

- [ ] Conta Mercado Pago validada
- [ ] Credenciais de produção obtidas
- [ ] Criar novo adquirente com ambiente "production"
- [ ] Configurar webhook real (não localhost)
- [ ] Testar com valor pequeno (R$ 1,00)
- [ ] Monitorar logs
- [ ] Confirmar recebimento via webhook
- [ ] Liberar para clientes

---

## 📞 **SUPORTE**

- 📚 Docs: https://www.mercadopago.com.br/developers
- 💬 Suporte: https://www.mercadopago.com.br/developers/pt/support
- 🐛 Status: https://status.mercadopago.com/

---

## ⚠️ **IMPORTANTE**

### **Segurança:**
- ❌ NUNCA exponha seu Access Token no frontend
- ✅ SEMPRE use HTTPS em produção
- ✅ SEMPRE valide assinaturas de webhook
- ✅ Implemente rate limiting
- ✅ Monitore transações suspeitas

### **Limites:**
- Sandbox: Sem limites de valor
- Produção: Verificar limites da sua conta

### **Taxas Mercado Pago:**
- PIX: ~3.5% + R$ 0,50 por transação
- Verificar taxas atuais no painel
