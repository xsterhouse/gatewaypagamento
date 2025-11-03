# 🔄 Resolver Problema de Cache do Modal

## ❌ Problema:
O modal ainda mostra "URL da Imagem" em vez do upload

## ✅ Soluções:

### Solução 1: Limpar Cache do Navegador (Mais Rápido)

1. Abra o navegador onde está testando
2. Pressione **Ctrl + Shift + R** (Windows) ou **Cmd + Shift + R** (Mac)
3. Isso força o reload sem cache
4. Teste novamente

### Solução 2: Hard Refresh

1. Abra as **Ferramentas do Desenvolvedor** (F12)
2. Clique com botão direito no ícone de reload
3. Selecione **"Limpar cache e recarregar forçado"**
4. Teste novamente

### Solução 3: Limpar Cache Completo

1. Pressione **Ctrl + Shift + Delete**
2. Selecione:
   - ✅ Imagens e arquivos em cache
   - ✅ Cookies e dados de sites
3. Período: **Última hora**
4. Clique em **"Limpar dados"**
5. Recarregue a página

### Solução 4: Reiniciar Servidor de Desenvolvimento

No terminal onde o Vite está rodando:

1. Pressione **Ctrl + C** para parar
2. Execute novamente:
   ```bash
   npm run dev
   ```
3. Aguarde o servidor iniciar
4. Acesse novamente

### Solução 5: Modo Anônimo

1. Abra uma **janela anônima/privada**
2. Acesse o sistema
3. Faça login
4. Teste o modal
5. Deve aparecer o upload!

### Solução 6: Verificar se o arquivo foi salvo

1. Abra: `src/components/CreatePaymentLinkModal.tsx`
2. Procure por: `Imagem do Produto`
3. Deve ter o código de upload (linhas 264-318)
4. Se não tiver, o arquivo não foi salvo
5. Salve novamente: **Ctrl + S**

## 🧪 Como Testar:

Após limpar o cache:

1. Acesse **/checkout**
2. Clique em **"Criar Link"**
3. Vá na aba **"Básico"**
4. Deve aparecer:
   - ✅ Campo "Imagem do Produto"
   - ✅ Área tracejada com ícone de upload
   - ✅ Texto "Clique para fazer upload"
   - ✅ "PNG, JPG, GIF até 5MB"

## ✅ Confirmação:

Se ainda aparecer "URL da Imagem":
- ❌ Cache não foi limpo
- ❌ Arquivo não foi salvo
- ❌ Servidor não recarregou

Se aparecer área de upload:
- ✅ Tudo certo!
- ✅ Pode testar fazendo upload

## 🎯 Teste Completo:

1. Clique na área de upload
2. Selecione uma imagem
3. Veja o preview aparecer
4. Preencha título e preço
5. Clique em "Criar Link"
6. Deve fazer upload e criar o link!

---

**Dica:** Sempre use **Ctrl + Shift + R** ao testar mudanças no código!
