# 🔑 API Key Não Está Sendo Carregada!

## ❌ PROBLEMA:

A API está retornando HTML ao invés de JSON:
```
<!doctype html> <html lang="pt-BR">...
```

Isso significa que a **API Key não foi carregada** e a requisição está falhando.

---

## 🔍 DIAGNÓSTICO:

Adicionei logs para verificar se a API Key está sendo carregada.

### Agora você verá no console:

```
🔑 API Key status: Carregada (re_HHGH2of...) OU NÃO CARREGADA
🌍 Ambiente: development
📦 Todas as variáveis: [lista de variáveis]
```

---

## ✅ SOLUÇÃO:

### 1. **VOCÊ REINICIOU O SERVIDOR?**

**CRÍTICO:** O Vite **NÃO** recarrega o `.env` automaticamente!

```bash
# No terminal do servidor:
Ctrl + C (pressione 2x se necessário)

# Aguarde parar COMPLETAMENTE

# Inicie novamente:
npm run dev

# Aguarde: "Local: http://localhost:5176"
```

### 2. **Verifique o arquivo .env**

Execute no PowerShell:
```powershell
Get-Content .env
```

**Deve mostrar:**
```
VITE_SUPABASE_URL=https://plbcnvnsvytzqrhgybjd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_RESEND_API_KEY=re_HHGH2ofv_2ViU9tYRAgbDsz7UkGVBfiht
```

**Se não tiver a última linha**, execute:
```powershell
Add-Content .env "`nVITE_RESEND_API_KEY=re_HHGH2ofv_2ViU9tYRAgbDsz7UkGVBfiht"
```

### 3. **Teste Novamente**

Depois de reiniciar o servidor:

1. Acesse: http://localhost:5176/register-kyc
2. Preencha os dados
3. Clique em "Continuar" no Step 2
4. **Veja o console (F12)**

---

## 📊 O QUE VOCÊ VERÁ:

### ✅ SE A API KEY FOI CARREGADA:
```
🔑 API Key status: Carregada (re_HHGH2of...)
🌍 Ambiente: development
📦 Todas as variáveis: [BASE_URL, MODE, DEV, PROD, SSR, VITE_RESEND_API_KEY, ...]
📧 Enviando email para: teste@teste.com
📥 Resposta da API: {"id":"abc123..."}
✅ Email enviado com sucesso! ID: abc123...
```

### ❌ SE A API KEY NÃO FOI CARREGADA:
```
🔑 API Key status: NÃO CARREGADA
🌍 Ambiente: development
📦 Todas as variáveis: [BASE_URL, MODE, DEV, PROD, SSR, ...]

============================================================
📧 EMAIL (MODO DESENVOLVIMENTO - SEM API KEY)
============================================================
Para: teste@teste.com
Assunto: Código de Verificação

💡 VEJA O CÓDIGO OTP NO REGISTRO/LOGIN
⚠️ Configure VITE_RESEND_API_KEY no .env para enviar emails reais
⚠️ LEMBRE-SE: Reinicie o servidor após adicionar no .env!
============================================================
```

---

## 🎯 CHECKLIST:

- [ ] Arquivo `.env` tem a linha: `VITE_RESEND_API_KEY=re_HHGH2ofv_2ViU9tYRAgbDsz7UkGVBfiht`
- [ ] Servidor foi **PARADO COMPLETAMENTE** (Ctrl+C)
- [ ] Servidor foi **REINICIADO** (npm run dev)
- [ ] Aguardou mensagem "Local: http://localhost:5176"
- [ ] Testou cadastro novamente
- [ ] Verificou console (F12)
- [ ] Console mostra: `🔑 API Key status: Carregada`

---

## 💡 DICA:

Se o console mostrar `NÃO CARREGADA`, significa que:
1. O `.env` não tem a API Key, OU
2. O servidor não foi reiniciado, OU
3. O nome da variável está errado

**Solução:** Verifique o `.env` e reinicie o servidor!

---

## 🚀 TESTE AGORA:

1. **Verifique o .env:** `Get-Content .env`
2. **Reinicie o servidor:** Ctrl+C → npm run dev
3. **Teste o cadastro**
4. **Veja o console:** Procure por `🔑 API Key status:`
5. **Me mostre o resultado!**

Se mostrar `Carregada`, o email será enviado com sucesso! 🎉
