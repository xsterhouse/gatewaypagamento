# 🪣 Criar Bucket no Supabase - Passo a Passo

## ⚠️ IMPORTANTE: Faça isso ANTES de executar o SQL

### 1️⃣ Criar o Bucket

1. Acesse seu projeto no **Supabase Dashboard**
   - URL: https://supabase.com/dashboard

2. No menu lateral, clique em **"Storage"**

3. Clique no botão **"Create a new bucket"** (ou "New bucket")

4. Preencha o formulário:
   ```
   Name: product-images
   Public bucket: ✅ SIM (MARQUE ESTA OPÇÃO!)
   File size limit: 5242880 (5MB em bytes)
   Allowed MIME types: image/*
   ```

5. Clique em **"Create bucket"**

6. ✅ O bucket `product-images` deve aparecer na lista

### 2️⃣ Verificar se foi criado

No SQL Editor, execute:

```sql
SELECT * FROM storage.buckets WHERE name = 'product-images';
```

**Resultado esperado:**
```
id | name            | public | ...
---|-----------------|--------|----
xxx| product-images  | true   | ...
```

Se retornar vazio, o bucket NÃO foi criado!

### 3️⃣ Agora SIM, executar o SQL

Depois de criar o bucket, execute:

```sql
-- Cole TODO o conteúdo de CONFIGURAR_STORAGE_CHECKOUT.sql
```

### 4️⃣ Verificar Políticas

```sql
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects';
```

Deve mostrar 5 políticas:
- Users can upload product images
- Users can view own product images
- Public can view product images
- Users can update own product images
- Users can delete own product images

---

## 🔧 Se o Bucket Já Existe

Se você já criou o bucket mas ainda dá erro:

### Verificar se é público:

```sql
UPDATE storage.buckets 
SET public = true 
WHERE name = 'product-images';
```

### Recriar políticas:

```sql
-- Deletar políticas antigas
DROP POLICY IF EXISTS "Users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own product images" ON storage.objects;

-- Depois execute o SQL completo novamente
```

---

## ❌ Erros Comuns

### Erro: "Bucket not found"

**Causa:** Bucket não foi criado

**Solução:**
1. Vá em Storage no dashboard
2. Crie o bucket manualmente
3. Nome exato: `product-images`
4. Marque como público

### Erro: "Permission denied"

**Causa:** Políticas não foram criadas ou estão erradas

**Solução:**
1. Execute o SQL de políticas
2. Verifique se as 5 políticas foram criadas
3. Teste novamente

### Erro: "Invalid bucket"

**Causa:** Nome do bucket está errado no código

**Solução:**
- O nome DEVE ser exatamente: `product-images`
- Sem espaços, sem maiúsculas

---

## 🧪 Testar Upload

Após criar bucket e políticas:

### Teste 1: Upload via Interface

1. Vá em Storage → product-images
2. Clique em "Upload file"
3. Selecione uma imagem
4. Se funcionar, o bucket está OK!

### Teste 2: Upload via Código

```javascript
// No console do navegador (F12)
const { data, error } = await supabase.storage
  .from('product-images')
  .upload('test/test.jpg', file)

console.log('Data:', data)
console.log('Error:', error)
```

Se `error` for null, está funcionando!

---

## ✅ Checklist Final

Antes de testar o upload no modal:

- [ ] Bucket `product-images` criado
- [ ] Bucket marcado como público
- [ ] SQL de políticas executado
- [ ] 5 políticas criadas
- [ ] Teste manual de upload funcionou
- [ ] Cache do navegador limpo (Ctrl+Shift+R)

---

## 🎯 Estrutura Final

```
Supabase Dashboard
└── Storage
    └── product-images (PUBLIC)
        └── (vazio por enquanto)
        
Após primeiro upload:
└── product-images
    └── {user-id}/
        └── imagem.jpg
```

---

**Dica:** Se continuar dando erro, compartilhe a mensagem de erro exata!
