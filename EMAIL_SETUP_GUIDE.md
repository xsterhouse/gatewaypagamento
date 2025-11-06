# 📧 **GUIA: Configurar Envio de Email**

## 🎯 **O QUE SERÁ CONFIGURADO:**

Sistema de envio de código OTP por email para:
- ✅ Cadastro de novos usuários
- ✅ Redefinição de senha
- ✅ Verificação de email

---

## 🚀 **PASSO 1: Criar Conta no Resend (GRÁTIS)**

### **1. Acessar Resend:**
```
https://resend.com/
```

### **2. Criar Conta:**
```
1. Clique em "Sign Up"
2. Use seu email
3. Confirme o email
4. Faça login
```

### **3. Plano Gratuito:**
```
✅ 100 emails/dia GRÁTIS
✅ 3.000 emails/mês GRÁTIS
✅ Sem cartão de crédito
✅ Perfeito para começar!
```

---

## 🔑 **PASSO 2: Obter API Key**

### **1. No Dashboard do Resend:**
```
https://resend.com/api-keys
```

### **2. Criar API Key:**
```
1. Clique em "Create API Key"
2. Nome: "Dimpay Pagamentos"
3. Permissões: "Sending access"
4. Clique em "Create"
```

### **3. Copiar a Key:**
```
Exemplo: re_123abc456def789ghi012jkl345mno678
```

⚠️ **IMPORTANTE:** Copie agora! Não será mostrada novamente!

---

## 🌐 **PASSO 3: Configurar Domínio (Opcional)**

### **Opção A: Usar Email Padrão (Mais Rápido)**
```
✅ Emails enviados de: onboarding@resend.dev
✅ Funciona imediatamente
✅ Pode cair em spam
```

### **Opção B: Usar Seu Domínio (Recomendado)**
```
1. Vá em: https://resend.com/domains
2. Clique em "Add Domain"
3. Digite: seudominio.com
4. Adicione os registros DNS:
   - TXT: resend._domainkey
   - CNAME: resend
5. Aguarde verificação (5-30 min)
```

**Emails enviados de:** `noreply@seudominio.com`

---

## 💻 **PASSO 4: Configurar no Projeto**

### **1. Criar arquivo .env (Local):**

```bash
# No diretório raiz do projeto
# c:\Users\XSTER\gatewaypagamento\.env
```

Adicione:
```env
VITE_RESEND_API_KEY=re_SUA_API_KEY_AQUI
```

### **2. Configurar na Vercel (Produção):**

```
1. Acesse: https://vercel.com/seu-projeto/settings/environment-variables

2. Adicione:
   Nome: VITE_RESEND_API_KEY
   Valor: re_SUA_API_KEY_AQUI
   Ambiente: Production, Preview, Development

3. Clique em "Save"

4. Redeploy o projeto
```

---

## 🧪 **PASSO 5: Testar**

### **1. Testar Localmente:**

```bash
# Iniciar servidor
npm run dev
```

```
1. Acesse: http://localhost:5173/register
2. Preencha os dados
3. Clique em "Continuar"
4. Verifique seu email!
```

### **2. Verificar Console:**

Se funcionar, você verá:
```
✅ Email enviado com sucesso!
```

Se falhar:
```
❌ Erro ao enviar email: [mensagem]
```

### **3. Verificar Email:**

```
📧 Assunto: Código de Verificação - Gateway Pagamento

┌─────────────────────────────────┐
│   [LOGO] Gateway                │
│                                 │
│   Código de Verificação         │
│   Use o código abaixo para      │
│   confirmar seu cadastro:       │
│                                 │
│   ┌─────────────────────────┐   │
│   │   SEU CÓDIGO            │   │
│   │   123456                │   │
│   └─────────────────────────┘   │
│                                 │
│   ✓ Expira em 15 minutos        │
│   ✓ Use apenas uma vez          │
│   ✓ Não compartilhe             │
└─────────────────────────────────┘
```

---

## 🔧 **TROUBLESHOOTING**

### **Email não chega:**

1. **Verificar spam/lixo eletrônico**
2. **Verificar API key:**
   ```bash
   # No console do navegador (F12)
   console.log(import.meta.env.VITE_RESEND_API_KEY)
   ```
3. **Verificar logs do Resend:**
   ```
   https://resend.com/emails
   ```

### **Erro "Invalid API key":**
```
✅ Verificar se copiou a key completa
✅ Verificar se tem o prefixo "re_"
✅ Reiniciar o servidor (npm run dev)
```

### **Email cai em spam:**
```
✅ Configurar domínio próprio
✅ Adicionar SPF, DKIM, DMARC
✅ Usar email profissional (não @gmail.com)
```

---

## 📊 **MONITORAMENTO**

### **Dashboard do Resend:**
```
https://resend.com/emails
```

Você pode ver:
- ✅ Emails enviados
- ✅ Taxa de entrega
- ✅ Erros
- ✅ Logs detalhados

---

## 💰 **CUSTOS**

### **Plano Gratuito:**
```
✅ 100 emails/dia
✅ 3.000 emails/mês
✅ Perfeito para começar!
```

### **Plano Pago (se precisar):**
```
💳 $20/mês
✅ 50.000 emails/mês
✅ Domínio personalizado
✅ Suporte prioritário
```

---

## 🔒 **SEGURANÇA**

### **Boas Práticas:**

1. ✅ **Nunca commitar** .env no Git
2. ✅ **Usar variáveis de ambiente** na Vercel
3. ✅ **Rotacionar API keys** periodicamente
4. ✅ **Monitorar uso** no dashboard
5. ✅ **Limitar tentativas** de envio (rate limiting)

### **.gitignore já configurado:**
```
.env
.env.local
.env.*.local
```

---

## 📝 **EXEMPLO DE FLUXO**

```
1. USUÁRIO PREENCHE CADASTRO
   ↓
2. SISTEMA GERA CÓDIGO OTP (6 dígitos)
   ↓
3. SISTEMA CHAMA sendOTPEmail()
   ↓
4. RESEND ENVIA EMAIL
   ↓
5. USUÁRIO RECEBE EMAIL
   ↓
6. USUÁRIO DIGITA CÓDIGO
   ↓
7. SISTEMA VALIDA CÓDIGO
   ↓
8. CONTA CRIADA! ✅
```

---

## 🎨 **PERSONALIZAR EMAIL**

O template está em: `src/lib/email.ts`

Você pode alterar:
- ✅ Cores
- ✅ Logo
- ✅ Textos
- ✅ Layout

---

## 📞 **SUPORTE**

- 📚 Docs Resend: https://resend.com/docs
- 💬 Suporte: support@resend.com
- 🐛 Status: https://status.resend.com/

---

**Seu sistema de email estará pronto em 5 minutos!** 🚀📧
