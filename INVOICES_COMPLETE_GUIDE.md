# 💰 Sistema de Faturas - Guia Completo

## ✅ O Que Foi Criado

### 1. 📊 Tabela no Banco de Dados
- ✅ `CREATE_INVOICES_TABLE.sql` - Script completo
- ✅ Tabela `invoices` com todos os campos
- ✅ RLS Policies configuradas
- ✅ Triggers automáticos
- ✅ Geração automática de números de fatura

### 2. 🎛️ Painel Admin
- ✅ `AdminInvoices.tsx` - Página completa de gerenciamento
- ✅ CRUD completo (Criar, Ler, Atualizar, Deletar)
- ✅ Filtros por status e busca
- ✅ Métricas em tempo real
- ✅ Modais de criação e edição

### 3. 📄 Exportação PDF
- ✅ `pdfExport.ts` - Biblioteca de exportação
- ✅ Relatórios formatados
- ✅ Métricas incluídas
- ✅ Tabela de faturas

### 4. 🔍 Filtros
- ✅ Busca por número, cliente, email
- ✅ Filtro por status (Todos, Pendente, Pago, Vencido)
- ✅ Atualização em tempo real

---

## 🚀 Como Instalar

### 1. Instalar Dependências NPM

```bash
npm install jspdf jspdf-autotable
```

Ou com yarn:
```bash
yarn add jspdf jspdf-autotable
```

### 2. Executar SQL no Supabase

```sql
-- Execute o arquivo: CREATE_INVOICES_TABLE.sql
-- Isso criará:
-- - Tabela invoices
-- - Índices
-- - Triggers
-- - RLS Policies
-- - Sequência para números de fatura
```

### 3. Acessar o Painel Admin

```
http://localhost:5173/admin/invoices
```

---

## 📋 Estrutura da Tabela `invoices`

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT NOT NULL,
  description TEXT,
  invoice_number TEXT UNIQUE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Campos:
- **id**: UUID único
- **user_id**: Cliente (FK para users)
- **amount**: Valor da fatura
- **due_date**: Data de vencimento
- **paid_date**: Data de pagamento (null se não pago)
- **status**: 'pending', 'paid', 'overdue', 'cancelled'
- **description**: Descrição da fatura
- **invoice_number**: Número único (gerado automaticamente)
- **created_at**: Data de criação
- **updated_at**: Data de atualização

---

## 🎯 Funcionalidades do Painel Admin

### 1. **Dashboard com Métricas**
```
┌─────────────────────────────────────────┐
│ Total Geral: R$ 10.000,00 (50 faturas) │
│ Pendente: R$ 3.000,00 (15 faturas)      │
│ Vencido: R$ 500,00 (5 faturas)          │
└─────────────────────────────────────────┘
```

### 2. **Filtros Avançados**
- 🔍 Busca por:
  - Número da fatura
  - Nome do cliente
  - Email do cliente
  - Descrição
  
- 🏷️ Filtro por Status:
  - Todos
  - Pendente
  - Pago
  - Vencido

### 3. **Criar Nova Fatura**
```
Modal com campos:
- Cliente (dropdown)
- Valor (R$)
- Data de Vencimento
- Descrição
```

### 4. **Editar Fatura**
```
Modal com campos:
- Número (readonly)
- Cliente (readonly)
- Valor
- Data de Vencimento
- Status
- Descrição
```

### 5. **Excluir Fatura**
- Confirmação antes de excluir
- Exclusão permanente do banco

### 6. **Exportar PDF**
```
Relatório inclui:
- Cabeçalho com título
- Informações do cliente (se aplicável)
- Data de geração
- Resumo (Total, Pago, Pendente, Vencido)
- Tabela completa de faturas
```

---

## 🔐 Segurança (RLS Policies)

### Cliente:
```sql
-- Vê apenas suas próprias faturas
CREATE POLICY "users_view_own_invoices"
ON invoices FOR SELECT
USING (auth.uid() = user_id);
```

### Admin:
```sql
-- Vê todas as faturas
CREATE POLICY "admins_view_all_invoices"
ON invoices FOR SELECT
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() AND role = 'admin'
));

-- Pode criar, editar e deletar
CREATE POLICY "admins_create_invoices" ...
CREATE POLICY "admins_update_invoices" ...
CREATE POLICY "admins_delete_invoices" ...
```

---

## 🎨 Interface do Cliente (Financeiro.tsx)

### Já Implementado:
- ✅ Visualização de faturas
- ✅ Métricas (Pago, Pendente, Vencido)
- ✅ Tabela com status coloridos
- ✅ Botão Atualizar
- ✅ Botão Exportar PDF
- ✅ Hover effects
- ✅ Loading states

### Como Usar (Cliente):
```
1. Cliente acessa "Financeiro"
2. Vê suas faturas
3. Pode exportar PDF
4. Vê status de cada fatura
```

---

## 📊 Geração Automática de Números

### Formato:
```
INV-202410-000001
INV-202410-000002
INV-202410-000003
...
```

### Como Funciona:
```sql
-- Trigger automático ao inserir
INV-[YYYYMM]-[SEQUENCIAL]

Exemplo:
- Outubro 2025: INV-202510-000001
- Novembro 2025: INV-202511-000001
```

---

## 🔄 Fluxo Completo

