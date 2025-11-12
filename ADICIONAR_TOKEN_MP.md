# Como Adicionar Token do Mercado Pago

## O que fazer AGORA:

### 1. Obter o Token

Acesse: https://www.mercadopago.com.br/developers/panel/app

1. Faça login
2. Selecione/crie uma aplicação
3. Vá em "Credenciais"
4. Copie o **Access Token de PRODUÇÃO**

Deve começar com: `APP_USR-`

### 2. Editar o arquivo .env

Abra o arquivo `.env` e adicione esta linha:

```env
VITE_MERCADO_PAGO_ACCESS_TOKEN=APP_USR-seu_token_aqui
```

**Exemplo completo do .env:**

```env
VITE_SUPABASE_URL=https://plbcnvnsvytzqrhgybjd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYmNudm5zdnl0enFyaGd5YmpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1Nzg0OTEsImV4cCI6MjA3NzE1NDQ5MX0.gO6IR7J4GQ3-H-krweofIovj4rQyj_3XNPPsEpCy1jU

# Adicione esta linha:
VITE_MERCADO_PAGO_ACCESS_TOKEN=APP_USR-1234567890123456-112233-abcdef1234567890abcdef1234567890-123456789
```

### 3. Reiniciar o Servidor

IMPORTANTE: Após editar o .env, você DEVE reiniciar!

```bash
# No terminal onde o servidor está rodando:
# Pressione Ctrl+C

# Depois:
npm run dev
```

### 4. Verificar

Execute novamente:

```bash
.\check-env.ps1
```

Deve mostrar:
```
VITE_MERCADO_PAGO_ACCESS_TOKEN:
  Valor: APP_USR-1234567890...
  Tamanho: 123 caracteres
  Formato: OK - PRODUCAO
```

### 5. Testar

1. Abra o navegador
2. Tente gerar QR Code
3. Deve funcionar agora!

## Dicas:

- NÃO use aspas: `VITE_VAR=valor` (não `VITE_VAR="valor"`)
- NÃO deixe espaços: `VITE_VAR=valor` (não `VITE_VAR = valor`)
- Use token de PRODUÇÃO (APP_USR-), não de teste (TEST-)
