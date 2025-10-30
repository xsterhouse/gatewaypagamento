# 📧 Configuração de Email - Guia Completo

## 🚀 Modo Desenvolvimento (Atual - SEM Configuração)

### ✅ Como Funciona AGORA:

**O sistema está configurado para funcionar IMEDIATAMENTE em desenvolvimento:**

1. **Código OTP visível na tela** ✅
   - Durante o registro, o código aparece em verde na interface
   - Não precisa verificar email
   - Copie e cole o código mostrado

2. **Código no Console do Navegador** ✅
   - Pressione `F12` para abrir DevTools
   - Vá na aba "Console"
   - Veja o código OTP logado

3. **Não precisa de configuração externa** ✅
   - Funciona sem Resend
   - Funciona sem SMTP
   - Funciona sem nenhuma API Key

### 📝 Como Testar:

1. Acesse `/register`
2. Preencha os dados
3. Clique em "Continuar"
4. **Veja o código em verde** na tela: `Código de teste: 123456`
5. Digite o código
6. Pronto! ✅

---

## 📧 Modo Produção (Opcional - Para enviar emails reais)

Se você quiser enviar emails REAIS em produção, siga os passos abaixo:

### Opção 1: Resend (Recomendado - Gratuito para começar)

#### 1. Criar Conta no Resend

1. Acesse: https://resend.com
2. Crie uma conta gratuita
3. Verifique seu email

#### 2. Obter API Key

1. No dashboard do Resend, vá em **"API Keys"**
2. Clique em **"Create API Key"**
3. Dê um nome: `Gateway Pagamento`
4. Selecione permissão: **"Sending access"**
5. Copie a API Key (começará com `re_...`)

#### 3. Configurar Domínio (Opcional mas Recomendado)

**Sem domínio próprio:**
- Use: `onboarding@resend.dev` (limite de 100 emails/dia)

**Com domínio próprio:**
1. No Resend, vá em **"Domains"**
2. Clique em **"Add Domain"**
3. Digite seu domínio: `seudominio.com`
4. Adicione os registros DNS fornecidos:
   - SPF
   - DKIM
   - DMARC
5. Aguarde verificação (pode levar até 24h)

#### 4. Configurar no Projeto

**No arquivo `.env`:**

```env
# Email Service - Resend
VITE_RESEND_API_KEY=re_sua_api_key_aqui

# Exemplo:
# VITE_RESEND_API_KEY=re_abc123xyz456
```

**No arquivo `src/lib/email.ts` (linha 41):**

```typescript
// Se NÃO tem domínio verificado:
from: 'Gateway Pagamento <onboarding@resend.dev>',

// Se TEM domínio verificado:
from: 'Gateway Pagamento <noreply@seudominio.com>',
```

#### 5. Testar

1. Reinicie o servidor: `npm run dev`
2. Tente fazer registro
3. Verifique seu email real
4. Use o código recebido

---

### Opção 2: SMTP (Gmail, Outlook, etc.)

Se preferir usar seu próprio servidor SMTP, instale o Nodemailer:

#### 1. Instalar Dependência

```bash
npm install nodemailer
npm install -D @types/nodemailer
```

#### 2. Atualizar `.env`

```env
# Email Service - SMTP
VITE_SMTP_HOST=smtp.gmail.com
VITE_SMTP_PORT=587
VITE_SMTP_USER=seu_email@gmail.com
VITE_SMTP_PASS=sua_senha_app
VITE_SMTP_FROM=Gateway Pagamento <seu_email@gmail.com>
```

**⚠️ Gmail:**
- Não use sua senha normal
- Use "Senha de App": https://myaccount.google.com/apppasswords
- Ative 2FA antes de gerar senha de app

#### 3. Criar Serviço SMTP

Crie `src/lib/email-smtp.ts`:

```typescript
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: import.meta.env.VITE_SMTP_HOST,
  port: parseInt(import.meta.env.VITE_SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: import.meta.env.VITE_SMTP_USER,
    pass: import.meta.env.VITE_SMTP_PASS,
  },
})

export async function sendEmailSMTP(to: string, subject: string, html: string) {
  try {
    const info = await transporter.sendMail({
      from: import.meta.env.VITE_SMTP_FROM,
      to,
      subject,
      html,
    })
    return { success: true, messageId: info.messageId }
  } catch (error: any) {
    console.error('Erro SMTP:', error)
    return { success: false, error: error.message }
  }
}
```

#### 4. Atualizar `email.ts`

No `src/lib/email.ts`, importe e use:

