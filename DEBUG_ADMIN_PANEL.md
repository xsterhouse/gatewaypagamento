# 🔧 Debug: Painel Admin Tela Preta

## ✅ Melhorias Implementadas

Adicionei **logs de debug** e **telas de erro** para identificar o problema:

---

## 🔍 Como Debugar

### 1. Abra o Console do Navegador
```
F12 → Console
```

### 2. Verifique os Logs
Ao acessar `/admin/dashboard`, você deve ver:

```javascript
🔵 AdminDashboard montado, carregando dados...
// Queries sendo executadas...
✅ Loading finalizado
```

Se aparecer:
```javascript
❌ Erro ao carregar dashboard: [mensagem do erro]
```

→ **Há um erro específico!** Copie a mensagem completa.

---

## 🎯 Possíveis Causas

### 1. Erro de Permissão (RLS)
**Sintoma:** Loading infinito ou erro "permission denied"

**Solução:**
```sql
-- Verificar se o admin tem permissão
SELECT * FROM users WHERE role = 'admin';

-- Garantir que policies permitem admin acessar tudo
```

### 2. Tabela Não Existe
**Sintoma:** Erro "relation does not exist"

**Solução:**
- Verificar se todas as tabelas existem no banco

### 3. Tema Muito Escuro
**Sintoma:** Tela preta sem erros no console

**Solução:**
- Abra `src/contexts/ThemeContext.tsx`
- Verifique as cores do tema

### 4. Loading Infinito
**Sintoma:** Spinner eternamente

**Solução:** Veja logs no console, pode ser query travada

---

## 🛠️ O que Foi Adicionado

### 1. Loading Melhorado
```typescript
// Antes: Texto simples
<div>Carregando...</div>

// Agora: Spinner + Background
<div className="bg-background">
  <div className="animate-spin..."></div>
  <p>Carregando Dashboard Admin...</p>
</div>
```

### 2. Tela de Erro
```typescript
if (error) {
  return (
    <div>
      <AlertCircle />
      <h2>Erro ao Carregar Dashboard</h2>
      <p>{error}</p>
      <button onClick={reload}>Recarregar</button>
    </div>
  )
}
```

### 3. Logs de Debug
```typescript
console.log('🔵 AdminDashboard montado')
console.error('❌ Erro:', error)
console.log('✅ Loading finalizado')
```

### 4. Background no Container
```typescript
<div className="bg-background min-h-screen p-6">
  // Conteúdo do dashboard
</div>
```

---

## 🧪 Como Testar

### 1. Limpe o Cache
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

### 2. Acesse o Admin
```
http://localhost:5173/admin/dashboard
```

### 3. Verifique
- [ ] Aparece spinner de loading?
- [ ] Aparece mensagem de erro?
- [ ] Aparece dashboard normal?
- [ ] Console tem erros?

---

## 📊 Checklist de Problemas

### Background Preto
- [ ] Verifique se `bg-background` está aplicado
- [ ] Verifique cores do tema (ThemeContext)
- [ ] Teste alternar tema claro/escuro

### Loading Infinito
- [ ] Verifique console por erros
- [ ] Verifique se banco está acessível
- [ ] Verifique RLS policies

### Dados Não Aparecem
- [ ] Verifique se tabelas existem
- [ ] Verifique se há dados nas tabelas
- [ ] Verifique permissões do admin

### Erro de Autenticação
- [ ] Verifique se está logado como admin
- [ ] Verifique role do usuário na tabela users
- [ ] Verifique se token não expirou

---

## 🔑 Verificações Rápidas

### 1. Usuário é Admin?
```sql
SELECT id, email, role 
FROM users 
WHERE id = auth.uid();
-- Deve retornar role = 'admin'
```

### 2. Tabelas Existem?
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN ('users', 'wallets', 'transactions', 'support_tickets');
```

### 3. RLS está Configurado?
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('users', 'wallets', 'transactions');
```

---

## 💡 Solução Temporária

Se continuar com problema, adicione temporariamente:

```typescript
// No início do AdminDashboard.tsx
console.log('=== DEBUG ADMIN DASHBOARD ===')
console.log('Location:', window.location.href)
console.log('Theme:', document.documentElement.className)
console.log('Auth:', !!user)
```

Isso ajudará a identificar onde está travando.

---

## 📝 Logs para Compartilhar

Se o problema persistir, compartilhe:

1. **Console do navegador** (F12)
2. **Network tab** - requisições falhando
3. **Mensagem de erro** completa
4. **Screenshot** da tela preta

---

**Data:** 29 de Outubro de 2025  
**Arquivo Modificado:** `AdminDashboard.tsx`
