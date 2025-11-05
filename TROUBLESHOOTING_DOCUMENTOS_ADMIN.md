# Troubleshooting: Admin não vê documentos KYC

## 🔍 Problema
Admin clica em "Ver Documentos" mas não aparece nenhum documento enviado pelo cliente.

## 🛠️ Soluções

### **Solução 1: Execute o SQL de correção**

1. Abra o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Execute o arquivo: `FIX_ADMIN_VIEW_DOCUMENTS.sql`
4. Verifique se todas as queries executaram com sucesso

### **Solução 2: Verifique se você é Admin**

```sql
-- Execute no SQL Editor
SELECT id, email, name, role 
FROM public.users 
WHERE email = 'seu_email@example.com';
```

Se `role` não for `'admin'`, execute:

```sql
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'seu_email@example.com';
```

### **Solução 3: Verifique se os documentos foram salvos**

```sql
-- Ver todos os documentos
SELECT * FROM public.kyc_documents;

-- Ver documentos de um usuário específico
SELECT 
  kd.*,
  u.name as user_name,
  u.email as user_email
FROM public.kyc_documents kd
JOIN public.users u ON u.id = kd.user_id
ORDER BY kd.uploaded_at DESC;
```

### **Solução 4: Teste no Console do Navegador**

1. Abra o painel admin (`/kyc`)
2. Abra o Console (F12)
3. Clique em "Ver Documentos" de um usuário
4. Veja os logs:
   - `Loading documents for user: [ID]`
   - `Documents loaded: [array]`
   - `Number of documents: [número]`

Se aparecer **0 documentos**, o problema é no banco de dados.
Se aparecer **erro de permissão**, o problema é RLS.

### **Solução 5: Verifique as Políticas RLS**

```sql
-- Ver políticas da tabela kyc_documents
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'kyc_documents';
```

Deve ter pelo menos estas políticas:
- ✅ `users_view_own_kyc_documents`
- ✅ `users_insert_own_kyc_documents`
- ✅ `admins_view_all_kyc_documents` ⭐ (IMPORTANTE)

### **Solução 6: Verifique o Storage**

```sql
-- Ver configuração do bucket
SELECT * FROM storage.buckets WHERE id = 'kyc-documents';

-- Ver políticas do storage
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%KYC%';
```

Deve ter:
- ✅ `Users can upload own KYC documents`
- ✅ `Users can view own KYC documents`
- ✅ `Admins can view all KYC documents` ⭐ (IMPORTANTE)

## 🎯 Checklist Rápido

- [ ] Executei `FIX_ADMIN_VIEW_DOCUMENTS.sql`
- [ ] Sou admin (role = 'admin')
- [ ] Políticas RLS criadas
- [ ] Política de admin existe (`admins_view_all_kyc_documents`)
- [ ] Bucket `kyc-documents` existe
- [ ] Documentos existem na tabela `kyc_documents`
- [ ] Console não mostra erros

## 🚨 Erros Comuns

### Erro: "Nenhum documento enviado"
**Causa**: Documentos não foram salvos no banco
**Solução**: Verifique se o upload funcionou no cadastro

### Erro: "Error loading documents: permission denied"
**Causa**: Admin não tem permissão RLS
**Solução**: Execute `FIX_ADMIN_VIEW_DOCUMENTS.sql`

### Erro: "Failed to load resource: 403"
**Causa**: Storage não permite admin ver arquivos
**Solução**: Verifique políticas de storage

### Erro: "User is not admin"
**Causa**: Usuário logado não é admin
**Solução**: Atualize role para 'admin'

## 📊 Query de Diagnóstico Completo

```sql
-- Execute tudo de uma vez para diagnóstico
DO $$
BEGIN
  RAISE NOTICE '=== DIAGNÓSTICO COMPLETO ===';
  
  -- 1. Verificar usuário atual
  RAISE NOTICE 'Seu ID: %', auth.uid();
  
  -- 2. Verificar se é admin
  RAISE NOTICE 'É admin: %', (
    SELECT role = 'admin' 
    FROM public.users 
    WHERE id = auth.uid()
  );
  
  -- 3. Total de documentos
  RAISE NOTICE 'Total de documentos: %', (
    SELECT COUNT(*) FROM public.kyc_documents
  );
  
  -- 4. Políticas RLS
  RAISE NOTICE 'Políticas kyc_documents: %', (
    SELECT COUNT(*) 
    FROM pg_policies 
    WHERE tablename = 'kyc_documents'
  );
  
  -- 5. Bucket existe
  RAISE NOTICE 'Bucket existe: %', (
    SELECT EXISTS(
      SELECT 1 FROM storage.buckets 
      WHERE id = 'kyc-documents'
    )
  );
END $$;

-- Ver resultados detalhados
SELECT 'Diagnóstico concluído! Veja os NOTICE acima.' as resultado;
```

## ✅ Após Corrigir

1. **Faça logout** do painel admin
2. **Faça login** novamente
3. **Vá em KYC Management** (`/kyc`)
4. **Clique em "Ver Documentos"**
5. **Documentos devem aparecer!** 🎉

## 📞 Ainda não funciona?

Compartilhe:
1. Logs do console do navegador
2. Resultado da query de diagnóstico
3. Screenshot do erro
