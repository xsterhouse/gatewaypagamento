# Configuração MercadoPago para Faturas

## 1. Variáveis de Ambiente

Configure as seguintes variáveis de ambiente na Vercel:

```bash
# Token de Acesso do MercadoPago (produção ou sandbox)
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-XXXXXXX-XXXXXXX-XXXXXXX-XXXXXXX

# URL da aplicação para webhooks
NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app
```

## 2. Obter Token MercadoPago

### Para Sandbox (Teste):
1. Acesse [MercadoPago Developers](https://www.mercadopago.com/developers/panel)
2. Crie uma aplicação de teste
3. Copie o Access Token

### Para Produção:
1. Acesse [MercadoPago](https://www.mercadopago.com.br/)
2. Vá para Integrações > API
3. Copie o Production Access Token

## 3. Configurar Webhook

O webhook será configurado automaticamente em:
```
https://seu-dominio.vercel.app/api/mercadopago_webhook
```

No painel do MercadoPago:
1. Vá para Integrações > Webhooks
2. Adicione a URL acima
3. Selecione os eventos:
   - `payment`
   - `payment.created`
   - `payment.updated`

## 4. Diferenças vs EFI

### Vantagens MercadoPago:
- ✅ Sem necessidade de certificado digital
- ✅ Webhook mais simples de configurar
- ✅ Documentação melhor
- ✅ Sandbox gratuito para testes
- ✅ Aceita CPF/CNPJ

### Desvantagens:
- ❌ Taxas maiores que EFI
- ❌ Não gera boleto tradicional (só PIX)
- ❌ Menos controle sobre personalização

## 5. Teste da Integração

### Testar API:
```bash
curl -X POST https://seu-dominio.vercel.app/api/mercadopago_create_invoice \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.50,
    "description": "Teste de fatura",
    "customer": {
      "nome": "João Silva",
      "cpf": "12345678909",
      "email": "joao@exemplo.com"
    },
    "invoiceId": "test-123"
  }'
```

### Resposta Esperada:
```json
{
  "success": true,
  "boleto": {
    "codigo_barras": "23791882200000100505512345678901234567890123",
    "linha_digitavel": "23791.88220 00001.005055 12345.678901 2 34567890123",
    "nosso_numero": "1234567890",
    "data_vencimento": "2024-01-15",
    "valor": "100.50"
  },
  "pix": {
    "qr_code": "00020101021226880014BR.GOV.BCB.PIX...",
    "qr_code_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
    "loc_id": "123456789",
    "transaction_id": "123456789"
  }
}
```

## 6. Migração de EFI para MercadoPago

1. **Backup:** Exporte dados existentes da EFI
2. **Teste:** Use sandbox primeiro
3. **Produção:** Mude token para produção
4. **Monitore:** Verifique webhooks funcionando

## 7. Suporte

- Documentação: [MercadoPago API](https://www.mercadopago.com.br/developers/pt/reference/payments/_payments/post)
- Status da API: [MercadoPago Status](https://status.mercadopago.com/)
- Suporte: [MercadoPago Help](https://www.mercadopago.com.br/help)
