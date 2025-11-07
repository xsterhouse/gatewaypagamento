# 🔧 Configurações para Deploy na Vercel

## ❌ Problemas Identificados:

### 1. Proxy do Vite não funciona em produção
- O proxy `/api/resend` só funciona em desenvolvimento
- Em produção, a API é chamada diretamente

### 2. Variáveis de ambiente
- `process.env` não funciona no lado do cliente
- Precisa usar `import.meta.env`

### 3. CORS em produção
- API direta pode ter problemas de CORS
- Precisa configurar serverless functions

---

## ✅ SOLUÇÕES:

### 1. Configurar Environment Variables na Vercel

No dashboard da Vercel:
1. Vá para: **Settings** → **Environment Variables**
2. Adicione:
   ```
   VITE_SUPABASE_URL=https://swokojvoiqowqoyngues.supabase.co
   VITE_SUPABASE_ANON_KEY=your_real_anon_key
   VITE_RESEND_API_KEY=re_HHGH2ofv_2ViU9tYRAgbDsz7UkGVBfiht
   ```

### 2. Criar Serverless Function (Recomendado)

Crie arquivo: `api/resend.js`

```javascript
// api/resend.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify(req.body),
    })

    const data = await response.json()
    
    if (!response.ok) {
      return res.status(response.status).json(data)
    }

    return res.status(200).json(data)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
```

### 3. Atualizar email.ts para produção

```typescript
// Em produção, usa serverless function da Vercel
const apiUrl = import.meta.env.DEV 
  ? '/api/resend/emails'  // Proxy do Vite (dev)
  : '/api/resend'         // Serverless function (Vercel)
```

### 4. Variável de ambiente para a API

No `.env` da Vercel, adicione também:
```
RESEND_API_KEY=re_HHGH2ofv_2ViU9tYRAgbDsz7UkGVBfiht
```

---

## 🚀 Deploy Instructions:

1. **Configure environment variables** na Vercel
2. **Crie serverless function** `api/resend.js`
3. **Atualize email.ts** para usar `/api/resend` em produção
4. **Faça deploy** novamente

---

## 📋 Teste pós-deploy:

1. Acesse a URL da Vercel
2. Teste cadastro com email real
3. Verifique se email chega
4. Verifique console para erros

---

## ⚠️ Importante:

- **Proxy só funciona em dev**
- **Produção precisa de serverless functions**
- **Environment variables precisam ser configuradas na Vercel**
- **CORS é resolvido com serverless functions**
