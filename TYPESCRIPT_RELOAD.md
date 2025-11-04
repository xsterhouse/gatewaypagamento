# 🔄 Como Resolver Erro TypeScript no VS Code

## ❌ Erro Atual:
```
Cannot find module './ui/scroll-area' or its corresponding type declarations.
```

## ✅ Solução:

O arquivo `scroll-area.tsx` foi criado, mas o TypeScript do VS Code precisa ser reiniciado para reconhecê-lo.

### Opção 1: Reiniciar TypeScript Server (Recomendado)
1. Pressione `Ctrl + Shift + P` (ou `Cmd + Shift + P` no Mac)
2. Digite: `TypeScript: Restart TS Server`
3. Pressione Enter
4. Aguarde alguns segundos
5. O erro deve desaparecer

### Opção 2: Recarregar VS Code
1. Pressione `Ctrl + Shift + P` (ou `Cmd + Shift + P` no Mac)
2. Digite: `Developer: Reload Window`
3. Pressione Enter
4. O VS Code vai recarregar
5. O erro deve desaparecer

### Opção 3: Fechar e Abrir o Arquivo
1. Feche o arquivo `PrivacyPolicy.tsx`
2. Feche o arquivo `TermsOfService.tsx`
3. Aguarde 5 segundos
4. Abra os arquivos novamente
5. O erro deve desaparecer

### Opção 4: Reiniciar VS Code Completamente
1. Feche o VS Code
2. Abra novamente
3. O erro deve desaparecer

---

## 🔍 Verificação:

Após reiniciar o TypeScript, verifique se:
- ✅ O arquivo `src/components/ui/scroll-area.tsx` existe
- ✅ O import funciona: `import { ScrollArea } from './ui/scroll-area'`
- ✅ Não há mais erros no arquivo

---

## 📝 Nota:

Este é um problema comum do VS Code quando novos arquivos são criados. O TypeScript Server precisa ser reiniciado para reconhecer novos módulos.

---

**Recomendação:** Use a **Opção 1** (Restart TS Server) - é a mais rápida!
