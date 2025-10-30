# 🎨 Sistema de Toast Moderno

## Características

✨ **Design Moderno**
- Gradientes suaves
- Bordas coloridas por tipo
- Backdrop blur
- Sombras profundas
- Animações suaves

🎯 **Tipos de Toast**
- ✅ Success (Verde)
- ❌ Error (Vermelho)
- ⚠️ Warning (Amarelo)
- ℹ️ Info (Azul)
- ⏳ Loading (com spinner)

## Como Usar

### Importar

```typescript
import { toast } from '@/lib/toast'
```

### Exemplos de Uso

#### 1. Toast de Sucesso
```typescript
toast.success('Operação concluída!')
toast.success('Gerente criado com sucesso!', 'O gerente foi adicionado ao sistema')
```

#### 2. Toast de Erro
```typescript
toast.error('Erro ao processar')
toast.error('Falha no login', 'Email ou senha incorretos')
```

#### 3. Toast de Aviso
```typescript
toast.warning('Atenção!')
toast.warning('Saldo insuficiente', 'Você precisa de mais R$ 50,00')
```

#### 4. Toast de Informação
```typescript
toast.info('Nova atualização disponível')
toast.info('Manutenção programada', 'Sistema ficará offline das 2h às 4h')
```

#### 5. Toast de Loading
```typescript
const loadingToast = toast.loading('Processando pagamento...')

// Depois de concluir, dismiss o loading
toast.dismiss(loadingToast)
toast.success('Pagamento aprovado!')
```

#### 6. Toast com Promise (Automático)
```typescript
toast.promise(
  fetchUserData(),
  {
    loading: 'Carregando dados...',
    success: 'Dados carregados com sucesso!',
    error: 'Erro ao carregar dados'
  }
)

// Com funções dinâmicas
toast.promise(
  createUser(data),
  {
    loading: 'Criando usuário...',
    success: (user) => `Usuário ${user.name} criado!`,
    error: (err) => `Erro: ${err.message}`
  }
)
```

#### 7. Toast Customizado
```typescript
toast.custom('Mensagem customizada', {
  duration: 5000,
  position: 'bottom-center',
})
```

## Configurações Globais

As configurações globais estão em `src/components/ui/toast.tsx`:

- **Posição:** `top-right`
- **Duração:** `4000ms` (4 segundos)
- **Botão de fechar:** Habilitado
- **Cores ricas:** Habilitado
- **Expansível:** Sim

## Personalização

### Mudar Posição
```typescript
// No componente Toaster
position="top-right" // top-left, top-center, bottom-left, bottom-center, bottom-right
```

### Mudar Duração
```typescript
// Global (no Toaster)
duration={4000}

// Individual
toast.success('Mensagem', { duration: 10000 })
```

### Adicionar Ação
```typescript
toast.success('Arquivo salvo!', {
  action: {
    label: 'Abrir',
    onClick: () => window.open('/files/document.pdf')
  }
})
```

## Exemplos Práticos no Sistema

### Criar Gerente
```typescript
const handleCreateManager = async () => {
  const loadingToast = toast.loading('Criando gerente...')
  
  try {
    await createManager(data)
    toast.dismiss(loadingToast)
    toast.success('Gerente criado com sucesso!', 'O gerente já pode acessar o sistema')
  } catch (error) {
    toast.dismiss(loadingToast)
    toast.error('Erro ao criar gerente', error.message)
  }
}
```

### Transferência PIX
```typescript
toast.promise(
  sendPix(amount, recipient),
  {
    loading: 'Processando transferência PIX...',
    success: (data) => `PIX de ${formatCurrency(data.amount)} enviado!`,
    error: 'Falha ao enviar PIX. Tente novamente.'
  }
)
```

### Atualizar Dados
```typescript
const handleUpdate = async () => {
  try {
    await updateUserData(data)
    toast.success('Dados atualizados!', 'Suas informações foram salvas')
  } catch (error) {
    toast.error('Erro ao atualizar', 'Tente novamente mais tarde')
  }
}
```

## Migração do Toast Antigo

Se você estava usando `toast` do `sonner` diretamente:

### Antes
```typescript
import { toast } from 'sonner'

toast.success('Sucesso!')
```

### Depois
```typescript
import { toast } from '@/lib/toast'

toast.success('Sucesso!') // Agora com ícones e estilos modernos!
```

## Cores e Estilos

- **Success:** Verde com gradiente `green-950/50`
- **Error:** Vermelho com gradiente `red-950/50`
- **Warning:** Amarelo com gradiente `yellow-950/50`
- **Info:** Azul com gradiente `blue-950/50`
- **Loading:** Amarelo primário com spinner animado

Todos os toasts têm:
- Fundo com gradiente escuro
- Borda colorida semi-transparente
- Sombra profunda
- Backdrop blur
- Bordas arredondadas (xl)
- Padding generoso
- Altura mínima de 70px
