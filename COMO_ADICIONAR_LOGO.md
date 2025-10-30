# 🎨 Como Adicionar o Logo DiMPay

## ✅ Modificações Feitas

Já modifiquei os arquivos:
- ✅ `src/pages/Login.tsx` - Logo substituído
- ✅ `src/pages/Register.tsx` - Logo substituído

## 📋 Próximo Passo: Salvar a Imagem

### **Opção 1: Salvar Manualmente (Recomendado)**

1. **Baixe/Copie a imagem do logo** que você enviou
2. **Salve no caminho:**
   ```
   c:\Users\XSTER\gatewaypagamento\src\assets\logo-dimpay.png
   ```
3. **Substitua** o arquivo vazio que criei

### **Opção 2: Via Código (se tiver a imagem em base64)**

Se você tiver a imagem em formato base64 ou URL, me envie e posso ajudar.

---

## 🧪 Testar

Após salvar a imagem:

```bash
npm run dev
```

Acesse:
- `/login` - Deve ver o logo DiMPay
- `/register` - Deve ver o logo DiMPay

---

## 📊 Estrutura de Pastas

```
gatewaypagamento/
├── src/
│   ├── assets/
│   │   └── logo-dimpay.png  ← Salve aqui!
│   ├── pages/
│   │   ├── Login.tsx        ✅ Modificado
│   │   └── Register.tsx     ✅ Modificado
```

---

## 🎨 Personalização

Se quiser ajustar o tamanho do logo:

### Login.tsx (linha ~150):
```tsx
<img 
  src="/src/assets/logo-dimpay.png" 
  alt="DiMPay" 
  className="h-16 w-auto"  ← Mude para h-20 ou h-12
/>
```

### Tamanhos sugeridos:
- `h-12` - Pequeno (48px)
- `h-16` - Médio (64px) ⭐ **Atual**
- `h-20` - Grande (80px)
- `h-24` - Muito Grande (96px)

---

## 🔍 Troubleshooting

### Logo não aparece:
1. Verifique se o arquivo existe em `src/assets/logo-dimpay.png`
2. Verifique se o nome está correto (case-sensitive)
3. Tente reiniciar o servidor (`npm run dev`)

### Logo muito grande/pequeno:
- Ajuste `h-16` para outro valor (h-12, h-20, etc)

### Logo com fundo branco:
- Se a imagem tiver fundo branco, use PNG com transparência
- Ou adicione uma borda/padding

---

## 💡 Alternativa: Logo SVG

Se quiser usar SVG (melhor qualidade):

1. Salve como `logo-dimpay.svg`
2. Use o mesmo código
3. SVG escala melhor em diferentes resoluções

---

## ✅ Resultado Final

### ANTES:
```
┌─────────────────┐
│  [PAY] Gateway  │
│                 │
│ Sistema de      │
│ Pagamentos      │
└─────────────────┘
```

### DEPOIS:
```
┌─────────────────┐
│   [LOGO IMG]    │
│                 │
│ Sistema de      │
│ Pagamentos      │
└─────────────────┘
```

---

**⚡ Salve a imagem em `src/assets/logo-dimpay.png` e pronto! ⚡**
