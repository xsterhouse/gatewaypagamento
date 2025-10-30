# 📅 Como Usar o Calendário Bancário - Guia Completo

## 🎯 Sistema Completo Implementado!

### ✅ O Que Foi Criado:

1. **Tabela no Banco de Dados** (`banking_calendar`)
2. **Modal de Agendamento** (`SchedulePaymentModal`)
3. **Visualização de Ações** (CalendarBankingActions atualizado)
4. **Botões de Execução e Cancelamento**

---

## 🚀 PASSO 1: Configurar o Banco de Dados

### Execute o SQL no Supabase:

```bash
1. Abra: CRIAR_TABELA_AGENDA_BANCARIA.sql
2. Copie TODO o conteúdo
3. Supabase Dashboard → SQL Editor
4. Cole e execute (Ctrl+Enter)
5. ✅ Aguarde "Success"
```

**O que este SQL faz:**
- ✅ Cria tabela `banking_calendar`
- ✅ Configura políticas RLS
- ✅ Cria índices para performance
- ✅ Adiciona funções de executar/cancelar
- ✅ Configura triggers de atualização

---

## 🎨 PASSO 2: Como Alimentar o Calendário

### Método 1: Via Interface (Recomendado)

#### Agendar um Pagamento:

```
1. Clique no ícone 📅 Calendário (header)
2. Modal abre
3. Clique em "Agendar Pagamento"
4. Preencha o formulário:
   - Título: "Pagamento Fornecedor XYZ"
   - Descrição: "Fatura mensal"
   - Valor: 5000.00
   - Data: Selecione a data
   - Categoria: Fornecedor
   - Recorrente?: Sim/Não
   - Lembrete?: Sim/Não
5. Clique "Agendar Pagamento"
6. ✅ Ação criada!
```

### Método 2: Via SQL Direto

```sql
INSERT INTO public.banking_calendar (
  user_id,
  action_type,
  title,
  description,
  amount,
  scheduled_date,
  status
) VALUES (
  auth.uid(),
  'payment',
  'Pagamento Fornecedor ABC',
  'Compra de material',
  3500.00,
  '2024-11-15',
  'scheduled'
);
```

### Método 3: Via API (Código)

```typescript
const { error } = await supabase
  .from('banking_calendar')
  .insert({
    user_id: session.user.id,
    action_type: 'payment',
    title: 'Pagamento Fornecedor',
    description: 'Descrição detalhada',
    amount: 5000.00,
    scheduled_date: '2024-11-15',
    status: 'scheduled'
  })
```

---

## 💡 PASSO 3: Como Realizar as Ações Pendentes

### Opção A: Executar uma Ação

```
1. Abra o calendário (📅)
2. Veja a lista de ações
3. Encontre a ação que quer executar
4. Clique no botão "✓ Executar"
5. ✅ Status muda para "Executado"
6. ✅ Data de execução é registrada
```

**O que acontece nos bastidores:**
```typescript
// Status: 'scheduled' → 'executed'
// executed_at: null → NOW()
```

### Opção B: Cancelar uma Ação

```
1. Abra o calendário (📅)
2. Encontre a ação
3. Clique no botão "⊘ Cancelar"
4. ✅ Status muda para "Cancelado"
5. ✅ Não aparece mais na lista de pendentes
```

---

## 📊 Tipos de Ações Disponíveis

### 1. 💰 Pagamento (payment)
**Quando usar:** Pagamentos agendados, transferências
```sql
action_type: 'payment'
cor: Azul
ícone: DollarSign
```

### 2. 📈 Depósito (deposit)
**Quando usar:** Recebimentos esperados, entradas
```sql
action_type: 'deposit'
cor: Verde
ícone: TrendingUp
```

### 3. 🔄 Recorrente (recurring)
**Quando usar:** Pagamentos mensais automáticos
```sql
action_type: 'recurring'
cor: Roxo
ícone: RefreshCw
is_recurring: true
recurrence_type: 'monthly'
```

### 4. ⚠️ Vencimento (deadline)
**Quando usar:** Boletos, contas com prazo
```sql
action_type: 'deadline'
cor: Vermelho
ícone: AlertCircle
status: 'urgent'
```

### 5. 📄 Relatório (report)
**Quando usar:** Fechamentos, análises periódicas
```sql
action_type: 'report'
cor: Amarelo
ícone: FileText
amount: 0 (geralmente sem valor)
```

---

## 🎯 Fluxo Completo de Uso

### Cenário Exemplo: Pagar Fornecedor

```
DIA 1 - Criar Ação:
1. Clique 📅 → "Agendar Pagamento"
2. Preencha:
   - Título: "Pagar Fornecedor XYZ"
   - Valor: R$ 5.000,00
   - Data: 15/Nov
   - Categoria: Fornecedor
3. Ativar lembrete: 3 dias antes
4. Agendar ✅

DIA 12 - Lembrete:
→ Sistema envia notificação
→ "Faltam 3 dias para: Pagar Fornecedor XYZ"

DIA 15 - Executar:
1. Abra calendário
2. Veja a ação
3. Clique "✓ Executar"
4. Ação marcada como executada ✅
5. Desaparece da lista de pendentes
```

---

## 📋 Status das Ações

| Status | Cor | Significado |
|--------|-----|-------------|
| **pending** | Azul | Aguardando ação |
| **scheduled** | Roxo | Agendado para data futura |
| **urgent** | Vermelho | Prazo próximo/atrasado |
| **executed** | Verde | Ação realizada |
| **cancelled** | Cinza | Ação cancelada |