```typescript
import { sendEmailSMTP } from './email-smtp'

// No método sendEmail:
if (import.meta.env.VITE_SMTP_HOST) {
  return await sendEmailSMTP(to, subject, html)
}
```

---

### Opção 3: Outros Serviços

#### SendGrid
- Site: https://sendgrid.com
- Gratuito: 100 emails/dia
- Similar ao Resend

#### Mailgun
- Site: https://mailgun.com
- Gratuito: 5.000 emails/mês (primeiro mês)

#### Amazon SES
- Site: https://aws.amazon.com/ses/
- Gratuito: 62.000 emails/mês (se usar EC2)

#### Postmark
- Site: https://postmarkapp.com
- Trial: 100 emails

---

## 🧪 Testando Emails

### Durante Desenvolvimento:

**Método 1: Ver na Tela (Atual)**
```
1. Faça registro
2. Veja código em verde na tela
3. Use o código
```

**Método 2: Ver no Console**
```
1. Abra DevTools (F12)
2. Aba "Console"
3. Veja logs de email
```

**Método 3: Mailtrap (Sandbox)**
- Site: https://mailtrap.io
- Captura emails de teste
- Não envia emails reais
- Perfeito para desenvolvimento

### Em Produção:

**Com Resend configurado:**
```
1. Faça registro com seu email real
2. Verifique caixa de entrada
3. Use código recebido
```

---

## 🔍 Troubleshooting

### Problema: "Código não enviado"

**Solução em Desenvolvimento:**
✅ **O código ESTÁ sendo "enviado"** - ele aparece na tela!
- Veja em verde: `Código de teste: 123456`
- Não precisa verificar email
- Copie e cole na caixa

**Solução em Produção:**
1. Verifique se API Key está no `.env`
2. Verifique se `.env` está carregado (restart servidor)
3. Verifique console do navegador para erros
4. Verifique logs do Resend dashboard

### Problema: "API Key inválida"

```
1. Confirme que copiou a key completa
2. Key deve começar com "re_"
3. Não adicione espaços ou aspas
4. Reinicie servidor após adicionar no .env
```

### Problema: "Email não chega"

```
1. Verifique spam/lixo eletrônico
2. Aguarde até 5 minutos
3. Verifique se domínio está verificado no Resend
4. Verifique logs no dashboard do Resend
5. Teste com email diferente
```

### Problema: "CORS error"

```
Resend funciona server-side. Se vê erro CORS:
1. A chamada está sendo feita do browser (incorreto)
2. Deve ser feita do servidor
3. Para Vite, funciona no dev server
4. Em produção, pode precisar de proxy/API route
```

---

## 📋 Checklist de Produção

Antes de colocar em produção:

- [ ] API Key do Resend configurada
- [ ] Domínio verificado no Resend
- [ ] Email "from" atualizado com seu domínio
- [ ] Testado envio real de email
- [ ] Email não vai para spam
- [ ] Template de email está bonito
- [ ] Logs de erro implementados
- [ ] Rate limiting implementado (evitar spam)
- [ ] Expiração de código implementada (15min)
- [ ] Backup caso email falhe

---

## 💡 Dicas

### Desenvolvimento:
- ✅ Use código visível na tela (método atual)
- ✅ Use Mailtrap para testar layout do email
- ✅ Não configure nada se não precisar de emails reais

### Produção:
- ✅ Use Resend (fácil e confiável)
- ✅ Verifique seu domínio (evita spam)
- ✅ Monitore rate limits
- ✅ Implemente retry em caso de falha
- ✅ Tenha fallback (SMS, código de backup, etc.)

### Segurança:
- ⚠️ NUNCA commite API Keys no código
- ⚠️ Use variáveis de ambiente
- ⚠️ Rotacione keys periodicamente
- ⚠️ Monitore uso da API
- ⚠️ Implemente rate limiting

---

## 🎉 Resumo

### Modo Atual (Desenvolvimento) - SEM Configuração:
```
✅ Código aparece na tela em verde
✅ Não precisa email real
✅ Não precisa configurar nada
✅ Funciona imediatamente
```

### Modo Produção (Opcional) - COM Configuração:
```
1. Criar conta no Resend
2. Obter API Key
3. Adicionar no .env
4. (Opcional) Verificar domínio
5. Pronto!
```

---

## 📞 Precisa de Ajuda?

**Resend Documentation:**
https://resend.com/docs

**Resend Support:**
support@resend.com

**Código atual já funciona em desenvolvimento!**
Emails reais são opcionais e só para produção.
