# 🔒 Políticas RLS da Tabela MED

## Visão Geral
As políticas RLS (Row Level Security) garantem que apenas usuários autorizados possam acessar e modificar as solicitações MED.

## 🛡️ Políticas Implementadas

### 1. SELECT (Visualizar)

#### `med_requests_select_own`
- **Quem:** Clientes autenticados
- **O que:** Ver APENAS suas próprias solicitações
- **Regra:** `user_id = auth.uid()`

#### `med_requests_select_admin`
- **Quem:** Admins e Managers
- **O que:** Ver TODAS as solicitações
- **Regra:** Verifica se o usuário tem role 'admin' ou 'manager'

### 2. INSERT (Criar)

#### `med_requests_insert_own`
- **Quem:** Clientes, Admins e Managers autenticados
- **O que:** Criar solicitações para si mesmos
- **Regras:**
  - O `user_id` deve ser igual ao `auth.uid()`
  - O usuário deve existir na tabela `users`
  - O usuário deve ter role 'client', 'admin' ou 'manager'

### 3. UPDATE (Atualizar)

#### `med_requests_update_admin`
- **Quem:** APENAS Admins e Managers
- **O que:** Atualizar qualquer solicitação (aprovar, rejeitar, adicionar notas)
- **Regra:** Verifica se o usuário tem role 'admin' ou 'manager'

### 4. DELETE (Deletar)

#### `med_requests_delete_admin`
- **Quem:** APENAS Admins
- **O que:** Deletar solicitações (segurança extra)
- **Regra:** Verifica se o usuário tem role 'admin' (managers NÃO podem deletar)

## 🔐 Níveis de Segurança

### Cliente (role: 'client')
✅ Pode criar solicitações para si mesmo
✅ Pode ver apenas suas próprias solicitações
❌ NÃO pode ver solicitações de outros
❌ NÃO pode atualizar solicitações
❌ NÃO pode deletar solicitações

### Manager (role: 'manager')
✅ Pode criar solicitações
✅ Pode ver TODAS as solicitações
✅ Pode atualizar (aprovar/rejeitar) solicitações
❌ NÃO pode deletar solicitações

### Admin (role: 'admin')
✅ Pode criar solicitações
✅ Pode ver TODAS as solicitações
✅ Pode atualizar (aprovar/rejeitar) solicitações
✅ Pode deletar solicitações

## 🚀 Como Aplicar

### Opção 1: Tabela Nova
Execute: `SQL_RECRIAR_TABELA_MED.sql`
- Cria a tabela com todas as políticas corretas

### Opção 2: Tabela Existente
Execute: `SQL_FIX_POLICIES_MED.sql`
- Remove políticas antigas
- Aplica novas políticas seguras
- Mantém os dados existentes

## 🔍 Diagnóstico

Para verificar se as políticas estão funcionando:

```sql
-- Ver todas as políticas ativas
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'med_requests';

-- Testar autenticação
SELECT 
  auth.uid() as meu_user_id,
  auth.role() as minha_role;

-- Ver meu usuário
SELECT id, email, role, name
FROM users
WHERE id = auth.uid();
```

## ⚠️ Troubleshooting

### Erro: "permission denied"
**Causa:** Políticas RLS bloqueando a operação
**Solução:** Execute `SQL_FIX_POLICIES_MED.sql`

### Erro: "auth.uid() returns NULL"
**Causa:** Usuário não está autenticado no Supabase
**Solução:** 
1. Faça logout e login novamente
2. Verifique se o token JWT está válido
3. Verifique as configurações do Supabase Auth

### Erro: "violates foreign key constraint"
**Causa:** O `user_id` não existe na tabela `users`
**Solução:**
1. Verifique se o usuário está cadastrado
2. Verifique se o `effectiveUserId` está correto

## 📝 Notas de Segurança

1. **RLS sempre habilitado:** Nunca desabilite RLS em produção
2. **Políticas separadas:** Cada operação (SELECT, INSERT, UPDATE, DELETE) tem sua própria política
3. **Verificação dupla:** Políticas verificam tanto o `auth.uid()` quanto a role do usuário
4. **Princípio do menor privilégio:** Usuários só têm acesso ao mínimo necessário
5. **Auditoria:** Todas as operações são rastreáveis pelo `auth.uid()`

## 🔄 Manutenção

Para adicionar novas regras:
1. Sempre use `DROP POLICY IF EXISTS` antes de criar
2. Use nomes descritivos: `tabela_operacao_quem`
3. Documente a regra com comentários
4. Teste com diferentes roles antes de aplicar em produção
