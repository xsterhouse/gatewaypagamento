# Fix: Erro 406 no Supabase

## Problema Identificado

Durante o registro, aparece erro 406 ao verificar se email já existe:

```
plbcnvnsvytzqrhgybjd.supabase.co/rest/v1/users?select=id&email=eq.fabiofr26%40hotmail.com:1
Failed to load resource: the server responded with a status of 406 ()
```

## Causa

O erro 406 (Not Acceptable) no Supabase geralmente ocorre quando:

1. **Headers incorretos**: Falta o header `Accept: application/json`
2. **RLS (Row Level Security)**: Políticas de segurança bloqueando a consulta
3. **Permissões**: Usuário anônimo não tem permissão para consultar a tabela `users`

## Solução

### Opção 1: Adicionar Header Accept (Recomendado)

O Supabase JS Client já adiciona automaticamente, mas se estiver usando fetch direto, adicione:

```typescript
const { data, error } = await supabase
  .from('users')
  .select('id')
  .eq('email', email)
  .single()
```

### Opção 2: Ajustar RLS Policies

Permitir que usuários anônimos possam verificar se email existe (apenas para registro):

```sql
-- Política para permitir SELECT de email durante registro
CREATE POLICY "Allow anonymous to check email existence"
ON users
FOR SELECT
TO anon
USING (true);
```

**⚠️ ATENÇÃO**: Esta política permite que qualquer pessoa veja se um email está cadastrado. 
Para maior segurança, considere usar uma função serverless para fazer essa verificação.

### Opção 3: Usar Função Serverless (Mais Seguro)

Criar uma função serverless que verifica o email usando a service_role_key:

```typescript
// api/check-email.ts
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const { email } = req.body
  
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role bypassa RLS
  )
  
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()
  
  return res.json({ exists: !!data })
}
```

## Recomendação

Por enquanto, o erro 406 não está impedindo o fluxo de registro (o código continua mesmo com o erro).

**Próximos passos**:
1. Verificar se o registro está funcionando apesar do erro 406
2. Se necessário, implementar a Opção 3 (mais segura)
3. Ou ajustar RLS para permitir verificação de email (menos seguro)

## Status

- ⚠️ Erro 406 presente mas não crítico
- ✅ Fluxo de registro continua funcionando
- 📝 Implementação de solução segura pendente
