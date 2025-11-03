# 📸 Como Configurar Upload de Imagens no Checkout

## 🎯 O que foi implementado:

✅ Upload de imagens para produtos no checkout
✅ Preview da imagem antes de salvar
✅ Validação de tipo e tamanho (máx 5MB)
✅ Armazenamento no Supabase Storage
✅ Políticas RLS configuradas

---

## 📋 Passo a Passo de Instalação

### 1. Criar Bucket no Supabase

1. Acesse seu projeto no **Supabase Dashboard**
2. Vá em **Storage** no menu lateral
3. Clique em **"Create a new bucket"**
4. Configure:
   - **Name**: `product-images`
   - **Public bucket**: ✅ Sim (marque esta opção)
   - **File size limit**: 5MB
   - **Allowed MIME types**: `image/*`

5. Clique em **"Create bucket"**

### 2. Executar SQL de Políticas

1. Vá em **SQL Editor** no Supabase
2. Copie TODO o conteúdo do arquivo:
   ```
   CONFIGURAR_STORAGE_CHECKOUT.sql
   ```
3. Cole no editor e clique em **"Run"**
4. Aguarde a confirmação de sucesso

### 3. Verificar Instalação

Execute no SQL Editor:

```sql
-- Verificar se o bucket existe
SELECT * FROM storage.buckets WHERE name = 'product-images';

-- Verificar políticas
SELECT * FROM pg_policies WHERE tablename = 'objects';
```

---

## 🎨 Como Usar

### Para o Cliente:

1. Acesse **Checkout** no menu
2. Clique em **"Criar Link"**
3. Preencha o título e descrição
4. Na seção **"Imagem do Produto"**:
   - Clique na área tracejada
   - Selecione uma imagem (PNG, JPG, GIF)
   - Veja o preview instantâneo
   - Para remover, clique no **X** vermelho

5. Continue preenchendo preço e outras configurações
6. Clique em **"Criar Link"**
7. A imagem será enviada automaticamente!

### Validações Automáticas:

- ✅ Apenas imagens são aceitas
- ✅ Tamanho máximo: 5MB
- ✅ Formatos: PNG, JPG, JPEG, GIF, WebP
- ❌ Arquivos muito grandes são rejeitados
- ❌ Tipos não suportados são bloqueados

---

## 📁 Estrutura de Armazenamento

As imagens são organizadas por usuário:

```
product-images/
├── {user_id_1}/
│   ├── 1699123456789-abc123.jpg
│   ├── 1699123457890-def456.png
│   └── ...
├── {user_id_2}/
│   ├── 1699123458901-ghi789.jpg
│   └── ...
```

**Exemplo real:**
```
product-images/
└── 123e4567-e89b-12d3-a456-426614174000/
    └── 1699123456789-abc123.jpg
```

---

## 🔐 Segurança (RLS)

### Políticas Configuradas:

1. **Upload**: Usuários autenticados podem fazer upload apenas em sua pasta
2. **Visualização**: Qualquer pessoa pode ver as imagens (público)
3. **Atualização**: Usuários podem atualizar apenas suas próprias imagens
4. **Exclusão**: Usuários podem deletar apenas suas próprias imagens

### Proteções:

- ✅ Cada usuário só acessa sua própria pasta
- ✅ Imagens são públicas para checkout funcionar
- ✅ Não é possível deletar imagens de outros usuários
- ✅ URLs são permanentes e seguros

---

## 🧪 Testar Upload

### Teste 1: Upload Básico

1. Crie um link de pagamento
2. Faça upload de uma imagem
3. Salve o link
4. Verifique no Supabase Storage:
   - Storage → product-images → {seu_user_id}
   - A imagem deve estar lá

### Teste 2: Preview

1. Selecione uma imagem
2. Veja o preview aparecer instantaneamente
3. Clique no X para remover
4. Selecione outra imagem
5. Preview deve atualizar

### Teste 3: Validação

1. Tente fazer upload de um PDF → Deve dar erro
2. Tente fazer upload de imagem > 5MB → Deve dar erro
3. Faça upload de imagem válida → Deve funcionar

---

## 🔍 Verificar URLs

Após criar um link com imagem:

```sql
-- Ver links com imagens
SELECT 
  title,
  image_url,
  created_at
FROM payment_links
WHERE image_url IS NOT NULL
ORDER BY created_at DESC;
```

A URL deve ser algo como:
```
https://seu-projeto.supabase.co/storage/v1/object/public/product-images/user-id/imagem.jpg
```

---

## ❌ Problemas Comuns

### Erro: "Bucket não encontrado"

**Causa**: Bucket não foi criado

**Solução**:
1. Vá em Storage no Supabase
2. Crie o bucket `product-images`
3. Marque como público

### Erro: "Permissão negada"

**Causa**: Políticas RLS não foram executadas

**Solução**:
1. Execute o SQL: `CONFIGURAR_STORAGE_CHECKOUT.sql`
2. Verifique se as políticas foram criadas

### Erro: "Arquivo muito grande"

**Causa**: Imagem maior que 5MB

**Solução**:
1. Comprima a imagem antes de fazer upload
2. Use ferramentas online como TinyPNG
3. Ou redimensione a imagem

### Preview não aparece

**Causa**: Navegador bloqueando FileReader

**Solução**:
1. Verifique se está usando HTTPS
2. Teste em outro navegador
3. Limpe o cache

---

## 📊 Monitoramento

### Ver uploads recentes:

```sql
SELECT 
  name,
  created_at,
  metadata->>'size' as size_bytes,
  metadata->>'mimetype' as type
FROM storage.objects
WHERE bucket_id = 'product-images'
ORDER BY created_at DESC
LIMIT 10;
```

### Ver espaço usado por usuário:

```sql
SELECT 
  (metadata->>'owner')::uuid as user_id,
  COUNT(*) as total_images,
  SUM((metadata->>'size')::bigint) as total_bytes,
  pg_size_pretty(SUM((metadata->>'size')::bigint)) as total_size
FROM storage.objects
WHERE bucket_id = 'product-images'
GROUP BY metadata->>'owner';
```

---

## 🎉 Pronto!

Agora seus clientes podem fazer upload de imagens lindas para seus produtos no checkout!

**Recursos:**
- ✅ Upload drag-and-drop
- ✅ Preview instantâneo
- ✅ Validação automática
- ✅ Armazenamento seguro
- ✅ URLs públicas
- ✅ Organização por usuário

**Próximos passos:**
- Testar criando um link com imagem
- Verificar se a imagem aparece na página pública
- Monitorar o uso de storage

---

**Dúvidas?** Consulte a documentação do Supabase Storage:
https://supabase.com/docs/guides/storage
