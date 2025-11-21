# 🚀 Guia Rápido - Banco Inter

## ⚡ Configuração em 5 Minutos

### 1. Obter Credenciais (2 min)
1. Acesse: https://developers.bancointer.com.br/
2. Crie aplicação PIX/Boletos
3. Copie Client ID e Client Secret

### 2. Configurar no Supabase (2 min)
```sql
-- Execute no SQL Editor
-- Substitua os valores e execute:
UPDATE bank_acquirers
SET 
  client_id = 'SEU_CLIENT_ID',
  client_secret = 'SEU_CLIENT_SECRET',
  pix_key = 'SEU_CNPJ',
  account_number = 'SUA_CONTA',
  is_active = true
WHERE bank_code = '077';
```

### 3. Configurar Certificado (1 min)
No Supabase Dashboard → Settings → Edge Functions → Add Secret:
```
BANCO_INTER_CERTIFICATE=<certificado_base64>
BANCO_INTER_CERTIFICATE_KEY=<chave_base64>
BANCO_INTER_ACCOUNT_NUMBER=12345678
```

### 4. Testar (30 seg)
```sql
SELECT * FROM validate_banco_inter_config();
```

---

## 📝 Exemplos de Uso

### Receber PIX
```typescript
const { data } = await supabase.functions.invoke('banco-inter-create-pix', {
  body: {
    user_id: userId,
    amount: 50.00,
    description: 'Pagamento de serviço'
  }
})
// Retorna: { pix_code, qr_code_base64, txid }
```

### Enviar PIX
```typescript
const { data } = await supabase.functions.invoke('banco-inter-send-pix', {
  body: {
    user_id: userId,
    amount: 25.00,
    pix_key: '12345678901',
    pix_key_type: 'cpf',
    description: 'Pagamento'
  }
})
// Retorna: { e2e_id, transaction_id }
```

### Criar Boleto
```typescript
const { data } = await supabase.functions.invoke('banco-inter-create-boleto', {
  body: {
    user_id: userId,
    amount: 100.00,
    payer_name: 'João Silva',
    payer_document: '12345678901',
    description: 'Fatura #123'
  }
})
// Retorna: { codigo_barras, linha_digitavel, pdf_base64, pix_copia_e_cola }
```

---

## 🔍 Verificações Rápidas

### Status da Configuração
```sql
SELECT name, is_active, environment, status
FROM bank_acquirers
WHERE bank_code = '077';
```

### Últimas Transações
```sql
SELECT id, transaction_type, amount, status, created_at
FROM pix_transactions
WHERE acquirer_id IN (SELECT id FROM bank_acquirers WHERE bank_code = '077')
ORDER BY created_at DESC
LIMIT 10;
```

### Estatísticas do Dia
```sql
SELECT 
  COUNT(*) as total,
  SUM(amount) FILTER (WHERE status = 'completed') as valor_total,
  COUNT(*) FILTER (WHERE transaction_type = 'deposit') as recebimentos,
  COUNT(*) FILTER (WHERE transaction_type = 'withdrawal') as envios
FROM pix_transactions
WHERE acquirer_id IN (SELECT id FROM bank_acquirers WHERE bank_code = '077')
  AND created_at >= CURRENT_DATE;
```

---

## ⚠️ Troubleshooting Rápido

| Erro | Solução |
|------|---------|
| "Falha na autenticação" | Verifique Client ID e Secret |
| "Certificate verification failed" | Verifique certificado em Base64 |
| "Saldo insuficiente" | Adicione saldo na conta PJ |
| "Chave PIX não encontrada" | Verifique se a chave está ativa |

---

## 📞 Links Úteis

- **Portal**: https://developers.bancointer.com.br/
- **Docs API**: https://developers.bancointer.com.br/docs
- **Suporte**: suporte.api@bancointer.com.br
- **Telefone**: 3003-4070 (opção 9)

---

## ✅ Checklist Mínimo

- [ ] Client ID e Secret configurados
- [ ] Certificado configurado no Supabase
- [ ] Chave PIX cadastrada
- [ ] Teste de validação executado
- [ ] Edge Functions deployadas

---

**Pronto!** Sua integração está funcionando. 🎉

Para documentação completa, veja: `INTEGRACAO_BANCO_INTER_COMPLETA.md`
