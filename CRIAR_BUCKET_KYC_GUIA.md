# Guia: Criar Bucket KYC Documents no Supabase

## Problema

Erro ao fazer upload de documentos:
```
Bucket de documentos não encontrado. Contate o administrador.
```

## Solução

O bucket `kyc-documents` precisa ser criado no Supabase Storage.

## Passo a Passo

### Opção 1: Via Interface do Supabase (Recomendado)

1. **Acesse o Supabase Dashboard**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto

2. **Vá para Storage**
   - No menu lateral, clique em **Storage**

3. **Criar Novo Bucket**
   - Clique em **"New bucket"** ou **"Create a new bucket"**
   - Preencha os dados:
     - **Name:** `kyc-documents`
     - **Public bucket:** ✅ Marcar (para permitir visualização)
     - **File size limit:** `5 MB`
     - **Allowed MIME types:** 
       - `image/jpeg`
       - `image/jpg`
       - `image/png`
       - `image/webp`
       - `application/pdf`
   - Clique em **"Create bucket"**

4. **Configurar Políticas RLS**
   - Vá para **Storage** → **Policies**
   - Selecione o bucket `kyc-documents`
   - Clique em **"New Policy"**
   - Selecione **"For full customization"**
   - Cole o SQL do arquivo `CREATE_KYC_BUCKET.sql` (apenas as políticas)

### Opção 2: Via SQL Editor (Mais Rápido)

1. **Acesse o SQL Editor**
   - No Supabase Dashboard, vá para **SQL Editor**

2. **Execute o Script**
   - Copie todo o conteúdo do arquivo `CREATE_KYC_BUCKET.sql`
   - Cole no SQL Editor
   - Clique em **"Run"**

3. **Verificar Criação**
   - Vá para **Storage** no menu lateral
   - Verifique se o bucket `kyc-documents` aparece na lista

## Verificação

Após criar o bucket, execute este SQL para verificar:

```sql
-- Verificar bucket
SELECT * FROM storage.buckets WHERE id = 'kyc-documents';

-- Verificar políticas
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%KYC%';
```

Deve retornar:
- 1 bucket com id `kyc-documents`
- 5 políticas RLS

## Estrutura de Pastas

O bucket organiza documentos por usuário:

```
kyc-documents/
├── {user_id_1}/
│   ├── identity_document_1234567890.jpg
│   ├── address_proof_1234567891.pdf
│   ├── selfie_1234567892.jpg
│   └── selfie_with_document_1234567893.jpg
├── {user_id_2}/
│   └── ...
```

## Políticas de Segurança

✅ **Usuários podem:**
- Fazer upload de seus próprios documentos
- Ver seus próprios documentos
- Atualizar seus próprios documentos
- Deletar seus próprios documentos

✅ **Admins podem:**
- Ver todos os documentos de todos os usuários

❌ **Usuários NÃO podem:**
- Ver documentos de outros usuários
- Fazer upload em pastas de outros usuários

## Testar Upload

Após criar o bucket:

1. Acesse: https://app.dimpay.com.br/register
2. Preencha os dados
3. Faça upload dos 4 documentos
4. Clique em "Continuar"
5. ✅ Upload deve funcionar sem erros

## Troubleshooting

### Erro: "Bucket already exists"
- O bucket já foi criado
- Apenas execute as políticas RLS

### Erro: "Permission denied"
- Verifique se você está logado como admin no Supabase
- Use a service_role_key se necessário

### Erro: "File too large"
- Aumente o limite de tamanho do bucket
- Ou reduza o tamanho da imagem antes do upload

## Comandos Úteis

```sql
-- Listar todos os buckets
SELECT * FROM storage.buckets;

-- Listar arquivos no bucket
SELECT * FROM storage.objects WHERE bucket_id = 'kyc-documents';

-- Deletar bucket (CUIDADO!)
DELETE FROM storage.buckets WHERE id = 'kyc-documents';

-- Deletar todas as políticas do bucket
DROP POLICY IF EXISTS "Users can upload their own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own KYC documents" ON storage.objects;
```

## Próximos Passos

Após criar o bucket:
1. ✅ Testar upload de documentos
2. ✅ Verificar se admin consegue ver documentos
3. ✅ Verificar se usuário não vê documentos de outros
4. ✅ Testar aprovação/rejeição de KYC
