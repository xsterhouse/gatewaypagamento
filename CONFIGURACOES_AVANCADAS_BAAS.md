# 🏦 Configurações Avançadas - BAAS Moderno

## 📋 Visão Geral

Página de configurações profissional estilo Banking as a Service (BAAS), com gestão completa de gerentes, taxas e limites.

---

## ✨ Funcionalidades

### **1. Gestão de Gerentes (Account Managers)**

#### **Criar Novo Gerente:**
- ✅ Nome completo
- ✅ CPF
- ✅ Email
- ✅ Senha definida pelo Admin Master
- ✅ Limite de clientes por gerente

#### **Visualizar Gerentes:**
- ✅ Lista completa com avatar
- ✅ Nome, email e CPF
- ✅ Contador de clientes (atual/máximo)
- ✅ Status (Ativo/Suspenso)
- ✅ Botão de excluir

---

### **2. Configuração de Taxas**

#### **Taxas PIX:**
- 📊 Taxa de Envio (% ou R$)
- 📊 Taxa de Recebimento (% ou R$)
- 📊 Taxa Fixa de Envio
- 📊 Taxa Fixa de Recebimento

#### **Juros e Rendimentos:**
- 💰 Taxa de Juros Mensal
- 💰 Rendimento sobre saldo

#### **Flexibilidade:**
- ✅ Porcentagem OU valor fixo
- ✅ Configurável por taxa
- ✅ Atualização em tempo real
- ✅ Botão "Salvar Alterações"

---

### **3. Limites de Transação**

_(Em desenvolvimento)_
- Limite diário por cliente
- Limite mensal por cliente
- Limite por transação
- Limites customizados por gerente

---

## 🎨 Design UX Moderno

### **Interface com Tabs:**
```
┌─────────────────────────────────────────┐
│ ⚙️ Configurações Avançadas              │
├─────────────────────────────────────────┤
│ [Gerentes] [Taxas] [Limites]            │
├─────────────────────────────────────────┤
│                                         │
│  Conteúdo da tab selecionada           │
│                                         │
└─────────────────────────────────────────┘
```

### **Princípios UX Aplicados:**

✅ **Clareza Visual**
- Cards separados por funcionalidade
- Ícones intuitivos
- Cores que indicam ações

✅ **Feedback Imediato**
- Toast notifications
- Estados de loading
- Confirmações antes de ações destrutivas

✅ **Hierarquia de Informação**
- Título principal destacado
- Subtítulos descritivos
- Labels claros em cada campo

✅ **Responsividade**
- Grid adaptável (1 col mobile, 2 cols desktop)
- Tabs scrolláveis em mobile
- Botões com ícones e texto

✅ **Acessibilidade**
- Labels em todos inputs
- Contraste adequado
- Foco visível

---

## 🔐 Sistema de Permissões

### **Admin Master:**
```
Acesso Total:
├─ Criar/Editar/Excluir gerentes
├─ Configurar todas as taxas
├─ Definir limites do sistema
├─ Atribuir clientes a gerentes
└─ Acessar todos os relatórios
```

### **Gerente de Contas:**
```
Acesso Limitado:
├─ Ver seus clientes atribuídos
├─ Gerenciar transações dos clientes
├─ Aprovar/Rejeitar KYC dos clientes
├─ Responder tickets dos clientes
└─ Ver relatórios dos seus clientes
```

### **Cliente:**
```
Acesso Básico:
├─ Ver próprio dashboard
├─ Fazer transações
├─ Abrir tickets
└─ Ver extratos
```

---

## 📊 Estrutura do Banco de Dados

### **Tabela: users (gerentes)**
```sql
id: UUID (PK)
name: TEXT
email: TEXT
cpf: TEXT
role: 'admin' | 'manager' | 'customer'
max_clients: INTEGER
current_clients: INTEGER (calculado)
status: 'active' | 'suspended'
created_at: TIMESTAMP
```

### **Tabela: manager_clients**
```sql
id: UUID (PK)
manager_id: UUID (FK → users)
client_id: UUID (FK → users)
assigned_at: TIMESTAMP
```

### **Tabela: system_settings**
```sql
id: UUID (PK)
setting_key: TEXT
setting_value: TEXT
setting_type: 'percentage' | 'currency'
description: TEXT
updated_at: TIMESTAMP
updated_by: UUID (FK → users)
```

---

## 🧪 Como Usar

