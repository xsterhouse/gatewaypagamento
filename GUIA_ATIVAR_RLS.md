# 🔒 Guia: Ativar RLS com Segurança

## ⚠️ SITUAÇÃO ATUAL
Você está com RLS **DESATIVADO** - isso é **PERIGOSO** em produção!

### Riscos com RLS Desativado:
- ❌ Qualquer cliente pode ver solicitações de outros clientes
- ❌ Qualquer cliente pode modificar solicitações de outros
- ❌ Não há controle de acesso
- ❌ Violação de privacidade (LGPD)

---

## ✅ SOLUÇÃO: Ativar RLS Corretamente

### Passo 1: Execute o SQL
No **Supabase SQL Editor**, execute:
```
SQL_ATIVAR_RLS_CORRETO.sql
```

### Passo 2: Verifique os Resultados
O script mostrará 4 consultas de verificação:

#### Verificação 1: RLS está ativo?
```
tablename     | rowsecurity
med_requests  | true        ✅
```

#### Verificação 2: Políticas criadas?
Deve mostrar 5 políticas:
- `select_own_requests`
- `select_all_requests_admin`
- `insert_own_requests`
- `update_requests_admin`
- `delete_requests_admin`

#### Verificação 3: Autenticação funcionando?
```
meu_id                               | minha_role_supabase
0db7ecd8-f2b2-4110-a374-8dbd6377b0b3 | authenticated
```
✅ Se aparecer um UUID, está OK!
❌ Se aparecer NULL, há problema de autenticação

#### Verificação 4: Usuário existe?
```
id    | email              | role   | name
uuid  | cliente@email.com  | client | João
```
✅ Deve mostrar seus dados

---

## 🧪 Passo 3: Testar

### Teste como CLIENTE:
1. Faça login como cliente
2. Vá em "Solicitações MED"
3. Clique em "Nova Solicitação"
4. Preencha o formulário
5. Clique em "Enviar"

**Resultado esperado:** ✅ Solicitação criada com sucesso!

### Teste como ADMIN:
1. Faça login como admin
2. Vá em "Admin MED"
3. Deve ver TODAS as solicitações

---

## 🔍 Troubleshooting

### Erro: "permission denied for table med_requests"
**Causa:** Políticas não foram criadas corretamente
**Solução:** Execute novamente o `SQL_ATIVAR_RLS_CORRETO.sql`

### Erro: "new row violates row-level security policy"
**Causa:** A política INSERT está bloqueando
**Solução:** Verifique se `auth.uid()` retorna um valor válido

### Como verificar auth.uid():
```sql
SELECT auth.uid();
```
- Se retornar NULL → Problema de autenticação
- Se retornar UUID → Autenticação OK

### Se auth.uid() retorna NULL:
1. Faça logout completo
2. Limpe o cache do navegador
3. Faça login novamente
4. Teste novamente

---

## 📊 O Que Cada Política Faz

### 1. `select_own_requests`
**Permite:** Cliente ver suas próprias solicitações
```sql
user_id = auth.uid()
```

### 2. `select_all_requests_admin`
**Permite:** Admin/Manager ver todas as solicitações
```sql
role IN ('admin', 'manager')
```

### 3. `insert_own_requests`
**Permite:** Qualquer usuário criar solicitação para si mesmo
```sql
user_id = auth.uid()
```
⚠️ **Nota:** Removemos a verificação de role aqui para simplificar

### 4. `update_requests_admin`
**Permite:** Apenas Admin/Manager atualizar
```sql
role IN ('admin', 'manager')
```

### 5. `delete_requests_admin`
**Permite:** Apenas Admin deletar
```sql
role = 'admin'
```

---

## 🎯 Diferença das Políticas Anteriores

### ❌ Políticas Antigas (Não Funcionavam)
```sql
WITH CHECK (
  user_id = auth.uid()
  AND
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'client')
)
```
**Problema:** Verificava role na criação, causava erro

### ✅ Políticas Novas (Funcionam)
```sql
WITH CHECK (user_id = auth.uid())
```
**Solução:** Apenas verifica se está criando para si mesmo

---

## 🚀 Próximos Passos

1. ✅ Execute `SQL_ATIVAR_RLS_CORRETO.sql`
2. ✅ Verifique as 4 consultas de diagnóstico
3. ✅ Teste criar uma solicitação MED
4. ✅ Confirme que funciona
5. ✅ **NUNCA** desative RLS novamente!

---

## 📞 Se Ainda Não Funcionar

Envie os resultados das verificações:
1. Resultado de `SELECT auth.uid()`
2. Resultado de `SELECT * FROM users WHERE id = auth.uid()`
3. Print do erro que aparece no console do navegador

---

## ⚡ Comando Rápido de Emergência

Se precisar desabilitar RLS temporariamente para testar:
```sql
ALTER TABLE med_requests DISABLE ROW LEVEL SECURITY;
-- TESTE
-- Depois IMEDIATAMENTE execute:
-- SQL_ATIVAR_RLS_CORRETO.sql
```

**⚠️ NUNCA deixe RLS desabilitado em produção!**
