# 🏦 Configurar Banco Inter para Envio Real de PIX

## 🎯 Problema Resolvido

Antes, o sistema apenas **simulava** o envio de PIX (criava registro no banco, debitava saldo, mas o dinheiro não chegava na conta destino).

Agora, o sistema está integrado com a **Edge Function `mercadopago-send-pix`** que usa o **Banco Inter** para enviar PIX de verdade.

---

## 📋 Pré-requisitos

Para que o dinheiro realmente chegue na conta do destinatário, você precisa:

1. **Conta PJ no Banco Inter** (Pessoa Jurídica)
2. **Certificado Digital** (A1 ou A3)
3. **Credenciais da API do Banco Inter**

---

## 🔧 Passo 1: Obter Credenciais do Banco Inter

### 1.1 Acessar o Portal do Banco Inter

1. Acesse: https://developers.bancointer.com.br/
2. Faça login com sua conta PJ
3. Vá em **"Aplicações"** → **"Nova Aplicação"**

### 1.2 Criar Aplicação PIX

1. Nome: `Gateway Pagamento - PIX`
2. Tipo: **PIX**
3. Ambiente: **Produção** (ou Sandbox para testes)
4. Escopos necessários:
   - `pix.read`
   - `pix.write`
   - `pix.send` ⚠️ **ESSENCIAL para envio**

### 1.3 Obter Credenciais

Após criar a aplicação, você receberá:
- **Client ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- **Client Secret**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### 1.4 Certificado Digital

Você precisa de um certificado digital válido:

**Opção A: Certificado A1 (arquivo .pfx)**
```bash
# Extrair chave privada
openssl pkcs12 -in certificado.pfx -nocerts -out key.pem -nodes

# Extrair certificado
openssl pkcs12 -in certificado.pfx -clcerts -nokeys -out cert.pem
```

**Opção B: Certificado A3 (token/cartão)**
- Exportar para formato .pfx
- Seguir passos da Opção A

---

## 🔐 Passo 2: Configurar Variáveis de Ambiente no Supabase

### 2.1 Acessar Supabase Dashboard

1. Vá para: https://supabase.com/dashboard
2. Selecione seu projeto
3. Menu lateral → **Settings** → **Edge Functions**

### 2.2 Adicionar Secrets

Clique em **"Add Secret"** e adicione as seguintes variáveis:

```bash
# Credenciais do Banco Inter
BANCO_INTER_CLIENT_ID=seu-client-id-aqui
BANCO_INTER_CLIENT_SECRET=seu-client-secret-aqui

# Certificado Digital (conteúdo do arquivo cert.pem)
BANCO_INTER_CERTIFICATE=-----BEGIN CERTIFICATE-----
MIIFxzCCA6+gAwIBAgIUXXXXXXXXXXXXXXXXXXXXXXXXXXX...
(cole todo o conteúdo do certificado aqui)
-----END CERTIFICATE-----

# Chave Privada (conteúdo do arquivo key.pem)
BANCO_INTER_CERTIFICATE_KEY=-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBK...
(cole todo o conteúdo da chave aqui)
-----END PRIVATE KEY-----

# Número da Conta
BANCO_INTER_ACCOUNT_NUMBER=12345678
```

### 2.3 Salvar e Redeployar

Após adicionar os secrets:
1. Clique em **"Save"**
2. Vá em **Edge Functions** → **mercadopago-send-pix**
3. Clique em **"Deploy"** para aplicar as novas variáveis

---

## 🧪 Passo 3: Testar em Ambiente Sandbox

Antes de ir para produção, teste no ambiente Sandbox do Banco Inter:

### 3.1 Configurar Sandbox

Use as credenciais de **Sandbox** fornecidas pelo Banco Inter:

```bash
BANCO_INTER_CLIENT_ID=sandbox-client-id
BANCO_INTER_CLIENT_SECRET=sandbox-client-secret
BANCO_INTER_CERTIFICATE=certificado-sandbox
BANCO_INTER_CERTIFICATE_KEY=chave-sandbox
BANCO_INTER_ACCOUNT_NUMBER=conta-sandbox
```

### 3.2 Testar Envio

1. Faça login no painel como cliente
2. Clique em **"Enviar PIX"**
3. Preencha:
   - Valor: R$ 1,00
   - Tipo: CPF
   - Chave: Use uma chave PIX de teste do Sandbox
4. Confirme o envio

### 3.3 Verificar Logs

No Supabase Dashboard:
1. **Edge Functions** → **mercadopago-send-pix** → **Logs**
2. Verifique se aparece:
   ```
   📨 Enviando PIX via Banco Inter...
   ✅ PIX enviado via Banco Inter: {...}
   ```

---

## 🚀 Passo 4: Ativar Produção

Quando tudo estiver funcionando no Sandbox:

### 4.1 Trocar para Credenciais de Produção

Substitua os secrets no Supabase pelas credenciais **reais de produção**.

### 4.2 Verificar Saldo

