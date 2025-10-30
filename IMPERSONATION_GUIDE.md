# 🎭 Guia de Funcionalidade: Impersonation (Visualizar como Cliente)

## 📋 Visão Geral

A funcionalidade de **Impersonation** permite que administradores visualizem e naveguem pelo painel como se fossem um cliente específico, sem precisar sair de sua conta de administrador.

## ✨ Funcionalidades Implementadas

### 1. **Logar como Cliente**
- No Painel Administrativo (`/admin`), cada cliente possui um botão **"Logar como Cliente"**
- Ao clicar, o admin é redirecionado para o dashboard do cliente
- O admin vê **exatamente** o que o cliente vê, incluindo:
  - ✅ Menu de navegação do cliente
  - ✅ Dados do cliente (saldo, transações, etc.)
  - ✅ Status KYC do cliente
  - ✅ Todas as páginas com os dados do cliente

### 2. **Banner de Identificação**
- Um banner laranja aparece no topo da tela quando o admin está impersonando
- Mostra claramente:
  - "Modo Administrador"
  - Nome do cliente sendo visualizado
  - Botão "Voltar ao Painel Admin"

### 3. **Retornar ao Painel Admin**
- Ao clicar em "Voltar ao Painel Admin" no banner:
  - O modo impersonation é desativado
  - O admin retorna ao painel administrativo
  - Todas as visualizações voltam ao normal

## 🔧 Como Usar

### Para Administradores:

1. **Acessar o Painel Admin**
   ```
   Navegue para: /admin
   ```

2. **Encontrar o Cliente**
   - Use a busca para encontrar o cliente por nome ou email
   - Ou role a lista de clientes

3. **Iniciar Impersonation**
   - Clique no botão azul **"Logar como Cliente"** ao lado do nome do cliente
   - Aguarde o redirecionamento automático

4. **Navegar como Cliente**
   - Você verá o menu de cliente (não o menu admin)
   - Todos os dados mostrados são do cliente
   - Pode navegar por todas as páginas normalmente

5. **Retornar ao Painel Admin**
   - Clique em **"Voltar ao Painel Admin"** no banner laranja no topo
   - Ou navegue diretamente para `/admin/dashboard`

## 🏗️ Arquitetura Técnica

### Componentes Principais:

1. **`ImpersonationContext.tsx`**
   - Gerencia o estado de impersonation
   - Funções: `impersonateUser()`, `stopImpersonation()`
   - Armazena dados no localStorage

2. **`AuthContext.tsx`**
   - Integrado com ImpersonationContext
   - Retorna `effectiveUserId` (ID do cliente se impersonando, ou ID do admin)
   - Fornece `userData` do usuário efetivo
   - Flag `isImpersonating`

3. **`ImpersonationBanner.tsx`**
   - Banner visual no topo da página
   - Mostra nome do cliente
   - Botão para sair do modo impersonation

4. **`Sidebar.tsx`**
   - Detecta modo impersonation
   - Mostra menu de cliente quando impersonando
   - Mostra dados do cliente impersonado

5. **`Layout.tsx`**
   - Verifica KYC do cliente impersonado
   - Aplica overlays conforme status do cliente

### Fluxo de Dados:

```
Admin clica "Logar como Cliente"
    ↓
ImpersonationContext.impersonateUser(userId)
    ↓
Salva no localStorage: { originalAdminId, impersonatedUserId }
    ↓
AuthContext detecta impersonation
    ↓
effectiveUserId = impersonatedUserId
    ↓
Todos os componentes usam effectiveUserId
    ↓
Dashboard, Sidebar, Header mostram dados do cliente
```

## 🔒 Segurança

- ✅ Apenas admins podem usar impersonation
- ✅ Verificação de role no backend
- ✅ Dados sensíveis do admin preservados
- ✅ Impossível impersonar outro admin
- ✅ Sessão do admin permanece ativa

## 📝 Páginas Afetadas

Todas as páginas agora consideram o `effectiveUserId`:

- ✅ Dashboard (`/`)
- ✅ Carteiras (`/wallets`)
- ✅ Exchange (`/exchange`)
- ✅ Depósitos (`/deposits`)
- ✅ Financeiro (`/financeiro`)
- ✅ Relatórios (`/relatorios`)
- ✅ Extrato (`/extrato`)
- ✅ Configurações (`/configuracoes`)

## 🐛 Troubleshooting

### Problema: Banner não aparece
- **Solução**: Verifique se `ImpersonationBanner` está no `Layout.tsx`

### Problema: Dados não mudam ao impersonar
- **Solução**: Certifique-se de usar `effectiveUserId` do `AuthContext` nas queries

### Problema: Não consigo voltar ao painel admin
- **Solução**: 
  - Limpe o localStorage: `localStorage.removeItem('impersonation')`
  - Navegue para `/admin/dashboard`

### Problema: Menu admin aparece ao impersonar
- **Solução**: Verifique se `Sidebar` está usando `isImpersonating` do contexto

## 📊 Logs e Auditoria

Considere adicionar logs para:
- Quando admin inicia impersonation
- Quando admin para impersonation
- Ações realizadas durante impersonation
- Tempo de duração da sessão de impersonation

## 🚀 Melhorias Futuras

- [ ] Log de auditoria no banco de dados
- [ ] Limite de tempo para impersonation
- [ ] Notificação ao cliente (opcional)
- [ ] Histórico de impersonations
- [ ] Restrição por níveis de admin
- [ ] Modo "visualização apenas" (sem edições)

## 📞 Suporte

Para dúvidas ou problemas, consulte:
- Documentação do Supabase Auth
- Código-fonte dos contextos
- Logs do navegador (F12 > Console)