### **1. Criar Primeiro Gerente:**
```
1. Acesse "Configurações Avançadas"
2. Tab "Gerentes"
3. Preencha:
   - Nome: "João Silva"
   - CPF: "123.456.789-00"
   - Email: "joao@empresa.com"
   - Senha: "SenhaSegura123!"
   - Máx Clientes: 50
4. Clique "Criar Gerente"
5. ✅ Gerente criado!
```

### **2. Configurar Taxas PIX:**
```
1. Tab "Taxas"
2. Encontre "Taxa PIX Envio (%)"
3. Digite: 0.5 (0,5%)
4. Encontre "Taxa PIX Recebimento (%)"
5. Digite: 0 (grátis)
6. Clique "Salvar Alterações"
7. ✅ Taxas atualizadas!
```

### **3. Atribuir Clientes (futuro):**
```
1. Tab "Gerentes"
2. Clique em "Atribuir Clientes"
3. Selecione o gerente
4. Selecione os clientes
5. Confirme
6. ✅ Clientes atribuídos!
```

---

## 🎯 Regras de Negócio

### **Gerentes:**
- ✅ Máximo de clientes configurável
- ✅ Não pode exceder o limite
- ✅ Pode ser suspenso
- ✅ Criado apenas pelo Admin Master
- ✅ CPF único por gerente

### **Taxas:**
- ✅ Podem ser % ou R$
- ✅ Aplicam-se a todos os clientes
- ✅ Podem ser 0 (grátis)
- ✅ Histórico de alterações registrado

### **Clientes:**
- ✅ Atribuídos a um gerente
- ✅ Não podem trocar de gerente sozinhos
- ✅ Taxas aplicadas automaticamente
- ✅ Limites respeitados

---

## 🚀 Próximas Funcionalidades

### **Gestão de Clientes:**
- [ ] Atribuir clientes a gerentes
- [ ] Transferir clientes entre gerentes
- [ ] Ver clientes por gerente
- [ ] Histórico de atribuições

### **Taxas Personalizadas:**
- [ ] Taxa diferente por gerente
- [ ] Taxa diferente por cliente
- [ ] Taxas promocionais
- [ ] Validade de taxas

### **Limites Avançados:**
- [ ] Limite diário
- [ ] Limite mensal
- [ ] Limite por operação
- [ ] Limites por tipo de transação

### **Relatórios:**
- [ ] Clientes por gerente
- [ ] Receita por gerente
- [ ] Taxas arrecadadas
- [ ] Performance de gerentes

---

## 📱 Interface Responsiva

### **Desktop (>1024px):**
```
┌──────────────────────────────────────┐
│ Tabs horizontais                     │
│ Grid 2 colunas                       │
│ Formulários lado a lado              │
└──────────────────────────────────────┘
```

### **Tablet (768px-1024px):**
```
┌────────────────────────┐
│ Tabs horizontais       │
│ Grid 2 colunas         │
│ Formulários compactos  │
└────────────────────────┘
```

### **Mobile (<768px):**
```
┌──────────────┐
│ Tabs scroll  │
│ Grid 1 col   │
│ Formulários  │
│ verticais    │
└──────────────┘
```

---

## 🎨 Componentes Utilizados

- ✅ **Tabs** - Navegação entre seções
- ✅ **Cards** - Agrupamento de conteúdo
- ✅ **Inputs** - Formulários adaptáveis
- ✅ **Buttons** - Ações primárias e secundárias
- ✅ **Labels** - Identificação clara
- ✅ **Icons** - Lucide React
- ✅ **Toast** - Notificações

---

## 📄 Exemplo de Uso Real

### **Cenário: Fintech com 3 Gerentes**

```
Admin Master (você):
├─ Gerente João
│  ├─ 30 clientes
│  └─ Foco: Empresas
│
├─ Gerente Maria
│  ├─ 45 clientes
│  └─ Foco: Pessoas Físicas
│
└─ Gerente Carlos
   ├─ 25 clientes
   └─ Foco: Startups

Taxas Configuradas:
├─ PIX Envio: 0.5%
├─ PIX Recebimento: 0%
├─ Juros: 0.8% ao mês
└─ Rendimento: 0.5% ao mês
```

---

## ✅ Checklist de Implementação

- [x] Criar página ConfiguracoesAvancadas
- [x] Sistema de tabs
- [x] Formulário criar gerente
- [x] Lista de gerentes
- [x] Editar taxas
- [x] Salvar configurações
- [x] Design adaptável ao tema
- [x] UX moderna
- [ ] Atribuir clientes
- [ ] Histórico de alterações
- [ ] Permissões por role
- [ ] Limites customizados

---

**🎊 Página BAAS Profissional Criada! 🎊**

**Acesse: `/configuracoes-avancadas`**