Certifique-se de que a conta do Banco Inter tem saldo suficiente para os envios.

### 4.3 Configurar Limites

No código da Edge Function (`supabase/functions/mercadopago-send-pix/index.ts`), você pode ajustar:

```typescript
// Linha 70
const TAXA_MINIMA = 1.70 // Ajuste conforme necessário

// Linha 44
if (amount < 1.00) {
  throw new Error('Valor mínimo para saque é R$ 1,00')
}
```

---

## 📊 Passo 5: Executar SQL Faltante

Execute o SQL para adicionar colunas necessárias:

```sql
-- No Supabase SQL Editor
-- Copie e cole o conteúdo de: ADICIONAR_COLUNAS_PIX_FALTANTES.sql
```

Isso adiciona as colunas:
- `receiver_name`
- `fee_amount`
- `net_amount`
- `transaction_type`
- `metadata`

---

## 🔍 Como Funciona o Fluxo Completo

### Frontend (Cliente clica "Enviar PIX")
```
1. Cliente preenche formulário
2. Frontend valida saldo e chave PIX
3. Frontend chama Edge Function mercadopago-send-pix
```

### Edge Function (Supabase)
```
4. Valida saldo novamente
5. Debita valor da carteira do cliente
6. Chama API do Banco Inter
7. Banco Inter envia PIX real para a chave destino
8. Registra transação como 'completed'
9. Retorna sucesso para o frontend
```

### Frontend (Após sucesso)
```
10. Debita taxas separadamente
11. Registra coleta de taxas do sistema
12. Envia notificação ao cliente
13. Atualiza saldo na tela
```

---

## ⚠️ Problemas Comuns

### 1. "Erro ao enviar PIX via Banco Inter"

**Causa:** Credenciais inválidas ou certificado expirado

**Solução:**
- Verifique se as variáveis de ambiente estão corretas
- Certifique-se de que o certificado não expirou
- Teste as credenciais no Postman/Insomnia primeiro

### 2. "Saldo insuficiente"

**Causa:** Conta do Banco Inter sem saldo

**Solução:**
- Transfira dinheiro para a conta PJ do Banco Inter
- Verifique o saldo disponível no app do banco

### 3. "Chave PIX não encontrada"

**Causa:** Chave PIX do destinatário inválida ou não cadastrada

**Solução:**
- Peça ao cliente para verificar a chave PIX
- Teste com uma chave PIX válida conhecida

### 4. "Certificate verification failed"

**Causa:** Certificado digital mal formatado

**Solução:**
- Certifique-se de copiar TODO o conteúdo do certificado
- Inclua as linhas `-----BEGIN CERTIFICATE-----` e `-----END CERTIFICATE-----`
- Não deixe espaços extras ou quebras de linha incorretas

---

## 📈 Monitoramento

### Ver Logs da Edge Function

```bash
# No terminal (se tiver Supabase CLI instalado)
supabase functions logs mercadopago-send-pix --follow
```

Ou no Dashboard:
**Edge Functions** → **mercadopago-send-pix** → **Logs**

### Ver Transações no Banco

```sql
-- Ver últimos PIX enviados
SELECT 
  id,
  user_id,
  amount,
  pix_key,
  status,
  pix_e2e_id,
  created_at
FROM pix_transactions
WHERE transaction_type = 'withdrawal'
ORDER BY created_at DESC
LIMIT 20;

-- Ver PIX que falharam
SELECT 
  id,
  amount,
  pix_key,
  metadata->>'error' as erro,
  created_at
FROM pix_transactions
WHERE transaction_type = 'withdrawal'
  AND status = 'failed'
ORDER BY created_at DESC;
```

---

## 💰 Custos

### Banco Inter
- **Tarifa por PIX enviado:** Consulte seu contrato PJ
- Geralmente: R$ 0,00 a R$ 1,00 por transação

### Supabase
- **Edge Functions:** Incluídas no plano gratuito até 500k invocações/mês
- **Banco de Dados:** Incluído no plano gratuito até 500MB

---

## 🎯 Checklist Final

Antes de liberar para produção:

- [ ] Conta PJ no Banco Inter criada
- [ ] Certificado digital válido obtido
- [ ] Credenciais da API configuradas no Supabase
- [ ] Testado em ambiente Sandbox
- [ ] SQL de colunas executado
- [ ] Saldo disponível na conta do Banco Inter
- [ ] Limites de envio configurados
- [ ] Logs monitorados
- [ ] Notificações funcionando
- [ ] Teste real com valor baixo (R$ 1,00)

---

## 📞 Suporte

### Banco Inter
- Portal: https://developers.bancointer.com.br/
- Suporte: suporte.api@bancointer.com.br
- Documentação: https://developers.bancointer.com.br/docs

### Supabase
- Documentação: https://supabase.com/docs
- Discord: https://discord.supabase.com

---

**Versão:** 1.0.0  
**Data:** 21/11/2024  
**Status:** ✅ Pronto para Configuração
