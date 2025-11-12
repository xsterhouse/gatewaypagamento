# ⚡ Configurar .env AGORA - Guia Rápido

## 🎯 Você está aqui porque viu este erro:
```
Token do Mercado Pago não configurado. Configure VITE_MERCADO_PAGO_ACCESS_TOKEN no arquivo .env
```

## ✅ Solução em 3 Passos

### Passo 1: Criar arquivo .env

**No terminal do VS Code, execute:**

```bash
cp .env.example .env
```

**Ou manualmente:**
1. Copie o arquivo `.env.example`
2. Cole na mesma pasta
3. Renomeie para `.env` (sem o .example)

### Passo 2: Obter Token do Mercado Pago

1. **Acesse:** https://www.mercadopago.com.br/developers/panel/app

2. **Faça login** com sua conta Mercado Pago

3. **Crie uma aplicação** (se não tiver):
   - Clique em "Criar aplicação"
   - Nome: "Gateway Pagamento" (ou qualquer nome)
   - Tipo: "Pagamentos online"

4. **Copie as credenciais de PRODUÇÃO:**
   - Vá em **"Credenciais"**
   - Selecione **"Credenciais de produção"** (não teste!)
   - Copie o **"Access Token"**

**Formato esperado:**
```
APP_USR-1234567890123456-112233-abcdef1234567890abcdef1234567890-123456789
```

⚠️ **IMPORTANTE**: 
- ❌ NÃO use credenciais de TESTE (começam com `TEST-`)
- ✅ Use credenciais de PRODUÇÃO (começam com `APP_USR-`)

### Passo 3: Configurar o arquivo .env

**Abra o arquivo `.env` e edite estas linhas:**

```env
VITE_SUPABASE_URL=https://swokojvoiqowqoyngues.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_do_supabase

VITE_MERCADO_PAGO_PUBLIC_KEY=sua_public_key_aqui
VITE_MERCADO_PAGO_ACCESS_TOKEN=APP_USR-seu_access_token_aqui
```

**Onde encontrar a Anon Key do Supabase:**
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie a **anon / public key**

### Passo 4: Reiniciar o Servidor

**IMPORTANTE**: Após editar o `.env`, você DEVE reiniciar o servidor!

```bash
# Pare o servidor (Ctrl+C no terminal)
# Depois inicie novamente:
npm run dev
```

### Passo 5: Testar

1. **Abra o navegador** em: http://localhost:5173
2. **Abra o Console** (F12)
3. **Tente gerar QR Code novamente**
4. **Deve funcionar agora!** ✅

## 📋 Exemplo Completo do .env

```env
# Supabase
VITE_SUPABASE_URL=https://swokojvoiqowqoyngues.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3b2tvanZvaXFvd3FveW5ndWVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTk5OTk5OTksImV4cCI6MjAxNTU3NTk5OX0.abc123xyz

# Email (opcional - pode deixar como está)
VITE_RESEND_API_KEY=your_resend_api_key_here

# Mercado Pago (OBRIGATÓRIO)
VITE_MERCADO_PAGO_PUBLIC_KEY=APP_USR-abc123-def456
VITE_MERCADO_PAGO_ACCESS_TOKEN=APP_USR-1234567890123456-112233-abcdef1234567890abcdef1234567890-123456789
```

## 🐛 Problemas Comuns

### Erro: "Arquivo .env não encontrado"

**Solução:**
```bash
# Criar arquivo .env
New-Item -Path .env -ItemType File

# Ou no PowerShell:
echo $null >> .env
```

### Erro: "Token ainda não configurado"

**Causa:** Servidor não foi reiniciado

**Solução:**
1. Pare o servidor (Ctrl+C)
2. Inicie novamente: `npm run dev`
3. Recarregue a página (F5)

### Erro: "401 Unauthorized"

**Causa:** Token inválido ou de teste

**Solução:**
1. Verifique se o token começa com `APP_USR-`
2. Gere novo token no painel Mercado Pago
3. Use credenciais de PRODUÇÃO

### Token aparece como "undefined" no console

**Causa:** Nome da variável errado ou servidor não reiniciado

**Solução:**
1. Verifique se o nome é exatamente: `VITE_MERCADO_PAGO_ACCESS_TOKEN`
2. Reinicie o servidor
3. Limpe cache do navegador (Ctrl+Shift+Delete)

## ✅ Checklist Final

- [ ] Arquivo `.env` criado na raiz do projeto
- [ ] Token do Mercado Pago copiado (começa com `APP_USR-`)
- [ ] Token colado no `.env` na linha `VITE_MERCADO_PAGO_ACCESS_TOKEN`
- [ ] Anon Key do Supabase configurada
- [ ] Servidor reiniciado (`npm run dev`)
- [ ] Página recarregada (F5)
- [ ] Console não mostra mais erro de token
- [ ] QR Code é gerado com sucesso

## 🎯 Comandos Rápidos

```bash
# 1. Criar .env (se não existir)
cp .env.example .env

# 2. Editar .env
code .env

# 3. Reiniciar servidor
# Ctrl+C (parar)
npm run dev

# 4. Abrir no navegador
# http://localhost:5173
```

## 📞 Verificar se Funcionou

**No console do navegador (F12), você deve ver:**

```
🚀 Criando PIX no Mercado Pago: {...}
🔑 Token length: 123
📦 Request body: {...}
✅ Resposta Mercado Pago: {...}
✅ PIX criado com sucesso!
```

**Se aparecer isso, FUNCIONOU!** 🎉

---

**Tempo estimado**: 5 minutos  
**Dificuldade**: Fácil  
**Próximo passo**: Gerar QR Code e testar pagamento
