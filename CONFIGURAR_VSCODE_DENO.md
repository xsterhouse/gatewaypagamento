# 🔧 Configurar VSCode para Edge Functions Deno

## Por que os erros aparecem?

As Edge Functions do Supabase rodam em **Deno**, mas o VSCode está configurado para TypeScript/Node.js.

## ✅ Solução Rápida

### Opção 1: Instalar Extensão Deno (Recomendado)

1. Instale a extensão **Deno** no VSCode:
   - Pressione `Ctrl+Shift+X`
   - Busque por "Deno"
   - Instale "denoland.vscode-deno"

2. Crie o arquivo `.vscode/settings.json` (se não existir):
```json
{
  "deno.enable": true,
  "deno.enablePaths": [
    "./supabase/functions"
  ],
  "deno.lint": true,
  "deno.unstable": false,
  "[typescript]": {
    "editor.defaultFormatter": "denoland.vscode-deno"
  }
}
```

3. Recarregue o VSCode: `Ctrl+Shift+P` → "Reload Window"

### Opção 2: Ignorar Erros (Mais Simples)

Os erros **NÃO afetam** o funcionamento das Edge Functions quando deployadas no Supabase.

Você pode simplesmente ignorá-los, pois:
- ✅ As funções funcionam perfeitamente no Supabase
- ✅ O Deno resolve os imports automaticamente
- ✅ Os tipos são validados no deploy

## 📝 Arquivos Criados

Já foram criados os arquivos `deno.json` em cada Edge Function:
- `supabase/functions/banco-inter-create-pix/deno.json`
- `supabase/functions/banco-inter-send-pix/deno.json`
- `supabase/functions/banco-inter-create-boleto/deno.json`

Esses arquivos configuram o Deno para cada função.

## 🚀 Deploy das Funções

Para fazer deploy (sem erros):

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link com seu projeto
supabase link --project-ref SEU_PROJECT_REF

# Deploy
supabase functions deploy banco-inter-create-pix
supabase functions deploy banco-inter-send-pix
supabase functions deploy banco-inter-create-boleto
```

## ✅ Verificar se está funcionando

Após o deploy, teste no Supabase Dashboard:
1. Vá em **Edge Functions**
2. Selecione a função
3. Clique em **"Invoke"**
4. Teste com um payload de exemplo

---

**Resumo**: Os erros são apenas avisos do editor. As funções funcionam perfeitamente quando deployadas! 🎉
