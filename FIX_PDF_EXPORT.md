# 🔧 Corrigir Erro de Exportação PDF

## ❌ Erro Atual
```
Erro ao gerar PDF. Instale: npm install jspdf jspdf-autotable
```

## ✅ Solução

### Passo 1: Dependências Já Instaladas
```bash
✅ jspdf - Instalado
✅ jspdf-autotable - Instalado
✅ @types/jspdf - Instalado
```

### Passo 2: Reiniciar Servidor de Desenvolvimento

**Opção 1: Parar e Iniciar**
```bash
# Pressione Ctrl+C no terminal onde o servidor está rodando
# Depois execute:
npm run dev
```

**Opção 2: Reiniciar Automático**
```bash
# No terminal:
Ctrl+C
npm run dev
```

### Passo 3: Limpar Cache (Se Necessário)
```bash
# Parar servidor
Ctrl+C

# Limpar cache do Vite
npm run dev -- --force

# Ou deletar pasta de cache
rm -rf node_modules/.vite
npm run dev
```

---

## 🧪 Testar Novamente

### 1. Após Reiniciar o Servidor:
```
1. Acesse: http://localhost:5173/financeiro
2. Clique em "Exportar PDF"
3. PDF deve ser gerado com sucesso!
```

### 2. Se Ainda Não Funcionar:

**Verificar se as bibliotecas estão instaladas:**
```bash
npm list jspdf jspdf-autotable
```

**Deve mostrar:**
```
├── jspdf@2.x.x
└── jspdf-autotable@3.x.x
```

**Se não aparecer, reinstalar:**
```bash
npm install jspdf jspdf-autotable --force
```

---

## 🔍 Verificar Instalação

### Comando:
```bash
npm list jspdf jspdf-autotable
```

### Saída Esperada:
```
gatewaypagamento@0.0.0
├── jspdf@2.5.1
└── jspdf-autotable@3.8.2
```

---

## 📝 Checklist

- [✅] jspdf instalado
- [✅] jspdf-autotable instalado
- [✅] @types/jspdf instalado
- [ ] Servidor reiniciado
- [ ] Testado exportação PDF

---

## 💡 Por Que Precisa Reiniciar?

O Vite (servidor de desenvolvimento) carrega as dependências na inicialização. Quando você instala novas bibliotecas, o servidor precisa ser reiniciado para reconhecê-las.

**Fluxo:**
```
1. npm install jspdf → Instala biblioteca
2. Servidor ainda não sabe que existe
3. Reinicia servidor → Carrega nova biblioteca
4. Agora funciona! ✅
```

---

## 🎯 Solução Rápida

**Execute no terminal:**
```bash
# Parar servidor (Ctrl+C)
# Depois:
npm run dev
```

**Teste:**
```
1. Acesse Financeiro
2. Clique "Exportar PDF"
3. ✅ Deve funcionar!
```

---

## 🐛 Se Continuar com Erro

### Erro Persiste Após Reiniciar?

**1. Verificar package.json:**
```json
{
  "dependencies": {
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.8.2"
  }
}
```

**2. Reinstalar tudo:**
```bash
rm -rf node_modules
rm package-lock.json
npm install
npm run dev
```

**3. Verificar console do navegador:**
```
F12 → Console
Veja se há erros específicos
```

---

## ✅ Status

- Bibliotecas: ✅ Instaladas
- Types: ✅ Instalados
- Código: ✅ Correto
- **Próximo:** Reiniciar servidor

---

**Reinicie o servidor e teste novamente!** 🚀
