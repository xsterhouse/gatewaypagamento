# 📧 Configurar Confirmação de Email no Supabase

## **❌ Problema**

Quando o admin cria um gerente, o gerente não consegue fazer login porque:
- O Supabase está configurado para **exigir confirmação de email**
- O gerente precisa clicar no link de confirmação no email
- Se o email não chegar, o gerente não consegue entrar

## **✅ Solução 1: Desabilitar Confirmação de Email (Recomendado para Dev)**

### **Passo a Passo:**

1. **Acesse o Supabase Dashboard**
   - Vá para seu projeto
   - Clique em **Authentication** (menu lateral)

2. **Vá para Providers**
   - Clique na aba **Providers**
   - Encontre **Email**

3. **Desabilite Confirmação**
   - Clique em **Email**
   - Desabilite a opção **"Enable email confirmations"**
   - Ou marque **"Confirm email"** como `false`
   - Salve as alterações

4. **Teste**
   - Crie um novo gerente
   - O gerente poderá fazer login imediatamente
   - Sem precisar confirmar email

## **✅ Solução 2: Confirmar Email Manualmente (Admin)**

Se você quiser manter a confirmação de email habilitada:

### **No Supabase Dashboard:**

1. **Acesse Authentication → Users**
2. **Encontre o gerente criado**
3. **Clique nos 3 pontinhos (⋮)**
4. **Clique em "Confirm email"**
5. **Gerente poderá fazer login**

## **✅ Solução 3: Configurar SMTP (Produção)**

Para produção, configure o SMTP para enviar emails:

### **Passo a Passo:**

1. **Acesse Authentication → Email Templates**
2. **Configure SMTP Settings:**
   - Host SMTP (ex: smtp.gmail.com)
   - Porta (ex: 587)
   - Usuário (seu email)
   - Senha (senha de app)

3. **Teste o envio de email**
4. **Gerente receberá email de confirmação**

## **🔧 Solução 4: Auto-Confirmar via SQL (Avançado)**

Execute este SQL para confirmar email automaticamente:

```sql
-- Confirmar email de um usuário específico
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'gerente@email.com';

-- Confirmar email de todos os gerentes
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE id IN (
  SELECT id FROM public.users WHERE role = 'manager'
);
```

## **📋 Verificar Status de Confirmação**

```sql
-- Ver status de confirmação de todos os usuários
SELECT 
  u.email,
  u.email_confirmed_at,
  p.role,
  CASE 
    WHEN u.email_confirmed_at IS NULL THEN '❌ Não confirmado'
    ELSE '✅ Confirmado'
  END as status
FROM auth.users u
LEFT JOIN public.users p ON u.id = p.id
ORDER BY u.created_at DESC;
```

## **🎯 Recomendação**

### **Para Desenvolvimento:**
- ✅ **Desabilite** confirmação de email (Solução 1)
- Mais rápido e prático para testar

### **Para Produção:**
- ✅ **Configure SMTP** (Solução 3)
- Mais seguro e profissional

## **🔍 Como Saber se Está Funcionando**

Após criar um gerente, verifique no console do navegador:

```
✅ Usuário criado no Auth: abc123...
📧 Email confirmado: Sim  ← Deve mostrar "Sim"
```

Se mostrar "Não", o gerente precisará confirmar o email antes de fazer login.

## **💡 Dica Extra**

Você pode adicionar uma mensagem ao criar o gerente:

```typescript
if (!authData.user.email_confirmed_at) {
  toast.warning(
    'Gerente criado! Ele precisará confirmar o email antes de fazer login.',
    { duration: 7000 }
  )
} else {
  toast.success('Gerente criado e pode fazer login imediatamente!')
}
```
