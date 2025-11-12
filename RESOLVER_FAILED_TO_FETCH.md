# 🔧 Resolver Erro "Failed to Fetch" ao Gerar QR Code

## ❌ Erro Atual

Ao clicar em "Gerar QR Code" no painel do cliente, aparece:
```
Failed to fetch
```

## 🔍 Causas Possíveis

1. **Token do Mercado Pago não configurado**
2. **Token inválido ou expirado**
3. **Erro de CORS (Cross-Origin)**
4. **Problema de conexão com internet**
5. **Credenciais de teste em vez de produção**

## ✅ Soluções

### Solução 1: Verificar Token no .env

1. **Abra o arquivo `.env`** na raiz do projeto

2. **Verifique se existe:**
```env
VITE_MERCADO_PAGO_ACCESS_TOKEN=seu_token_aqui
```

3. **Se não existir ou estiver vazio:**
   - Acesse: https://www.mercadopago.com.br/developers/panel/app
   - Vá em sua aplicação
   - Copie o **Access Token de PRODUÇÃO** (não teste!)
   - Cole no arquivo `.env`

4. **Reinicie o servidor:**
```bash
# Pare o servidor (Ctrl+C)
npm run dev
```

### Solução 2: Verificar Console do Navegador

1. **Abra o DevTools** (F12)
2. **Vá na aba Console**
3. **Tente gerar o QR Code novamente**

**Procure por estas mensagens:**

#### Se aparecer: "Token do Mercado Pago não configurado"
```
❌ Token do Mercado Pago não configurado!
```
**Solução**: Configure o token no `.env` (Solução 1)

#### Se aparecer: "401 Unauthorized"
```
❌ Erro Mercado Pago: 401
```
**Solução**: Token inválido. Gere um novo token no painel do Mercado Pago

#### Se aparecer: "CORS error"
```
Access to fetch at 'https://api.mercadopago.com' has been blocked by CORS policy
```
**Solução**: Isso é esperado. O Mercado Pago bloqueia chamadas diretas do frontend em alguns casos. Veja Solução 3.

### Solução 3: Verificar Credenciais de Produção

⚠️ **IMPORTANTE**: Credenciais de TESTE não funcionam para PIX real!

1. **Acesse:** https://www.mercadopago.com.br/developers/panel/app
2. **Verifique se está em PRODUÇÃO** (não Teste)
3. **Copie o Access Token de PRODUÇÃO**
4. **Cole no `.env`:**

```env
VITE_MERCADO_PAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxx
```

**Diferença:**
- ❌ Teste: `TEST-xxxxxxxxxx`
- ✅ Produção: `APP_USR-xxxxxxxxxx`

### Solução 4: Verificar Configuração do Adquirente

1. **Execute o script SQL no Supabase:**
```sql
SELECT * FROM bank_acquirers WHERE bank_code = 'MP';
```

2. **Se não retornar nada:**
   - Execute o script: `CONFIGURAR_MERCADOPAGO.sql`

3. **Se retornar, verifique:**
   - `is_active` = true
   - `is_default` = true
   - `status` = 'active'

### Solução 5: Limpar Cache e Reiniciar

```bash
# Parar servidor
Ctrl+C

# Limpar cache do navegador
# Ou abrir em aba anônima

# Reiniciar servidor
npm run dev
```

## 🧪 Teste Rápido

### 1. Verificar se o token está carregando:

Adicione este código temporário em qualquer página:

```javascript
console.log('Token MP:', import.meta.env.VITE_MERCADO_PAGO_ACCESS_TOKEN?.substring(0, 20))
```

**Deve mostrar:**
```
Token MP: APP_USR-1234567890ab
```

**Se mostrar `undefined` ou `hxE568qqSBPbyCoTQtmS5rO6l0GCyzjI`:**
- Token não está configurado corretamente no `.env`

### 2. Testar API do Mercado Pago:

Abra o console do navegador e execute:

