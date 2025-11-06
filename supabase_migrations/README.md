# 🗄️ Migrações do Banco de Dados

## 📋 Como Executar as Migrações

### **Opção 1: Via Supabase Dashboard (Recomendado)**

1. Acesse o **Supabase Dashboard**: https://app.supabase.com
2. Selecione seu projeto
3. Vá para **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Copie e cole o conteúdo do arquivo `create_bank_acquirers_table.sql`
6. Clique em **Run** (ou pressione `Ctrl + Enter`)
7. Aguarde a confirmação de sucesso

### **Opção 2: Via Supabase CLI**

```bash
# Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# Executar migration
supabase db push --file supabase_migrations/create_bank_acquirers_table.sql
```

### **Opção 3: Via psql (PostgreSQL CLI)**

```bash
psql -h db.your-project.supabase.co -U postgres -d postgres -f supabase_migrations/create_bank_acquirers_table.sql
```

---

## 📊 Tabelas Criadas

### **bank_acquirers**
Tabela principal para gerenciamento de adquirentes bancários (Gateway PIX).

**Campos principais:**
- `id` - UUID único
- `name` - Nome do banco/adquirente
- `bank_code` - Código do banco (ex: 077, 323)
- `client_id` / `client_secret` - Credenciais da API
- `pix_key` - Chave PIX do adquirente
- `webhook_url` - URL para receber webhooks
- `webhook_secret` - Segredo para validar webhooks
- `webhook_events` - Eventos habilitados (JSON)
- `webhook_enabled` - Se webhooks estão ativos
- `is_active` - Se o adquirente está ativo
- `is_default` - Se é o adquirente padrão
- `environment` - sandbox ou production
- `status` - active, inactive ou maintenance

---

## 🔒 Segurança (RLS)

A tabela possui **Row Level Security (RLS)** habilitado:

- ✅ Apenas **admins** podem visualizar adquirentes
- ✅ Apenas **admins** podem criar adquirentes
- ✅ Apenas **admins** podem editar adquirentes
- ✅ Apenas **admins** podem deletar adquirentes

---

## 🎯 Funcionalidades Implementadas

### **Triggers:**
1. **update_bank_acquirers_updated_at** - Atualiza `updated_at` automaticamente
2. **ensure_single_default_acquirer** - Garante apenas um adquirente padrão

### **Índices:**
- `idx_bank_acquirers_is_active` - Busca rápida por ativos
- `idx_bank_acquirers_is_default` - Busca rápida pelo padrão
- `idx_bank_acquirers_status` - Busca rápida por status
- `idx_bank_acquirers_bank_code` - Busca rápida por código do banco

---

## 📝 Exemplo de Uso

Após executar a migration, você pode:

1. **Acessar o painel**: `http://localhost:5173/admin/bank-acquirers`
2. **Criar novo adquirente**: Clicar em "Novo Adquirente"
3. **Configurar webhooks**: Aba "🪝 Webhooks"
4. **Ativar/Desativar**: Botões de toggle nos cards

---

## ⚠️ Importante

- Execute esta migration **apenas uma vez**
- Certifique-se de estar conectado ao banco correto
- Faça backup antes de executar em produção
- A migration é **idempotente** (pode ser executada múltiplas vezes sem problemas)

---

## 🚀 Próximos Passos

Após executar a migration:

1. ✅ Recarregue a página de adquirentes
2. ✅ Crie seu primeiro adquirente
3. ✅ Configure webhooks
4. ✅ Teste integrações

**Seu Gateway PIX estará pronto para operar!** 🎉
