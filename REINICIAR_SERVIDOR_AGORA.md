# 🚨 AÇÃO NECESSÁRIA: REINICIAR SERVIDOR

## ⚠️ PROBLEMA ATUAL:

Você está vendo este erro:
```
Erro ao processar resposta da API: <!doctype html>...
```

Isso significa que a **API Key NÃO está sendo carregada** pelo Vite.

---

## ✅ SOLUÇÃO (3 PASSOS SIMPLES):

### PASSO 1: Parar o Servidor

No terminal onde está rodando `npm run dev`:

```bash
Ctrl + C
```

**Pressione 2x se necessário até parar completamente.**

Você saberá que parou quando não ver mais:
```
Local: http://localhost:5176
```

### PASSO 2: Verificar o .env

Execute no PowerShell:
```powershell
Get-Content .env
```

**Deve ter esta linha:**
```
VITE_RESEND_API_KEY=re_HHGH2ofv_2ViU9tYRAgbDsz7UkGVBfiht
```

**Se NÃO tiver**, execute:
```powershell
Add-Content .env "`nVITE_RESEND_API_KEY=re_HHGH2ofv_2ViU9tYRAgbDsz7UkGVBfiht"
```

### PASSO 3: Iniciar o Servidor Novamente

```bash
npm run dev
```

**Aguarde a mensagem:**
```
Local: http://localhost:5176
```

---

## 🎯 DEPOIS DE REINICIAR:

1. Acesse: http://localhost:5176/register-kyc
2. Preencha os dados
3. Clique em "Continuar" no Step 2
4. **Abra o Console (F12)**

### Você verá:

```
🔑 API Key status: Carregada (re_HHGH2of...)
📧 Enviando email para: teste@teste.com
📥 Resposta da API: {"id":"abc123..."}
✅ Email enviado com sucesso! ID: abc123...
```

---

## ❓ POR QUE PRECISA REINICIAR?

O Vite (servidor de desenvolvimento) **só lê o arquivo `.env` quando inicia**.

Se você adicionar ou alterar variáveis no `.env` com o servidor rodando, ele **NÃO vai ver as mudanças**.

**É OBRIGATÓRIO reiniciar!**

---

## 📝 CHECKLIST:

- [ ] Parei o servidor (Ctrl+C)
- [ ] Verifiquei o .env (tem VITE_RESEND_API_KEY)
- [ ] Iniciei o servidor (npm run dev)
- [ ] Aguardei mensagem "Local: http://localhost:5176"
- [ ] Testei o cadastro
- [ ] Vi no console: "🔑 API Key status: Carregada"

---

## 🎉 RESULTADO ESPERADO:

Após reiniciar, o email será enviado com sucesso e você verá:

**No Console:**
```
✅ Email enviado com sucesso! ID: abc123...
```

**Na Tela:**
```
✅ Documentos selecionados! Código enviado para seu email.
```

**No Email (xsterhouse@gmail.com):**
```
📧 Código de Verificação - Gateway Pagamento
Código: 123456
```

---

## 🚀 FAÇA AGORA:

1. **Ctrl + C** no terminal do servidor
2. **npm run dev**
3. **Teste novamente**
4. **Me mostre o console!**

**REINICIE AGORA! É RÁPIDO (10 segundos)!** ⚡
