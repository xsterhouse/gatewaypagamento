# 🛒 Como Instalar o Novo Sistema de Checkout

## 📋 Passo a Passo

### 1. Executar SQL no Supabase

```sql
-- Execute o arquivo:
CRIAR_SISTEMA_CHECKOUT.sql
```

No **Supabase SQL Editor**, copie e cole todo o conteúdo do arquivo e execute.

### 2. Substituir Página Checkout

**Arquivo:** `src/pages/Checkout.tsx`

Abra o arquivo `CHECKOUT_NOVO_CODIGO.txt` e:
1. Copie TODO o conteúdo
2. Cole substituindo TODO o conteúdo de `src/pages/Checkout.tsx`
3. Salve o arquivo

### 3. Criar Modal de Criar Link

Crie o arquivo: `src/components/CreatePaymentLinkModal.tsx`

Copie o código do arquivo `CREATE_PAYMENT_LINK_MODAL.txt` (será criado a seguir)

### 4. Criar Página Pública de Pagamento

Crie o arquivo: `src/pages/PaymentPage.tsx`

Copie o código do arquivo `PAYMENT_PAGE.txt` (será criado a seguir)

### 5. Adicionar Rota

No arquivo `src/App.tsx`, adicione:

```tsx
import { PaymentPage } from './pages/PaymentPage'

// Dentro de <Routes>:
<Route path="/pay/:slug" element={<PaymentPage />} />
```

## ✅ Verificar Instalação

1. Acesse `/checkout` no painel do cliente
2. Deve aparecer a nova interface moderna
3. Clique em "Criar Link"
4. Preencha os dados e crie
5. Copie o link e teste em uma aba anônima

## 🎯 Funcionalidades

- ✅ Criar links de pagamento
- ✅ Preço fixo ou variável
- ✅ Permitir quantidade
- ✅ Estatísticas em tempo real
- ✅ Ativar/Desativar links
- ✅ Copiar link facilmente
- ✅ Visualizar página pública
- ✅ Editar links
- ✅ Excluir links

## 📞 Suporte

Se tiver problemas, verifique:
1. SQL foi executado corretamente
2. Todos os arquivos foram criados
3. Imports estão corretos
4. Não há erros no console (F12)