```javascript
fetch('https://api.mercadopago.com/v1/payments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer SEU_TOKEN_AQUI'
  },
  body: JSON.stringify({
    transaction_amount: 1,
    description: 'Teste',
    payment_method_id: 'pix',
    payer: { email: 'test@test.com' }
  })
})
.then(r => r.json())
.then(d => console.log('Resposta:', d))
.catch(e => console.error('Erro:', e))
```

**Resposta esperada:**
- ✅ Status 201: Token válido
- ❌ Status 401: Token inválido
- ❌ CORS error: Bloqueio do navegador (normal)

## 📋 Checklist de Verificação

- [ ] Arquivo `.env` existe na raiz do projeto
- [ ] Variável `VITE_MERCADO_PAGO_ACCESS_TOKEN` está configurada
- [ ] Token começa com `APP_USR-` (produção)
- [ ] Servidor foi reiniciado após configurar `.env`
- [ ] Console do navegador não mostra erro de token
- [ ] Adquirente Mercado Pago está ativo no banco
- [ ] Conexão com internet está funcionando

## 🔐 Onde Encontrar o Token

1. **Acesse:** https://www.mercadopago.com.br/developers/panel/app
2. **Selecione sua aplicação** (ou crie uma nova)
3. **Vá em "Credenciais"**
4. **Copie o "Access Token" de PRODUÇÃO**

**Formato esperado:**
```
APP_USR-1234567890123456-112233-abcdef1234567890abcdef1234567890-123456789
```

## 🐛 Erros Comuns

### Erro: "Token não configurado"

**Arquivo `.env` não existe ou está vazio**

**Solução:**
```bash
# Criar arquivo .env
cp .env.example .env

# Editar e adicionar token
# VITE_MERCADO_PAGO_ACCESS_TOKEN=seu_token_aqui
```

### Erro: "401 Unauthorized"

**Token inválido ou expirado**

**Solução:**
1. Gere novo token no painel Mercado Pago
2. Atualize no `.env`
3. Reinicie servidor

### Erro: "CORS policy"

**Mercado Pago bloqueou a requisição**

**Isso é NORMAL em alguns casos.** O código já trata isso.

**Se persistir:**
- Verifique se está usando HTTPS em produção
- Em desenvolvimento local, pode ocorrer

### Erro: "QR Code não gerado"

**API retornou sucesso mas sem QR Code**

**Causa:** Credenciais de teste ou conta não verificada

**Solução:**
1. Use credenciais de PRODUÇÃO
2. Verifique sua conta no Mercado Pago
3. Cadastre chave PIX na conta

## 📊 Logs Úteis

Ao tentar gerar QR Code, verifique no console:

```
🚀 Criando PIX no Mercado Pago: {...}
📦 Request body: {...}
🔑 Token length: 123
✅ Resposta Mercado Pago: {...}
✅ PIX criado com sucesso!
```

**Se não aparecer esses logs:**
- Erro aconteceu antes de chamar a API
- Verifique configuração do adquirente

**Se aparecer erro 401:**
```
❌ Erro Mercado Pago: 401 {...}
```
- Token inválido
- Gere novo token

## 🚀 Solução Definitiva

**Para garantir que funcione:**

1. **Configure o `.env` corretamente:**
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key
VITE_MERCADO_PAGO_ACCESS_TOKEN=APP_USR-seu_token_de_producao
```

2. **Execute o script SQL:**
```sql
-- No Supabase SQL Editor
-- Execute: CONFIGURAR_MERCADOPAGO.sql
```

3. **Reinicie o servidor:**
```bash
npm run dev
```

4. **Teste em aba anônima:**
   - Abra aba anônima (Ctrl+Shift+N)
   - Acesse o link de pagamento
   - Tente gerar QR Code

5. **Verifique o console:**
   - Deve mostrar logs de sucesso
   - QR Code deve aparecer

## 📞 Ainda com Problema?

**Envie estas informações:**

1. **Mensagem de erro completa** do console (F12)
2. **Screenshot** do erro
3. **Logs** que aparecem no console
4. **Primeira linha do token** (ex: `APP_USR-1234...`)
5. **Ambiente** (desenvolvimento local ou produção)

---

**Última atualização**: 12/11/2025  
**Status**: ✅ Correções Implementadas
