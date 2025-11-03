# 🔐 Guia de Instalação - Sistema KYC Completo

## 📋 Arquivos Criados:

1. ✅ `SQL_ADICIONAR_BLOQUEIO.sql` - SQL para adicionar colunas de bloqueio
2. ✅ `AccountBlocked.tsx` - Página de conta bloqueada (efeito glasgow)
3. ✅ `VIEW_CLIENT_MODAL_CODE.txt` - Código do modal de visualização

## 🚀 Passo a Passo de Instalação:

### 1. Executar SQL no Supabase

```sql
-- Execute TODO o conteúdo de: SQL_ADICIONAR_BLOQUEIO.sql
```

Isso vai adicionar as colunas:
- `is_blocked` (BOOLEAN)
- `blocked_reason` (TEXT)
- `blocked_at` (TIMESTAMP)
- `blocked_by` (UUID)

### 2. Criar ViewClientModal.tsx

1. Crie o arquivo: `src/components/ViewClientModal.tsx`
2. Copie TODO o conteúdo de: `VIEW_CLIENT_MODAL_CODE.txt`
3. Cole no arquivo criado
4. Salve

### 3. Adicionar Rota da Página de Bloqueio

Edite `src/App.tsx` e adicione:

```typescript
import { AccountBlocked } from './pages/AccountBlocked'

// Nas rotas, adicione:
<Route path="/account-blocked" element={<AccountBlocked />} />
```

### 4. Atualizar ProtectedRoute

Edite `src/components/ProtectedRoute.tsx` e adicione verificação de bloqueio:

```typescript
// Após verificar autenticação, adicione:
const { data: userData } = await supabase
  .from('users')
  .select('is_blocked')
  .eq('id', session.user.id)
  .single()

if (userData?.is_blocked) {
  return <Navigate to="/account-blocked" replace />
}
```

### 5. Modernizar KYCManagement.tsx

O arquivo completo está muito grande. Vou criar as principais funções que você precisa adicionar:

#### Adicionar Estados:

```typescript
const [selectedClient, setSelectedClient] = useState(null)
const [viewModalOpen, setViewModalOpen] = useState(false)
const [blockModalOpen, setBlockModalOpen] = useState(false)
const [blockReason, setBlockReason] = useState('')
```

#### Adicionar Funções:

```typescript
// Visualizar Cliente
const handleViewClient = (client) => {
  setSelectedClient(client)
  setViewModalOpen(true)
}

// Bloquear/Desbloquear
const handleToggleBlock = async (userId, currentlyBlocked) => {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        is_blocked: !currentlyBlocked,
        blocked_at: !currentlyBlocked ? new Date().toISOString() : null,
        blocked_reason: !currentlyBlocked ? blockReason : null,
        blocked_by: !currentlyBlocked ? effectiveUserId : null
      })
      .eq('id', userId)
    
    if (error) throw error
    
    toast.success(currentlyBlocked ? 'Cliente desbloqueado!' : 'Cliente bloqueado!')
    loadUsers()
    setBlockModalOpen(false)
    setBlockReason('')
  } catch (error) {
    toast.error('Erro ao bloquear/desbloquear cliente')
  }
}

// Excluir Cliente
const handleDeleteClient = async (userId) => {
  if (!confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita!')) {
    return
  }
  
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)
    
    if (error) throw error
    
    toast.success('Cliente excluído com sucesso!')
    loadUsers()
  } catch (error) {
    toast.error('Erro ao excluir cliente')
  }
}
```

#### Adicionar Botões nos Cards:

```typescript
<div className="flex gap-2">
  <Button 
    size="sm" 
    variant="outline"
    onClick={() => handleViewClient(user)}
  >
    <Eye className="w-4 h-4 mr-1" />
    Visualizar
  </Button>
  
  <Button 
    size="sm" 
    variant={user.is_blocked ? "default" : "destructive"}
    onClick={() => {
      setSelectedClient(user)
      setBlockModalOpen(true)
    }}
  >
    {user.is_blocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
  </Button>
  
  <Button 
    size="sm" 
    variant="destructive"
    onClick={() => handleDeleteClient(user.id)}
  >
    <Trash className="w-4 h-4" />
  </Button>
</div>
```

#### Adicionar Modais:

```typescript
{/* Modal de Visualização */}
<ViewClientModal 
  open={viewModalOpen}
  onClose={() => setViewModalOpen(false)}
  client={selectedClient}
/>

{/* Modal de Bloqueio */}
<Dialog open={blockModalOpen} onOpenChange={setBlockModalOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>
        {selectedClient?.is_blocked ? 'Desbloquear' : 'Bloquear'} Cliente
      </DialogTitle>
    </DialogHeader>
    
    {!selectedClient?.is_blocked && (
      <div className="space-y-4">
        <Label>Motivo do Bloqueio *</Label>
        <textarea
          value={blockReason}
          onChange={(e) => setBlockReason(e.target.value)}
          placeholder="Descreva o motivo do bloqueio..."
          rows={4}
          className="w-full p-2 border rounded"
        />
      </div>
    )}
    
    <div className="flex justify-end gap-2">
      <Button variant="outline" onClick={() => setBlockModalOpen(false)}>
        Cancelar
      </Button>
      <Button 
        variant={selectedClient?.is_blocked ? "default" : "destructive"}
        onClick={() => handleToggleBlock(selectedClient?.id, selectedClient?.is_blocked)}
      >
        {selectedClient?.is_blocked ? 'Desbloquear' : 'Bloquear'}
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

## ✅ Checklist de Instalação:

- [ ] Executar `SQL_ADICIONAR_BLOQUEIO.sql` no Supabase
- [ ] Criar `ViewClientModal.tsx` com o código do TXT
- [ ] Adicionar rota `/account-blocked` no App.tsx
- [ ] Atualizar `ProtectedRoute.tsx` para verificar bloqueio
- [ ] Adicionar funções e botões no `KYCManagement.tsx`
- [ ] Importar ícones: `Eye`, `Lock`, `Unlock`, `Trash`
- [ ] Testar bloqueio de cliente
- [ ] Testar visualização de cliente
- [ ] Testar exclusão de cliente

## 🧪 Testar:

1. Vá em `/kyc`
2. Clique em "Visualizar" em um cliente
3. Veja todos os dados e documentos
4. Clique em "Bloquear"
5. Informe o motivo
6. Cliente não consegue mais acessar
7. Vê a página de bloqueio

## 📞 Suporte:

Se tiver dúvidas, me avise que eu ajudo a implementar!
