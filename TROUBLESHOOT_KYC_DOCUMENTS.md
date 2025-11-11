# Troubleshooting: Documentos KYC Não Aparecem

## Problema

Documentos enviados durante o registro não aparecem nas abas "Visualizar" e "Documentos" do painel admin.

## Possíveis Causas

### 1. Tabela `kyc_documents` Não Existe

**Verificar:**
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'kyc_documents'
);
```

**Solução:** Execute `CRIAR_SISTEMA_KYC_COMPLETO.sql`

### 2. Políticas RLS Bloqueando Admin

**Verificar:**
```sql
-- Ver políticas atuais
SELECT * FROM pg_policies WHERE tablename = 'kyc_documents';

-- Verificar se você é admin
SELECT id, email, role FROM public.users WHERE id = auth.uid();
```

**Problema Comum:** Política verifica apenas `role = 'admin'` mas seu role é `'master'`

**Solução:** Execute `FIX_KYC_DOCUMENTS_RLS.sql`

### 3. Documentos Não Foram Salvos no Banco

**Verificar:**
```sql
-- Ver todos os documentos
SELECT 
  kd.id,
  kd.user_id,
  u.name,
  u.email,
  kd.document_type,
  kd.file_name,
  kd.uploaded_at
FROM public.kyc_documents kd
LEFT JOIN public.users u ON u.id = kd.user_id
ORDER BY kd.uploaded_at DESC
LIMIT 20;
```

**Se retornar vazio:** Documentos não foram salvos durante o registro

**Causas:**
- Erro no upload (verificar console do navegador)
- Bucket não existe
- Permissões incorretas

### 4. Bucket `kyc-documents` Não Existe

**Verificar:**
```sql
SELECT * FROM storage.buckets WHERE id = 'kyc-documents';
```

**Solução:** Execute `CREATE_KYC_BUCKET.sql`

### 5. Frontend Não Está Buscando Corretamente

**Verificar no código:**

`src/pages/KYCManagement.tsx`:
```typescript
const { data, error } = await supabase
  .from('kyc_documents')
  .select('*')
  .eq('user_id', userId)
  .order('uploaded_at', { ascending: false })
```

**Verificar no console do navegador:**
- Abrir DevTools (F12)
- Ir para aba "Network"
- Filtrar por "kyc_documents"
- Ver se a requisição retorna dados

## Solução Passo a Passo

### Passo 1: Verificar Tabela

No Supabase SQL Editor:
```sql
SELECT * FROM information_schema.tables 
WHERE table_name = 'kyc_documents';
```

Se não existir, execute `CRIAR_SISTEMA_KYC_COMPLETO.sql`

### Passo 2: Verificar Políticas RLS

```sql
SELECT * FROM pg_policies WHERE tablename = 'kyc_documents';
```

Execute `FIX_KYC_DOCUMENTS_RLS.sql` para corrigir

### Passo 3: Verificar Documentos Existentes

```sql
SELECT COUNT(*) FROM public.kyc_documents;
```

Se retornar 0, nenhum documento foi salvo ainda.

### Passo 4: Testar Upload

1. Faça logout
2. Registre nova conta de teste
3. Envie os 4 documentos
4. Verifique no SQL:
```sql
SELECT * FROM public.kyc_documents 
ORDER BY uploaded_at DESC 
LIMIT 10;
```

### Passo 5: Verificar Permissões de Admin

```sql
-- Ver seu role
SELECT id, email, role FROM public.users WHERE id = auth.uid();

-- Testar se consegue ver documentos
SELECT * FROM public.kyc_documents LIMIT 5;
```

Se der erro de permissão, execute `FIX_KYC_DOCUMENTS_RLS.sql`

## Comandos Úteis

### Ver Todos os Documentos (Como Admin)

```sql
SELECT 
  u.name as usuario,
  u.email,
  u.kyc_status,
  kd.document_type as tipo_documento,
  kd.file_name as arquivo,
  kd.uploaded_at as enviado_em
FROM public.kyc_documents kd
JOIN public.users u ON u.id = kd.user_id
ORDER BY kd.uploaded_at DESC;
```

### Contar Documentos por Usuário

```sql
SELECT 
  u.name,
  u.email,
  COUNT(kd.id) as total_docs
FROM public.users u
LEFT JOIN public.kyc_documents kd ON kd.user_id = u.id
WHERE u.role = 'user'
GROUP BY u.id, u.name, u.email
HAVING COUNT(kd.id) > 0
ORDER BY total_docs DESC;
```

### Deletar Documentos de Teste

```sql
-- CUIDADO! Isso deleta TODOS os documentos
DELETE FROM public.kyc_documents 
WHERE user_id IN (
  SELECT id FROM public.users 
  WHERE email LIKE '%teste%' OR email LIKE '%test%'
);
```

## Checklist de Verificação

- [ ] Tabela `kyc_documents` existe
- [ ] Bucket `kyc-documents` existe
- [ ] Políticas RLS incluem `'master'` além de `'admin'`
- [ ] Documentos aparecem no SQL: `SELECT * FROM kyc_documents`
- [ ] Admin consegue executar: `SELECT * FROM kyc_documents`
- [ ] Console do navegador não mostra erros
- [ ] Network tab mostra requisição retornando dados

## Próximos Passos

1. Execute `FIX_KYC_DOCUMENTS_RLS.sql` no Supabase
2. Faça logout e login novamente
3. Acesse a página de KYC Management
4. Clique em um usuário com documentos
5. Verifique se os documentos aparecem

Se ainda não funcionar, verifique o console do navegador para erros específicos.
