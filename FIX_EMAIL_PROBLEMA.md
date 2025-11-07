# 🔧 CORREÇÃO: Emails não estão chegando

## ❌ Problema Identificado

O código estava configurado com um domínio remetente **inválido**:
```typescript
from: 'Gateway Pagamento <noreply@seudominio.com>'
```

Este domínio não existe e o Resend **rejeita** emails de domínios não verificados.

## ✅ Solução Aplicada

Alterado para usar o domínio de teste oficial do Resend:
```typescript
from: 'DiMPay Gateway <onboarding@resend.dev>'
```

---

## 🚀 PASSOS PARA TESTAR AGORA

### 1️⃣ **Verificar API Key no .env**

Abra o arquivo `.env` na raiz do projeto e confirme que tem:
```env
VITE_RESEND_API_KEY=re_sua_api_key_aqui
```

**IMPORTANTE:**
- A key deve começar com `re_`
- Sem aspas
- Sem espaços
- Se não tiver, pegue em: https://resend.com/api-keys

### 2️⃣ **Reiniciar o Servidor**

**OBRIGATÓRIO** - O servidor precisa ser reiniciado para ler o .env atualizado:

```bash
# No terminal onde está rodando o servidor:
# Pressione Ctrl + C para parar

# Depois inicie novamente:
npm run dev
```

### 3️⃣ **Testar com Script de Teste**

Execute o script de teste que criei:

```bash
# 1. Abra o arquivo test-email.js
# 2. Altere a linha:
const TEST_EMAIL = 'seu_email@gmail.com'  # COLOQUE SEU EMAIL REAL

# 3. Execute:
node test-email.js
```

**O que esperar:**
- ✅ Se funcionar: Você receberá um email em 1-5 segundos
- ❌ Se falhar: O script mostrará o erro específico

### 4️⃣ **Testar no Sistema Real**

```
1. Acesse: http://localhost:5173/register
2. Preencha os dados com SEU EMAIL REAL
3. Clique em "Continuar"
4. Aguarde a mensagem: "Código enviado para seu email!"
5. Verifique seu email (e SPAM)
```

---

## 🔍 TROUBLESHOOTING

### Problema: "API Key inválida"

**Sintomas:**
```
❌ Erro ao enviar email
Status: 401 ou 403
```

**Solução:**
1. Verifique se a API Key no `.env` está correta
2. Acesse https://resend.com/api-keys
3. Crie uma nova API Key se necessário
4. Atualize no `.env`
5. **REINICIE O SERVIDOR** (Ctrl+C → npm run dev)

### Problema: "Email não chega"

**Sintomas:**
- Mensagem "Código enviado" aparece
- Mas email não chega

**Solução:**
1. **Verifique SPAM/Lixo Eletrônico** (90% dos casos)
2. Aguarde até 1 minuto
3. Verifique no Dashboard do Resend:
   - https://resend.com/emails
   - Veja se o email foi enviado
   - Status: Delivered, Bounced, etc.
4. Tente com outro email (Gmail, Outlook)

### Problema: "Limite excedido"

**Sintomas:**
```
❌ Erro: Rate limit exceeded
Status: 429
```

**Solução:**
- O domínio `onboarding@resend.dev` tem limite de **100 emails/dia**
- Aguarde 24h ou configure seu próprio domínio
- Veja seção "Configurar Domínio Próprio" abaixo

### Problema: "Servidor não reiniciou"

**Sintomas:**
- Alterações no `.env` não funcionam
- API Key não é reconhecida

**Solução:**
```bash
# 1. Pare COMPLETAMENTE o servidor
Ctrl + C (pode precisar pressionar 2x)

# 2. Verifique se parou
# Não deve ter mensagem "Local: http://localhost:5173"

# 3. Inicie novamente
npm run dev

# 4. Aguarde mensagem "Local: http://localhost:5173"
```

---

## 🎯 CONFIGURAR DOMÍNIO PRÓPRIO (Opcional)

Se quiser enviar mais de 100 emails/dia ou usar seu próprio domínio:

### 1. Adicionar Domínio no Resend

1. Acesse: https://resend.com/domains
2. Clique em "Add Domain"
3. Digite seu domínio: `seudominio.com`
4. Copie os registros DNS fornecidos

### 2. Configurar DNS

No seu provedor de domínio (GoDaddy, Hostinger, etc.):

```
Tipo: TXT
Nome: @
Valor: [valor fornecido pelo Resend]

Tipo: CNAME
Nome: resend._domainkey
Valor: [valor fornecido pelo Resend]

Tipo: MX
Nome: @
Valor: [valor fornecido pelo Resend]
```

### 3. Aguardar Verificação

- Pode levar de 15 minutos a 24 horas
- Verifique status em: https://resend.com/domains

### 4. Atualizar Código

No arquivo `src/lib/email.ts`, linha 41:
```typescript
from: 'DiMPay Gateway <noreply@seudominio.com>',
```

### 5. Reiniciar e Testar

```bash
npm run dev
# Teste enviando email
```

---

## 📊 VERIFICAR SE ESTÁ FUNCIONANDO

### Console do Navegador (F12)

Quando você tenta enviar email, deve ver:
```
✅ Email enviado com sucesso! ID: abc123...
```

Se ver erro:
```
❌ Erro ao enviar email: [detalhes]
Status: [código]
```

### Dashboard do Resend

Acesse: https://resend.com/emails

Você verá:
- ✅ Email enviado
- ✅ Status: Delivered
- ✅ Timestamp
- ✅ Destinatário

---

## ✅ CHECKLIST FINAL

Antes de testar, confirme:

- [ ] Arquivo `src/lib/email.ts` atualizado (domínio: onboarding@resend.dev)
- [ ] API Key configurada no `.env`
- [ ] API Key começa com `re_`
- [ ] Servidor reiniciado (Ctrl+C → npm run dev)
- [ ] Testou com script: `node test-email.js`
- [ ] Email de teste é REAL (não use email fake)
- [ ] Verificou pasta de SPAM

---

## 🆘 AINDA NÃO FUNCIONA?

Se seguiu todos os passos e ainda não funciona:

### 1. Execute o Script de Diagnóstico

```bash
node test-email.js
```

Copie TODA a saída do console e me envie.

### 2. Verifique Logs Detalhados

Abra o Console do Navegador (F12) e procure por:
- Mensagens de erro em vermelho
- Status codes (401, 403, 422, 429)
- Detalhes da resposta da API

### 3. Informações Úteis para Debug

Me envie:
- Mensagem de erro completa
- Status code
- Se a API Key está no .env
- Se o servidor foi reiniciado
- Se o email chegou no Dashboard do Resend

---

## 📚 RECURSOS

- **Resend Dashboard:** https://resend.com/emails
- **Resend API Keys:** https://resend.com/api-keys
- **Resend Docs:** https://resend.com/docs
- **Resend Support:** support@resend.com

---

## 🎉 RESUMO DAS ALTERAÇÕES

### Arquivo: `src/lib/email.ts`

**ANTES (❌ Não funcionava):**
```typescript
from: 'Gateway Pagamento <noreply@seudominio.com>',
```

**DEPOIS (✅ Funciona):**
```typescript
from: 'DiMPay Gateway <onboarding@resend.dev>',
```

### Melhorias Adicionadas:

1. ✅ Logs mais detalhados
2. ✅ Mensagens de erro específicas
3. ✅ Script de teste (`test-email.js`)
4. ✅ Tratamento de erros melhorado

---

**Agora teste e me avise se funcionou! 🚀**
