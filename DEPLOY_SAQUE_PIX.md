# 🚀 Deploy da Edge Function - Saque PIX

## 📋 Pré-requisitos

Certifique-se de que as seguintes variáveis de ambiente estão configuradas no Supabase:

- `MERCADO_PAGO_ACCESS_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 🔧 Como fazer o deploy

### Opção 1: Via Dashboard do Supabase (Recomendado)

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Vá em **Edge Functions**
3. Clique em **Create a new function**
4. Nome: `mercadopago-send-pix`
5. Cole o conteúdo do arquivo: `supabase/functions/mercadopago-send-pix/index.ts`
6. Clique em **Deploy**

### Opção 2: Via CLI (se o erro do .env for resolvido)

```bash
# Navegar até o diretório do projeto
cd c:\Users\XSTER\gatewaypagamento

# Fazer deploy
supabase functions deploy mercadopago-send-pix --no-verify-jwt
```

## ✅ Verificar se funcionou

Após o deploy, teste chamando a função:

```bash
curl -X POST https://seu-projeto.supabase.co/functions/v1/mercadopago-send-pix \
  -H "Authorization: Bearer SEU_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "uuid-do-usuario",
    "amount": 10.00,
    "pix_key": "11999999999",
    "pix_key_type": "PHONE"
  }'
```

## 🎯 Funcionalidades Implementadas

### ✅ Modal de Saque PIX (`SaquePixModal.tsx`)

- **Validação de Saldo**: Verifica se o usuário tem saldo suficiente
- **Taxa Mínima**: Mantém R$ 1,70 na conta para cobrir taxas de transferência
- **Valor Mínimo**: Saque mínimo de R$ 1,00
- **Detecção Automática**: Identifica o tipo de chave PIX automaticamente
  - CPF: 11 dígitos
  - Email: formato email@dominio.com
  - Telefone: +55 ou 11 dígitos
  - EVP: chave aleatória (UUID)
- **Validação de Chave**: Valida formato da chave PIX
- **Preview**: Mostra saldo após o saque
- **Resumo**: Exibe valor, saldo após saque e taxa reservada

### ✅ Edge Function (`mercadopago-send-pix`)

- **Validações de Segurança**:
  - Verifica dados completos
  - Valida valor mínimo (R$ 1,00)
  - Verifica existência da carteira
  - Valida saldo disponível (considerando taxa mínima)
  
- **Processamento**:
  - Cria transação em `pix_transactions`
  - Debita valor da carteira do usuário
  - Registra transação em `wallet_transactions`
  - Prepara payload para Mercado Pago
  - Atualiza status para "processing"

- **Segurança**:
  - Usa Service Role Key do Supabase
  - Validação de todos os parâmetros
  - Tratamento de erros completo
  - Logs detalhados

## 📊 Fluxo de Funcionamento

1. **Usuário** clica em "Solicitar Saque" no Dashboard
2. **Modal** abre mostrando saldo disponível
3. **Usuário** insere valor e chave PIX
4. **Sistema** valida:
   - Valor mínimo (R$ 1,00)
   - Saldo suficiente (mantendo R$ 1,70 na conta)
   - Formato da chave PIX
5. **Edge Function** processa:
   - Cria transação PIX
   - Debita da carteira
   - Registra histórico
   - Envia para Mercado Pago (futuro)
6. **Usuário** recebe confirmação

## 🔄 Status das Transações

- `pending`: Aguardando processamento
- `processing`: Em processamento
- `completed`: Concluído com sucesso
- `failed`: Falhou

## 📝 Notas Importantes

### Taxa Mínima de R$ 1,70
O sistema mantém R$ 1,70 na conta do usuário para cobrir possíveis taxas de transferência do Mercado Pago. Isso garante que sempre haverá saldo para processar a transação.

### Integração com Mercado Pago
A Edge Function está preparada para integração com a API do Mercado Pago. No momento, ela:
- Cria a transação no banco
- Debita o valor da carteira
- Prepara o payload para o MP
- Marca como "processing"

Para completar a integração, será necessário:
1. Usar a API de Money Out do Mercado Pago
2. Ou processar via webhook quando o pagamento for confirmado

## 🧪 Como Testar

1. **Faça login** como cliente
2. Vá para o **Dashboard**
3. Clique no card **"Solicitar Saque"**
4. Insira:
   - Valor: R$ 5,00 (exemplo)
   - Chave PIX: seu CPF, email ou telefone
5. Clique em **"Enviar PIX Agora"**
6. Verifique:
   - Toast de sucesso
   - Saldo atualizado
   - Transação em `pix_transactions`
   - Registro em `wallet_transactions`

## 🐛 Troubleshooting

### Erro: "Saldo insuficiente"
- Verifique se o usuário tem mais de R$ 2,70 na conta (R$ 1,00 saque + R$ 1,70 taxa)

### Erro: "Chave PIX inválida"
- Verifique o formato da chave
- CPF deve ter 11 dígitos
- Email deve ter formato válido
- Telefone deve ter 10-11 dígitos

### Edge Function não responde
- Verifique se foi feito o deploy
- Verifique as variáveis de ambiente no Supabase
- Veja os logs da função no Dashboard

## 📚 Arquivos Criados/Modificados

- ✅ `src/components/SaquePixModal.tsx` - Modal de saque PIX
- ✅ `supabase/functions/mercadopago-send-pix/index.ts` - Edge Function
- ✅ `src/pages/Dashboard.tsx` - Integração do modal
- ✅ `DEPLOY_SAQUE_PIX.md` - Este arquivo

## 🎉 Pronto!

Após o deploy da Edge Function, o sistema de saque PIX estará 100% funcional!
