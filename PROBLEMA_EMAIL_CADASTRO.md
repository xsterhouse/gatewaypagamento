# 🔧 Problema: Email não chega no cadastro do cliente

## ✅ O que funciona:
- ✅ Script de teste (`node test-email.js`) - Email chega
- ✅ API Key está correta
- ✅ Resend está funcionando

## ❌ O que não funciona:
- ❌ Email no Step 3 (Verificação de Email) do cadastro

---

## 🔍 DIAGNÓSTICO

### Possíveis Causas:

#### 1. **API Key não está no .env**
O Vite precisa da API Key no arquivo `.env` para funcionar.

#### 2. **Servidor não foi reiniciado**
Após adicionar a API Key no `.env`, o servidor DEVE ser reiniciado.

#### 3. **Email está sendo enviado mas para o email errado**
Lembre-se: Resend em modo teste só envia para **xsterhouse@gmail.com**

---

## ✅ SOLUÇÃO PASSO A PASSO

### Passo 1: Verificar/Criar arquivo .env

**Locação:** `c:\Users\XSTER\gatewaypagamento\.env`

**Conteúdo necessário:**
```env
VITE_SUPABASE_URL=https://swokojvoiqowqoyngues.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
VITE_RESEND_API_KEY=re_HHGH2ofv_2ViU9tYRAgbDsz7UkGVBfiht
```

**⚠️ IMPORTANTE:**
- O arquivo deve estar na **raiz do projeto**
- Deve se chamar exatamente `.env` (com o ponto no início)
- Sem aspas nos valores
- Sem espaços extras

### Passo 2: Reiniciar o Servidor

**OBRIGATÓRIO** - O Vite só lê o `.env` ao iniciar:

```bash
# No terminal onde está rodando o servidor:
# Pressione: Ctrl + C (pode precisar pressionar 2x)

# Aguarde parar completamente

# Inicie novamente:
npm run dev

# Aguarde a mensagem: "Local: http://localhost:5173"
```

### Passo 3: Verificar se a API Key foi carregada

Abra o navegador e pressione **F12** (DevTools).

Na aba **Console**, digite:
```javascript
console.log(import.meta.env.VITE_RESEND_API_KEY)
```

**Deve mostrar:** `re_HHGH2ofv_2ViU9tYRAgbDsz7UkGVBfiht`

**Se mostrar `undefined`:**
- O `.env` não está no lugar certo
- O servidor não foi reiniciado
- O nome da variável está errado

### Passo 4: Testar o Cadastro

1. Acesse: http://localhost:5173/register
2. Preencha os dados:
   - Nome: Teste
   - Email: **qualquer@email.com** (pode ser fake)
   - CPF: 123.456.789-09
   - Senha: 12345678
3. Clique em "Continuar"
4. **Abra o Console (F12)** e veja as mensagens

**O que você deve ver no console:**

✅ **Se funcionar:**
```
📧 Enviando email para: qualquer@email.com
✅ Email enviado com sucesso! ID: abc123...
```

❌ **Se falhar:**
```
❌ Erro ao enviar email: [mensagem de erro]
Status: [código]
Código OTP (fallback): 123456
```

### Passo 5: Verificar o Email

**IMPORTANTE:** O email vai para **xsterhouse@gmail.com**, NÃO para o email que você digitou!

1. Abra **xsterhouse@gmail.com**
2. Procure por "Código de Verificação - Gateway Pagamento"
3. Verifique também o **SPAM**

---

## 🎯 MODO TESTE - ENTENDA COMO FUNCIONA

Como o Resend está em modo teste:

```
Cliente digita: teste@cliente.com
↓
Sistema tenta enviar para: teste@cliente.com
↓
Resend REDIRECIONA para: xsterhouse@gmail.com
↓
Email chega em: xsterhouse@gmail.com
```

**Isso significa:**
- ✅ Você pode testar com QUALQUER email
- ✅ Todos os códigos chegam no SEU email (xsterhouse@gmail.com)
- ✅ Você copia o código e usa no sistema
- ❌ Clientes reais NÃO receberão emails (até verificar domínio)

---

## 🐛 TROUBLESHOOTING

### Problema: "API Key não carregada"

**Verificar:**
```bash
# No PowerShell, na pasta do projeto:
dir .env

# Deve mostrar o arquivo .env
# Se não mostrar, o arquivo não existe ou está em outro lugar
```

**Criar .env:**
```bash
# No PowerShell:
echo VITE_RESEND_API_KEY=re_HHGH2ofv_2ViU9tYRAgbDsz7UkGVBfiht > .env
```

### Problema: "Servidor não reinicia"

```bash
# Forçar parada:
# Pressione Ctrl + C várias vezes

# Se não parar, feche o terminal e abra novo

# Inicie:
npm run dev
```

### Problema: "Console mostra erro"

**Erros comuns:**

**1. API Key inválida (401/403):**
```
❌ Erro: API Key inválida
```
→ API Key está errada no .env

**2. Email não permitido (403):**
```
❌ Erro: You can only send testing emails to...
```
→ Resend está redirecionando corretamente, mas há um bug no código

**3. Sem API Key:**
```
📧 EMAIL (MODO DESENVOLVIMENTO - SEM API KEY)
```
→ API Key não foi carregada do .env

---

## 🔧 CORREÇÃO ADICIONAL NECESSÁRIA

O código atual tem um problema: ele mostra "Código enviado" mesmo quando falha!

Vou corrigir isso para mostrar erro real ao usuário.

---

## ✅ CHECKLIST COMPLETO

Antes de testar novamente:

- [ ] Arquivo `.env` existe na raiz do projeto
- [ ] `.env` contém: `VITE_RESEND_API_KEY=re_HHGH2ofv_2ViU9tYRAgbDsz7UkGVBfiht`
- [ ] Servidor foi **completamente parado** (Ctrl+C)
- [ ] Servidor foi **reiniciado** (npm run dev)
- [ ] Console do navegador (F12) mostra a API Key
- [ ] Testou cadastro com qualquer email
- [ ] Verificou **xsterhouse@gmail.com** (não o email digitado)
- [ ] Verificou SPAM em xsterhouse@gmail.com
- [ ] Abriu Console (F12) para ver logs

---

## 📝 PRÓXIMOS PASSOS

1. **Confirme que o .env está configurado**
2. **Reinicie o servidor**
3. **Teste o cadastro**
4. **Verifique o Console (F12)** - me mostre o que aparece
5. **Verifique xsterhouse@gmail.com**

Me envie:
- ✅ Screenshot do console (F12) após tentar cadastrar
- ✅ Confirmação se o .env está configurado
- ✅ Confirmação se o servidor foi reiniciado

Vamos resolver isso! 🚀
