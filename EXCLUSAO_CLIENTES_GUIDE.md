# 🗑️ **GUIA: Exclusão Segura de Clientes**

## ✅ **O QUE FOI IMPLEMENTADO:**

Sistema de exclusão segura de clientes com:
- ✅ Modal de confirmação com avisos de perigo
- ✅ Validação de senha do admin/gerente
- ✅ Campo obrigatório para motivo da exclusão
- ✅ Exclusão completa de todos os dados
- ✅ Log de auditoria permanente
- ✅ Remoção de arquivos do storage

---

## 🔐 **SEGURANÇA:**

### **Validações Implementadas:**

1. **Senha Obrigatória:**
   - Admin/Gerente precisa digitar sua própria senha
   - Sistema valida a senha antes de excluir
   - Senha incorreta = exclusão bloqueada

2. **Motivo Obrigatório:**
   - Campo de texto obrigatório
   - Motivo é registrado no log de auditoria
   - Não pode excluir sem justificativa

3. **Confirmação Visual:**
   - Modal com avisos em vermelho
   - Lista de dados que serão excluídos
   - Informações do cliente destacadas

---

## 📋 **DADOS EXCLUÍDOS:**

Quando um cliente é excluído, o sistema remove:

```
✅ Dados cadastrais (tabela users)
✅ Documentos KYC (tabela kyc_documents)
✅ Arquivos do storage (bucket kyc-documents)
✅ Carteiras digitais (tabela wallets)
✅ Transações PIX (tabela pix_transactions)
✅ Conta de autenticação (Supabase Auth)
```

---

## 🔧 **CONFIGURAÇÃO NECESSÁRIA:**

### **1. Criar Tabela de Logs no Supabase:**

Execute a migration SQL:

```sql
-- Arquivo: supabase_migrations/create_user_deletion_logs_table.sql
```

**Como executar:**

1. Acesse: https://app.supabase.com/project/seu-projeto/sql
2. Cole o conteúdo do arquivo
3. Clique em "Run"

**Ou via Supabase CLI:**

```bash
supabase db push
```

---

## 📊 **TABELA DE LOGS:**

### **Estrutura:**

```sql
user_deletion_logs
├── id (UUID)
├── deleted_user_id (UUID) - ID do usuário excluído
├── deleted_user_name (VARCHAR) - Nome do usuário
├── deleted_user_email (VARCHAR) - Email do usuário
├── deleted_user_document (VARCHAR) - CPF/CNPJ
├── deleted_by (UUID) - ID do admin que excluiu
├── deletion_reason (TEXT) - Motivo da exclusão
├── deleted_at (TIMESTAMP) - Data/hora da exclusão
└── created_at (TIMESTAMP)
```

### **Índices:**

```sql
✅ idx_user_deletion_logs_deleted_user_id
✅ idx_user_deletion_logs_deleted_by
✅ idx_user_deletion_logs_deleted_at
```

### **RLS (Segurança):**

```sql
✅ Apenas admins e gerentes podem ver logs
✅ Sistema pode inserir logs automaticamente
```

---

## 🎯 **COMO USAR:**

### **1. Acessar Gerenciamento KYC:**

```
Dashboard Admin → Gerenciar KYC
```

### **2. Localizar Cliente:**

Use os filtros:
- **Todos** - Todos os clientes
- **Pendentes** - Aguardando envio de docs
- **Aguardando** - Docs enviados, aguardando análise
- **Aprovados** - KYC aprovado
- **Rejeitados** - KYC rejeitado

Ou busque por:
- Nome
- Email
- CPF/CNPJ

### **3. Clicar em "Excluir":**

```
┌─────────────────────────────────┐
│  [Visualizar] [Documentos]      │
│  [Bloquear] [Excluir] ← Aqui    │
└─────────────────────────────────┘
```

### **4. Preencher Modal:**

```
┌─────────────────────────────────────────┐
│  ⚠️ Excluir Cliente Permanentemente     │
├─────────────────────────────────────────┤
│                                         │
│  ⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!  │
│                                         │
│  Dados que serão excluídos:             │
│  • Dados cadastrais                     │
│  • Documentos KYC                       │
│  • Carteiras digitais                   │
│  • Histórico de transações              │
│  • Conta de acesso                      │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Nome: João Silva                  │  │
│  │ Email: joao@email.com             │  │
│  │ Documento: 123.456.789-09         │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Sua Senha (Admin/Gerente) *           │
│  ┌───────────────────────────────────┐  │
│  │ ••••••••                          │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Motivo da Exclusão *                   │
│  ┌───────────────────────────────────┐  │
│  │ Cliente solicitou exclusão LGPD   │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  📋 Registro de Auditoria:              │
│  Esta exclusão será registrada com      │
│  seu nome, data/hora e motivo.          │
│                                         │
│  [Cancelar] [Confirmar Exclusão]        │
└─────────────────────────────────────────┘
```

### **5. Confirmar:**

- Digite **sua senha** (admin/gerente)
- Digite o **motivo** da exclusão
- Clique em **"Confirmar Exclusão"**

---

## ✅ **VALIDAÇÕES:**

### **Senha Incorreta:**
```
❌ "Senha incorreta!"
→ Exclusão bloqueada
```

### **Sem Senha:**
```
❌ "Digite sua senha para confirmar a exclusão"
→ Exclusão bloqueada
```

