# Fix: Erro HTTP 405 no Envio de Email

## Problema Identificado

No último step da criação de conta, o sistema estava dando erro:
```
Erro ao enviar email: Erro HTTP 405
```

### Causa Raiz

1. **Em desenvolvimento**: O código usa `/api/resend/emails` mas o proxy do Vite está configurado para `/api/resend`
2. **Em produção (Vercel)**: Não existia serverless function configurada, então todas as rotas `/api/*` eram redirecionadas para `/index.html`, causando erro 405 (Method Not Allowed)
3. **Estrutura incorreta**: Vercel requer que serverless functions estejam diretamente na pasta `api/`, não em subpastas

## Solução Implementada

### 1. Criada Serverless Function no Vercel

**Arquivo**: `api/resend-emails.ts` (diretamente na pasta api/)

Esta função:
- Recebe requisições POST com dados do email
- Valida a API Key do Resend
- Faz proxy para a API do Resend
- Retorna a resposta apropriada
- Inclui suporte a CORS

### 2. Atualizado `vercel.json`

Adicionado rewrite para mapear a rota corretamente:

```json
{
  "rewrites": [
    {
      "source": "/api/resend/emails",
      "destination": "/api/resend-emails"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 3. Adicionada Dependência

Instalado `@vercel/node` no `package.json` para suporte a serverless functions.

## Como Testar

### Em Desenvolvimento

1. Instalar nova dependência:
```bash
npm install
```

2. Reiniciar servidor:
```bash
npm run dev
```

3. Testar cadastro de nova conta

### Em Produção (Vercel)

1. Fazer commit e push das alterações:
```bash
git add .
git commit -m "Fix: Adicionar serverless function para envio de emails"
git push
```

2. Aguardar deploy no Vercel

3. Verificar se a variável `VITE_RESEND_API_KEY` está configurada no Vercel:
   - Ir em: Settings → Environment Variables
   - Adicionar: `VITE_RESEND_API_KEY` com sua API key do Resend

4. Testar cadastro em produção

## Arquivos Modificados

- ✅ `api/resend-emails.ts` (NOVO - serverless function principal)
- ✅ `api/resend/emails.ts` (ANTIGO - pode ser removido)
- ✅ `vercel.json` (atualizado com rewrite correto)
- ✅ `package.json` (adicionado @vercel/node)
- ✅ `src/lib/email.ts` (URL da API corrigida)

## Próximos Passos

1. Instalar dependências: `npm install`
2. Testar localmente
3. Fazer deploy no Vercel
4. Verificar variáveis de ambiente no Vercel
5. Testar em produção

## Notas Importantes

- A API Key do Resend deve estar configurada tanto no `.env` local quanto nas variáveis de ambiente do Vercel
- Em modo teste, emails são redirecionados para `xsterhouse@gmail.com`
- Para produção, certifique-se de verificar o domínio no Resend
