# 🧪 **TESTE DE ENVIO DE EMAIL**

## ✅ **VOCÊ JÁ FEZ:**
- ✅ Criou conta no Resend
- ✅ Obteve API key
- ✅ Adicionou no .env

---

## 🚀 **AGORA FAÇA:**

### **1. REINICIAR O SERVIDOR**

**IMPORTANTE:** O servidor precisa ser reiniciado para ler o novo `.env`!

```bash
# No terminal onde está rodando o servidor:
# Pressione: Ctrl + C (para parar)

# Depois inicie novamente:
npm run dev
```

---

### **2. VERIFICAR SE A API KEY FOI CARREGADA**

Abra o navegador e acesse:
```
http://localhost:5173
```

Pressione **F12** para abrir o Console e digite:
```javascript
console.log(import.meta.env.VITE_RESEND_API_KEY)
```

**Deve mostrar:** `re_abc123...` (sua API key)

**Se mostrar:** `undefined` ou `your_resend_api_key_here`
→ O servidor não foi reiniciado ou o .env está errado

---

### **3. TESTAR CADASTRO**

#### **Opção A: Registro Simples**
```
1. Acesse: http://localhost:5173/register
2. Preencha:
   - Nome: Seu Nome
   - Email: SEU_EMAIL_REAL@gmail.com ⚠️
   - Senha: 12345678
   - Confirmar Senha: 12345678
   - CPF: 123.456.789-09
3. Clique em "Continuar"
4. Aguarde...
```

#### **Opção B: Registro com KYC**
```
1. Acesse: http://localhost:5173/register-kyc
2. Preencha todos os dados
3. Continue até o Step 3 (Verificação de Email)
```

---

### **4. VERIFICAR O QUE ACONTECE**

#### **✅ SE FUNCIONAR:**

Você verá:
```
✅ "Código enviado para seu email!"
```

E receberá um email em **1-5 segundos**:
```
📧 De: onboarding@resend.dev
📧 Assunto: Código de Verificação - Gateway Pagamento
📧 Conteúdo: Código de 6 dígitos
```

#### **❌ SE NÃO FUNCIONAR:**

Você verá no console (F12):
```
❌ Erro ao enviar email: [mensagem]
```

**Possíveis erros:**

1. **"Invalid API key"**
   - API key está errada
   - Servidor não foi reiniciado
   
2. **"Rate limit exceeded"**
   - Enviou muitos emails (limite: 100/dia)
   
3. **"Email não chega"**
   - Verifique spam/lixo eletrônico
   - Aguarde até 1 minuto

---

### **5. VERIFICAR NO DASHBOARD DO RESEND**

Acesse:
```
https://resend.com/emails
```

Você verá:
- ✅ Email enviado
- ✅ Status: Delivered
- ✅ Timestamp
- ✅ Destinatário

---

## 🎯 **CHECKLIST DE TESTE**

- [ ] Servidor reiniciado (Ctrl+C → npm run dev)
- [ ] API key carregada (verificar no console)
- [ ] Acessou página de registro
- [ ] Preencheu com EMAIL REAL
- [ ] Clicou em "Continuar"
- [ ] Viu mensagem "Código enviado"
- [ ] Recebeu email (verificar spam)
- [ ] Código funciona (6 dígitos)
- [ ] Conseguiu criar conta

---

## 📧 **EXEMPLO DO EMAIL QUE VOCÊ VAI RECEBER**

```
┌─────────────────────────────────────────┐
│  De: onboarding@resend.dev              │
│  Para: seu@email.com                    │
│  Assunto: Código de Verificação         │
├─────────────────────────────────────────┤
│                                         │
│   [LOGO] Gateway                        │
│                                         │
│   Código de Verificação                 │
│   Use o código abaixo para              │
│   confirmar seu cadastro:               │
│                                         │
│   ┌───────────────────────────────┐     │
│   │   SEU CÓDIGO                  │     │
│   │   123456                      │     │
│   └───────────────────────────────┘     │
│                                         │
│   ✓ Expira em 15 minutos                │
│   ✓ Use apenas uma vez                  │
│   ✓ Não compartilhe                     │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🐛 **TROUBLESHOOTING**

### **Problema: API key não carrega**

**Solução:**
```bash
# 1. Verificar se o .env está na raiz do projeto
# Deve estar em: c:\Users\XSTER\gatewaypagamento\.env

# 2. Verificar formato do .env
# Deve ser:
VITE_RESEND_API_KEY=re_abc123xyz456
# SEM aspas, SEM espaços

# 3. Reiniciar servidor
# Ctrl+C → npm run dev
```

### **Problema: Email não chega**

**Solução:**
```
1. Verificar spam/lixo eletrônico
2. Aguardar até 1 minuto
3. Verificar no Resend Dashboard se foi enviado
4. Tentar outro email
```

### **Problema: "Invalid API key"**

**Solução:**
```
1. Verificar se copiou a key completa
2. Verificar se tem o prefixo "re_"
3. Criar nova API key no Resend
4. Atualizar no .env
5. Reiniciar servidor
```

---

## 📊 **LOGS ÚTEIS**

### **Console do Navegador (F12):**
```javascript
// Ver se API key foi carregada
console.log(import.meta.env.VITE_RESEND_API_KEY)

// Ver modo de desenvolvimento
console.log(import.meta.env.DEV)
```

### **Terminal do Servidor:**
```
Se funcionar:
✅ Email enviado com sucesso!

Se falhar:
❌ Erro ao enviar email: [mensagem]
```

---

## 🎉 **SUCESSO!**

Se você:
- ✅ Recebeu o email
- ✅ Código funciona
- ✅ Conseguiu criar conta

**Parabéns! Sistema de email está funcionando!** 🚀📧

---

## 🚀 **PRÓXIMO PASSO: PRODUÇÃO**

Para funcionar na Vercel:

```
1. Acesse: https://vercel.com/seu-projeto/settings/environment-variables

2. Adicione:
   Nome: VITE_RESEND_API_KEY
   Valor: re_SUA_API_KEY
   Ambiente: Production

3. Redeploy

4. Testar no domínio
```

---

**Boa sorte no teste! Me avise se funcionar ou se tiver algum erro!** 🤞