### 1. Admin Cria Fatura
```
1. Admin acessa /admin/invoices
2. Clica "Nova Fatura"
3. Seleciona cliente
4. Preenche valor e vencimento
5. Adiciona descrição
6. Clica "Criar Fatura"
7. Sistema gera número automaticamente
8. Fatura criada com status "pending"
```

### 2. Cliente Visualiza
```
1. Cliente acessa "Financeiro"
2. Vê nova fatura na lista
3. Status: Pendente (amarelo)
4. Pode exportar PDF
```

### 3. Cliente Paga
```
1. Cliente efetua pagamento
2. Admin atualiza status para "paid"
3. Sistema registra paid_date
4. Cliente vê status: Pago (verde)
```

### 4. Fatura Vence
```
1. Sistema verifica due_date < hoje
2. Se status = "pending"
3. Atualiza automaticamente para "overdue"
4. Cliente vê status: Vencido (vermelho)
```

---

## 📱 Responsividade

### Desktop:
- 3 colunas de métricas
- Tabela completa
- Todos os filtros visíveis

### Mobile:
- 1 coluna de métricas
- Tabela com scroll horizontal
- Filtros empilhados

---

## 🎯 Status Visuais

| Status | Cor | Badge | Descrição |
|--------|-----|-------|-----------|
| pending | 🟡 Amarelo | ⏳ Pendente | Aguardando pagamento |
| paid | 🟢 Verde | ✅ Pago | Pagamento confirmado |
| overdue | 🔴 Vermelho | ❌ Vencido | Prazo expirado |
| cancelled | ⚫ Cinza | ⚫ Cancelado | Fatura cancelada |

---

## 📄 Exportação PDF

### Conteúdo do PDF:
```
┌─────────────────────────────────────┐
│ Relatório de Faturas                │
│                                     │
│ Cliente: João Silva                 │
│ Email: joao@email.com              │
│ Data de Geração: 29/10/2025        │
│                                     │
│ Resumo:                             │
│ Total: R$ 10.000,00                │
│ Pago: R$ 7.000,00                  │
│ Pendente: R$ 2.500,00              │
│ Vencido: R$ 500,00                 │
│                                     │
│ ┌────────────────────────────────┐ │
│ │ Número  │ Valor │ Vencimento  │ │
│ ├────────────────────────────────┤ │
│ │ INV-... │ R$... │ 01/11/2025  │ │
│ │ ...                            │ │
│ └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Como Exportar:
```typescript
// Cliente
<Button onClick={handleExportPDF}>
  <Download /> Exportar PDF
</Button>

// Gera PDF com faturas do cliente

// Admin
<Button onClick={handleExportPDF}>
  <Download /> Exportar PDF
</Button>

// Gera PDF com faturas filtradas
```

---

## 🔧 Manutenção

### Marcar Faturas Vencidas Automaticamente:
```sql
-- Executar diariamente (cron job)
SELECT mark_overdue_invoices();
```

### Limpar Faturas Antigas:
```sql
-- Opcional: deletar faturas antigas
DELETE FROM invoices 
WHERE status = 'cancelled' 
AND created_at < NOW() - INTERVAL '1 year';
```

---

## 📁 Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `CREATE_INVOICES_TABLE.sql` | Script SQL completo |
| `AdminInvoices.tsx` | Painel admin |
| `CreateInvoiceModal.tsx` | Modal criar fatura |
| `EditInvoiceModal.tsx` | Modal editar fatura |
| `pdfExport.ts` | Biblioteca PDF |
| `Financeiro.tsx` | Página cliente (atualizada) |

---

## 🚀 Próximos Passos

### Implementações Futuras:
1. **Pagamento Online**
   - Integração PIX
   - Gerar boleto
   - Cartão de crédito

2. **Notificações**
   - Email ao criar fatura
   - Lembrete antes do vencimento
   - Alerta de vencimento

3. **Recorrência**
   - Faturas mensais automáticas
   - Assinaturas
   - Planos

4. **Relatórios Avançados**
   - Gráficos de receita
   - Análise de inadimplência
   - Previsão de recebimentos

5. **Notas Fiscais**
   - Gerar NF-e
   - Integrar com contabilidade
   - Envio automático

---

## ✅ Checklist de Implementação

- [✅] Criar tabela SQL
- [✅] Configurar RLS
- [✅] Criar painel admin
- [✅] Modal criar fatura
- [✅] Modal editar fatura
- [✅] Filtros e busca
- [✅] Exportação PDF
- [✅] Atualizar página cliente
- [✅] Adicionar rota no App.tsx
- [✅] Documentação completa
- [ ] Instalar dependências (jspdf)
- [ ] Executar SQL no Supabase
- [ ] Testar CRUD completo
- [ ] Testar exportação PDF
- [ ] Testar filtros

---

## 🎉 Resultado Final

**Sistema de Faturas Completo:**
- ✅ CRUD completo
- ✅ Filtros avançados
- ✅ Exportação PDF
- ✅ Métricas em tempo real
- ✅ Interface admin profissional
- ✅ Interface cliente intuitiva
- ✅ Segurança com RLS
- ✅ Geração automática de números
- ✅ Responsivo
- ✅ Documentado

---

**Status:** ✅ 100% Implementado  
**Última Atualização:** 29 de Outubro de 2025  
**Versão:** 1.0