---

## 🔔 Sistema de Lembretes

### Como Configurar:

```
Ao criar ação:
1. Marque "Ativar lembrete"
2. Escolha quantos dias antes: 1, 3, 7, etc
3. Sistema enviará notificação

Exemplo:
- Ação: Pagar conta (dia 15)
- Lembrete: 3 dias antes
- Notificação: dia 12
```

### Implementação Futura:
- [ ] Email de lembrete
- [ ] SMS/WhatsApp
- [ ] Notificação push
- [ ] Dashboard de lembretes

---

## 🔄 Pagamentos Recorrentes

### Como Criar:

```
1. Agendar Pagamento
2. Marcar "Pagamento recorrente"
3. Escolher frequência:
   - Diário
   - Semanal
   - Mensal ✓ (mais comum)
   - Anual
4. Agendar

Sistema automaticamente:
→ Cria próxima ocorrência
→ Mantém histórico
→ Alerta quando chega data
```

---

## 📈 Estatísticas no Modal

### Ações Pendentes:
```
Conta apenas ações com status:
- pending
- urgent
```

### Total Agendado:
```
Soma de TODOS os valores:
- pending
- scheduled
- urgent
```

---

## 🛠️ API Disponível

### Listar Ações:
```typescript
const { data } = await supabase
  .from('banking_calendar')
  .select('*')
  .eq('user_id', userId)
  .in('status', ['pending', 'scheduled'])
  .order('scheduled_date', { ascending: true })
```

### Criar Ação:
```typescript
const { error } = await supabase
  .from('banking_calendar')
  .insert({ ...data })
```

### Executar Ação:
```typescript
const { error } = await supabase
  .from('banking_calendar')
  .update({ 
    status: 'executed',
    executed_at: new Date().toISOString()
  })
  .eq('id', actionId)
```

### Cancelar Ação:
```typescript
const { error } = await supabase
  .from('banking_calendar')
  .update({ status: 'cancelled' })
  .eq('id', actionId)
```

---

## 🧪 Testes

### Teste 1: Criar Ação
```
1. Agendar pagamento
2. ✅ Deve aparecer na lista
3. ✅ Contador deve aumentar
4. ✅ Total deve somar
```

### Teste 2: Executar Ação
```
1. Clicar "Executar"
2. ✅ Toast de sucesso
3. ✅ Ação some da lista
4. ✅ Contador diminui
```

### Teste 3: Cancelar Ação
```
1. Clicar "Cancelar"
2. ✅ Toast de sucesso
3. ✅ Ação some da lista
4. ✅ Total atualiza
```

### Teste 4: Recorrência
```
1. Criar ação recorrente mensal
2. ✅ Deve criar próxima ocorrência
3. ✅ Deve manter histórico
```

---

## 💾 Estrutura do Banco

### Campos Principais:

```sql
id                  → UUID único
user_id             → Dono da ação
action_type         → Tipo (payment, deposit, etc)
title               → Título da ação
description         → Descrição detalhada
amount              → Valor em R$
scheduled_date      → Quando executar
status              → Estado atual
is_recurring        → É recorrente?
recurrence_type     → Frequência
reminder_enabled    → Tem lembrete?
reminder_days_before → Dias antes de lembrar
executed_at         → Quando foi executada
created_at          → Quando foi criada
updated_at          → Última modificação
```

---

## 🎨 Personalização

### Adicionar Novas Categorias:

**Arquivo:** `SchedulePaymentModal.tsx`

```tsx
<option value="nova_categoria">Nova Categoria</option>
```

### Adicionar Novos Tipos:

**SQL:**
```sql
ALTER TABLE banking_calendar
DROP CONSTRAINT banking_calendar_action_type_check;

ALTER TABLE banking_calendar
ADD CONSTRAINT banking_calendar_action_type_check
CHECK (action_type IN ('payment', 'deposit', 'recurring', 'deadline', 'report', 'novo_tipo'));
```

**Componente:**
```tsx
const icons = {
  ...
  novo_tipo: NovoIcon
}
```

---

## 📚 Arquivos do Sistema

| Arquivo | Função |
|---------|--------|
| `CRIAR_TABELA_AGENDA_BANCARIA.sql` | Estrutura do banco |
| `SchedulePaymentModal.tsx` | Modal de agendamento |
| `CalendarBankingActions.tsx` | Visualização e ações |
| `COMO_USAR_CALENDARIO_BANCARIO.md` | Este guia |

---

## ✅ Checklist Final

Configure e teste:

- [ ] Executou SQL no Supabase
- [ ] Tabela `banking_calendar` criada
- [ ] Políticas RLS ativas
- [ ] Modal de agendamento abre
- [ ] Consegue criar ação
- [ ] Ação aparece na lista
- [ ] Botão Executar funciona
- [ ] Botão Cancelar funciona
- [ ] Contador atualiza
- [ ] Total atualiza
- [ ] Lembretes configuráveis
- [ ] Recorrência funciona

---

## 🚀 Próximas Funcionalidades

- [ ] Página de calendário completo
- [ ] Visualização mensal (grid)
- [ ] Filtros avançados
- [ ] Exportação de relatórios
- [ ] Integração com transações reais
- [ ] Notificações automáticas
- [ ] Sincronização com banco

---

**🎉 Sistema de Calendário Bancário Completo Implementado! 🎉**

**📖 Dúvidas? Consulte este guia!**
