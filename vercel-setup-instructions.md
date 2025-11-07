# 🚀 Configuração do Deploy na Vercel

## 📋 Passo a Passo:

### 1. Environment Variables na Vercel

Acesse: https://vercel.com/dashboard → Seu projeto → Settings → Environment Variables

Adicione estas variáveis:

```
VITE_SUPABASE_URL
Valor: https://swokojvoiqowqoyngues.supabase.co

VITE_SUPABASE_ANON_KEY  
Valor: [sua real anon key do Supabase]

VITE_RESEND_API_KEY
Valor: re_HHGH2ofv_2ViU9tYRAgbDsz7UkGVBfiht

RESEND_API_KEY
Valor: re_HHGH2ofv_2ViU9tYRAgbDsz7UkGVBfiht
```

### 2. Fazer Deploy

1. **Commit as mudanças:**
   ```bash
   git add -A
   git commit -m "feat: add vercel serverless function for email"
   git push
   ```

2. **Vercel vai fazer deploy automático**

### 3. Verificar Deploy

1. **Acesse a URL da Vercel**
2. **Abra o console** (F12)
3. **Teste cadastro** com email real
4. **Verifique logs:**
   ```
   📧 Enviando email para: cliente@email.com
   🌐 URL da API: /api/resend
   📥 Resposta da API: {"id":"abc123..."}
   ✅ Email enviado com sucesso!
   ```

### 4. Se ainda der erro CORS

Se ainda tiver CORS, pode ser que a serverless function não esteja funcionando. Verifique:

1. **Logs da Vercel:** Dashboard → Functions → api/resend
2. **Se não aparecer logs:** A function não foi deployada
3. **Se der erro:** Veja o erro nos logs

---

## 🔧 Troubleshooting:

### Erro: "Cannot find module"
- **Causa:** Node.js modules não encontrados
- **Solução:** Adicionar `package.json` na raiz

### Erro: "API Key inválida"
- **Causa:** Environment variable não configurada
- **Solução:** Configure `RESEND_API_KEY` na Vercel

### Erro: "CORS"
- **Causa:** Chamando API direta sem serverless
- **Solução:** Use `/api/resend` (serverless function)

### Erro: "404 Not Found"
- **Causa:** Serverless function não foi deployada
- **Solução:** Verifique se `api/resend.js` está no commit

---

## 📧 Como Funciona Agora:

```
Frontend (Vercel)
    ↓
/api/resend (Serverless Function)
    ↓
https://api.resend.com/emails (API Resend)
```

**Vantagens:**
✅ Sem CORS
✅ API Key protegida
✅ Logs centralizados
✅ Funciona em produção

---

## 🎯 Teste Final:

1. **Deploy na Vercel**
2. **Configure environment variables**
3. **Teste cadastro completo**
4. **Verifique email do cliente**
5. **Se funcionou:** Sistema 100% pronto! 🎉
