# 🚀 Como Ativar Modo Produção - Enviar para Email do Cliente

## 📋 SITUAÇÃO ATUAL:

✅ **Modo Teste Ativo**
- Todos os emails vão para: `xsterhouse@gmail.com`
- Usa domínio: `onboarding@resend.dev`
- Funciona perfeitamente para desenvolvimento

---

## 🎯 PARA ENVIAR PARA EMAIL DO CLIENTE:

### **OPÇÃO 1: Verificar Domínio no Resend (Recomendado)**

#### Passo 1: Adicionar Domínio

1. Acesse: https://resend.com/domains
2. Clique em **"Add Domain"**
3. Digite seu domínio: `dimpay.com` (ou o que você tiver)
4. Clique em **"Add"**

#### Passo 2: Configurar DNS

O Resend vai fornecer 3 registros DNS:

**Exemplo:**
```
Tipo: TXT
Nome: resend._domainkey
Valor: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...

Tipo: TXT
Nome: @
Valor: v=spf1 include:resend.com ~all

Tipo: TXT
Nome: _dmarc
Valor: v=DMARC1; p=none; rua=mailto:dmarc@dimpay.com
```

**Onde adicionar:**
- Se usa **GoDaddy**: Painel → DNS → Adicionar registros
- Se usa **Registro.br**: Painel → DNS → Editar zona
- Se usa **Cloudflare**: Dashboard → DNS → Add record

#### Passo 3: Aguardar Verificação

- Pode levar de **15 minutos a 48 horas**
- Resend vai verificar automaticamente
- Você receberá email quando estiver pronto
- Status ficará **"Verified"** no dashboard

#### Passo 4: Ativar Modo Produção

No arquivo `src/lib/email.ts`, linha 40:

**Antes:**
```typescript
const RESEND_TEST_MODE = true // Modo teste ativo
```

**Depois:**
```typescript
const RESEND_TEST_MODE = false // Modo produção ativo
```

E na linha 64, altere o domínio:

**Antes:**
```typescript
: 'DiMPay Gateway <noreply@dimpay.com>' // Altere para seu domínio
```

**Depois:**
```typescript
: 'DiMPay Gateway <noreply@SEUDOMINIO.com>' // Use seu domínio verificado
```

#### Passo 5: Testar

1. Salve o arquivo
2. Teste o cadastro
3. O email irá para o email que o cliente digitou! ✅

---

### **OPÇÃO 2: Usar Outro Provedor de Email**

Se não quiser verificar domínio, pode usar:

#### **SendGrid** (Grátis: 100 emails/dia)
1. Crie conta: https://sendgrid.com
2. Obtenha API Key
3. Substitua código em `src/lib/email.ts`

#### **Mailgun** (Grátis: 5.000 emails/mês)
1. Crie conta: https://mailgun.com
2. Verifique domínio
3. Use API do Mailgun

#### **Amazon SES** (Muito barato)
1. Crie conta AWS
2. Configure SES
3. Use SDK da AWS

---

## 🔧 CÓDIGO ATUAL:

Já deixei preparado no `src/lib/email.ts`:

```typescript
// Linha 40
const RESEND_TEST_MODE = true // Mude para false após verificar domínio

// Linha 64
const fromEmail = RESEND_TEST_MODE 
  ? 'DiMPay Gateway <onboarding@resend.dev>'
  : 'DiMPay Gateway <noreply@dimpay.com>' // Altere para seu domínio
```

**Para ativar:**
1. Verifique domínio no Resend
2. Mude `RESEND_TEST_MODE` para `false`
3. Altere `noreply@dimpay.com` para seu domínio
4. Pronto! ✅

---

## 📊 COMPARAÇÃO:

| Aspecto | Modo Teste | Modo Produção |
|---------|-----------|---------------|
| **Destinatário** | xsterhouse@gmail.com | Email do cliente |
| **Remetente** | onboarding@resend.dev | noreply@seudominio.com |
| **Limite** | Ilimitado | Conforme plano |
| **Verificação** | Não precisa | Precisa verificar domínio |
| **Uso** | Desenvolvimento | Produção |

---

## ⚠️ IMPORTANTE:

### Para Produção Real:

1. **Nunca exponha API Key no frontend**
   - Crie backend (Node.js/Express)
   - Ou use Serverless Functions (Netlify/Vercel)
   - API Key deve ficar no servidor

2. **Configure DKIM/SPF/DMARC**
   - Melhora deliverability
   - Evita cair no SPAM
   - Resend fornece tudo pronto

3. **Monitore limites**
   - Resend Free: 100 emails/dia
   - Resend Pro: 50.000 emails/mês ($20)

---

## 🎯 RECOMENDAÇÃO:

**Para agora (desenvolvimento):**
- ✅ Deixe em modo teste
- ✅ Está funcionando perfeitamente
- ✅ Você recebe todos os códigos

**Para produção:**
1. Verifique domínio no Resend
2. Mude `RESEND_TEST_MODE = false`
3. Crie backend para proteger API Key
4. Teste com emails reais

---

## 📝 RESUMO:

**Modo Teste (Atual):**
```
Cliente digita: cliente@email.com
↓
Email vai para: xsterhouse@gmail.com ✅
```

**Modo Produção (Após verificar domínio):**
```
Cliente digita: cliente@email.com
↓
Email vai para: cliente@email.com ✅
```

---

## 🚀 PRÓXIMOS PASSOS:

1. **Agora:** Continue testando em modo teste
2. **Quando precisar produção:** Verifique domínio no Resend
3. **Depois:** Mude `RESEND_TEST_MODE = false`
4. **Pronto!** Emails vão para clientes reais

**Dúvidas? Me avise!** 💬
