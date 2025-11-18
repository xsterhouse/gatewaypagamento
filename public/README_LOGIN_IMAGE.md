# Imagem de Fundo do Login

## 📸 Instruções

Para completar o design da página de login, você precisa adicionar a imagem de fundo.

### Passo a Passo:

1. **Salve a imagem** que você enviou (a imagem branca/clara)
2. **Renomeie** para: `login-bg.jpg`
3. **Coloque** nesta pasta: `public/login-bg.jpg`

### Caminho Final:
```
c:\Users\XSTER\gatewaypagamento\public\login-bg.jpg
```

### Alternativa:

Se preferir usar outra imagem, basta:
1. Colocar a imagem em `public/`
2. Renomear para `login-bg.jpg`

A imagem será automaticamente:
- ✅ Escurecida (brightness 30%)
- ✅ Com overlay preto/gradiente
- ✅ Coberta (cover) para preencher toda a área
- ✅ Centralizada

### Resultado:

```
┌─────────────────────────────────────────────┐
│ [LOGO]                    │  [LOGO]         │
│                           │                 │
│ Acesse sua conta          │  [IMAGEM FUNDO] │
│ Insira os dados...        │                 │
│                           │  │ INOVAÇÃO    │
│ Email *                   │  │ FUTURO      │
│ [________________]        │  │ TECNOLOGIA  │
│                           │                 │
│ Senha *                   │                 │
│ [________________] 👁️     │                 │
│                           │                 │
│      Esqueceu a senha?    │                 │
│                           │                 │
│ [    Acessar    ]         │                 │
│                           │                 │
│ Criar conta agora.        │                 │
└─────────────────────────────────────────────┘
```

## ✨ Características da Imagem:

- **Escurecida**: brightness(0.3) para não ofuscar o texto
- **Overlay**: Gradiente preto para melhor legibilidade
- **Texto destacado**: Drop shadow no texto branco
- **Barra azul**: Linha vertical com glow effect
- **Logo no topo**: Com drop shadow

Após adicionar a imagem, faça commit:
```bash
git add public/login-bg.jpg
git commit -m "feat: adicionar imagem de fundo da página de login"
git push origin main
```