### **Sem Motivo:**
```
❌ "Informe o motivo da exclusão"
→ Exclusão bloqueada
```

### **Sucesso:**
```
✅ "Cliente João Silva excluído com sucesso!"
→ Todos os dados removidos
→ Log registrado
```

---

## 📊 **CONSULTAR LOGS:**

### **Via SQL Editor:**

```sql
-- Ver todos os logs de exclusão
SELECT 
  dl.*,
  u.name as deleted_by_name,
  u.email as deleted_by_email
FROM user_deletion_logs dl
LEFT JOIN users u ON u.id = dl.deleted_by
ORDER BY dl.deleted_at DESC;

-- Ver exclusões de hoje
SELECT * FROM user_deletion_logs
WHERE deleted_at::date = CURRENT_DATE
ORDER BY deleted_at DESC;

-- Ver exclusões por admin específico
SELECT * FROM user_deletion_logs
WHERE deleted_by = 'uuid-do-admin'
ORDER BY deleted_at DESC;

-- Buscar por cliente excluído
SELECT * FROM user_deletion_logs
WHERE deleted_user_email ILIKE '%email%'
   OR deleted_user_name ILIKE '%nome%';
```

### **Via Dashboard (Futuro):**

Você pode criar uma página de auditoria para visualizar os logs:

```
Dashboard Admin → Auditoria → Exclusões
```

---

## 🔒 **SEGURANÇA E COMPLIANCE:**

### **LGPD (Lei Geral de Proteção de Dados):**

✅ **Direito ao Esquecimento:**
- Cliente pode solicitar exclusão de dados
- Sistema remove todos os dados pessoais
- Log mantém apenas informações necessárias

✅ **Auditoria:**
- Todas as exclusões são registradas
- Motivo é obrigatório
- Identificação do responsável

✅ **Rastreabilidade:**
- Quem excluiu
- Quando excluiu
- Por que excluiu

### **Boas Práticas:**

1. **Sempre informar motivo detalhado:**
   ```
   ✅ "Cliente solicitou exclusão via email em 06/11/2025"
   ✅ "Conta duplicada - mantida conta ID abc123"
   ✅ "Fraude confirmada - caso #12345"
   ❌ "teste"
   ❌ "excluir"
   ```

2. **Verificar antes de excluir:**
   - Confirmar identidade do cliente
   - Verificar se há transações pendentes
   - Fazer backup se necessário

3. **Documentar externamente:**
   - Manter email/ticket da solicitação
   - Registrar em sistema de CRM
   - Guardar comprovantes

---

## ⚠️ **AVISOS IMPORTANTES:**

### **Exclusão é IRREVERSÍVEL:**
```
❌ Não há como recuperar os dados
❌ Não há backup automático
❌ Não há "desfazer"
```

### **Impacto:**
```
⚠️ Transações do cliente ficam órfãs
⚠️ Relatórios podem ter dados incompletos
⚠️ Histórico financeiro é perdido
```

### **Alternativas:**
```
✅ Bloquear conta (reversível)
✅ Rejeitar KYC (mantém dados)
✅ Marcar como inativo
```

---

## 🧪 **TESTE EM DESENVOLVIMENTO:**

### **1. Criar usuário de teste:**
```
Cadastro → Preencher dados → Enviar docs
```

### **2. Tentar excluir:**
```
Gerenciar KYC → Localizar usuário → Excluir
```

### **3. Testar validações:**
```
❌ Sem senha → Deve bloquear
❌ Senha errada → Deve bloquear
❌ Sem motivo → Deve bloquear
✅ Tudo correto → Deve excluir
```

### **4. Verificar logs:**
```sql
SELECT * FROM user_deletion_logs
ORDER BY deleted_at DESC
LIMIT 1;
```

---

## 🐛 **TROUBLESHOOTING:**

### **Erro: "Tabela user_deletion_logs não existe"**
```
✅ Execute a migration SQL
✅ Verifique no Supabase Table Editor
```

### **Erro: "Permissão negada"**
```
✅ Verifique se você é admin ou gerente
✅ Verifique RLS policies
```

### **Erro: "Senha incorreta"**
```
✅ Digite a senha da SUA conta (admin)
✅ Não é a senha do cliente
```

### **Exclusão não remove tudo:**
```
✅ Verifique se as tabelas existem
✅ Verifique RLS policies
✅ Veja logs no console (F12)
```

---

## 📚 **ARQUIVOS MODIFICADOS:**

```
src/pages/KYCManagement.tsx
├── Estado: deleteModalOpen, deletePassword, deleteReason
├── Função: handleOpenDeleteModal()
├── Função: handleDeleteClient() (com validação)
└── Modal: Dialog de exclusão

supabase_migrations/
└── create_user_deletion_logs_table.sql
```

---

## 🎯 **CHECKLIST DE IMPLEMENTAÇÃO:**

- [x] Código implementado
- [x] Modal criado
- [x] Validação de senha
- [x] Campo de motivo
- [x] Exclusão completa
- [x] Log de auditoria
- [x] Migration SQL
- [x] RLS configurado
- [ ] **Executar migration no Supabase** (você precisa fazer)
- [ ] **Testar em desenvolvimento**
- [ ] **Deploy para produção**

---

**Sistema de exclusão segura implementado! Execute a migration e teste!** 🔐🗑️
