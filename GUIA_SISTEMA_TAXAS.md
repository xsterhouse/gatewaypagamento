# 💰 Sistema de Taxas da Plataforma

## 🎯 Como Funciona

O sistema cobra **R$ 0,05 (5 centavos)** em cada operação PIX:
- ✅ Ao **receber** PIX
- ✅ Ao **enviar** PIX

---

## 📊 Exemplos Práticos

### **Cliente RECEBE R$ 100,00:**

```
Valor recebido:      R$ 100,00
Taxa do sistema:     R$   0,05  ← Sua receita
─────────────────────────────────
Creditado ao cliente: R$  99,95
```

### **Cliente ENVIA R$ 100,00:**

```
Valor a enviar:      R$ 100,00
Taxa do banco:       R$   4,10
Taxa do sistema:     R$   0,05  ← Sua receita
─────────────────────────────────
Total debitado:      R$ 104,15
```

---

## 🗄️ Estrutura do Banco de Dados

### **Tabela: system_fees**
Configuração das taxas:

```sql
SELECT * FROM system_fees;

operation_type  | fee_fixed | fee_percentage | min_fee | is_active
─────────────────────────────────────────────────────────────────
pix_receive     | 0.05      | 0.0000         | 0.05    | true
pix_send        | 0.05      | 0.0000         | 0.05    | true
```

### **Tabela: system_fee_collections**
Registro de taxas coletadas:

```sql
SELECT * FROM system_fee_collections 
ORDER BY collected_at DESC 
LIMIT 5;

user_id | operation_type | transaction_amount | fee_amount | collected_at
──────────────────────────────────────────────────────────────────────────
uuid... | pix_receive    | 100.00            | 0.05       | 2024-11-08...
uuid... | pix_send       | 50.00             | 0.05       | 2024-11-08...
```

---

## 📈 Relatórios de Receita

### **Total Coletado Hoje:**

```sql
SELECT 
  SUM(fee_amount) as total_hoje
FROM system_fee_collections
WHERE DATE(collected_at) = CURRENT_DATE
  AND status = 'collected';
```

### **Total por Tipo de Operação:**

```sql
SELECT 
  operation_type,
  COUNT(*) as quantidade,
  SUM(fee_amount) as total_taxas
FROM system_fee_collections
WHERE status = 'collected'
GROUP BY operation_type;
```

### **Relatório Diário:**

```sql
SELECT * FROM system_fee_report
ORDER BY date DESC
LIMIT 30;

date       | operation_type | total_transactions | total_fees_collected
────────────────────────────────────────────────────────────────────────
2024-11-08 | pix_receive    | 150               | 7.50
2024-11-08 | pix_send       | 80                | 4.00
2024-11-07 | pix_receive    | 200               | 10.00
```

---

## 🎨 Interface Admin - Página de Taxas

### **Visualizar Configuração Atual:**

```typescript
import { systemFeeService } from '@/services/systemFeeService'

// Buscar configuração
const receiveConfig = await systemFeeService.getFeeConfig('pix_receive')
const sendConfig = await systemFeeService.getFeeConfig('pix_send')

console.log('Taxa ao receber:', receiveConfig?.fee_fixed) // 0.05
console.log('Taxa ao enviar:', sendConfig?.fee_fixed)     // 0.05
```

### **Atualizar Taxa (Admin):**

```typescript
// Alterar taxa de recebimento para R$ 0,10
await systemFeeService.updateFeeConfig('pix_receive', {
  fee_fixed: 0.10,
  min_fee: 0.10
})

// Alterar taxa de envio para R$ 0,07
await systemFeeService.updateFeeConfig('pix_send', {
  fee_fixed: 0.07,
  min_fee: 0.07
})
```

### **Ver Total Coletado:**

```typescript
// Hoje
const hoje = await systemFeeService.getTotalFeesCollected('today')
console.log('Coletado hoje:', hoje) // Ex: 15.50

// Esta semana
const semana = await systemFeeService.getTotalFeesCollected('week')
console.log('Coletado esta semana:', semana) // Ex: 87.30

// Este mês
const mes = await systemFeeService.getTotalFeesCollected('month')
console.log('Coletado este mês:', mes) // Ex: 345.80

// Total geral
const total = await systemFeeService.getTotalFeesCollected('all')
console.log('Total coletado:', total) // Ex: 1250.00
```

---

## 🔧 Configurações Avançadas

### **Taxa Percentual + Fixa:**

```sql
-- Cobrar 0.5% + R$ 0,05
UPDATE system_fees 
SET 
  fee_percentage = 0.0050,  -- 0.5%
  fee_fixed = 0.05,
  min_fee = 0.05
WHERE operation_type = 'pix_receive';
```

**Exemplo:**
- Cliente recebe R$ 1.000,00
- Taxa = (1000 × 0.005) + 0.05 = R$ 5,05
- Cliente recebe = R$ 994,95

### **Taxa Máxima:**

```sql
-- Limitar taxa máxima em R$ 10,00
UPDATE system_fees 
SET 
  fee_percentage = 0.0100,  -- 1%
  fee_fixed = 0.00,
  min_fee = 0.05,
  max_fee = 10.00
WHERE operation_type = 'pix_send';
```

**Exemplo:**
- Cliente envia R$ 5.000,00
- Taxa calculada = 5000 × 0.01 = R$ 50,00
- Taxa aplicada = R$ 10,00 (máximo)

---

## 📊 Dashboard Admin - Cards de Receita

### **Card: Receita Hoje**

```typescript
const receitaHoje = await systemFeeService.getTotalFeesCollected('today')

<Card>
  <CardHeader>
    <CardTitle>Receita Hoje</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-3xl font-bold text-emerald-400">
      R$ {receitaHoje.toFixed(2)}
    </p>
  </CardContent>
</Card>
```

### **Card: Receita do Mês**

```typescript
const receitaMes = await systemFeeService.getTotalFeesCollected('month')

<Card>
  <CardHeader>
    <CardTitle>Receita do Mês</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-3xl font-bold text-emerald-400">
      R$ {receitaMes.toFixed(2)}
    </p>
  </CardContent>
</Card>
```

### **Tabela: Últimas Taxas Coletadas**

```typescript
const historico = await systemFeeService.getFeeHistory(undefined, 20)

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Data</TableHead>
      <TableHead>Cliente</TableHead>
      <TableHead>Operação</TableHead>
      <TableHead>Valor Transação</TableHead>
      <TableHead>Taxa</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {historico.map(item => (
      <TableRow key={item.id}>
        <TableCell>{new Date(item.collected_at).toLocaleString()}</TableCell>
        <TableCell>{item.user_id.substring(0, 8)}...</TableCell>
        <TableCell>{item.operation_type}</TableCell>
        <TableCell>R$ {item.transaction_amount.toFixed(2)}</TableCell>
        <TableCell className="text-emerald-400">
          R$ {item.fee_amount.toFixed(2)}
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

## 🧪 Como Testar

### **1. Executar SQL de Instalação:**

```sql
-- No Supabase SQL Editor
-- Executar: SQL_TAXA_SISTEMA.sql
```

### **2. Testar Recebimento:**

```sql
-- Simular recebimento de R$ 100,00
-- O cliente deve receber R$ 99,95

-- Verificar taxa coletada:
SELECT * FROM system_fee_collections 
WHERE operation_type = 'pix_receive'
ORDER BY collected_at DESC 
LIMIT 1;

-- Deve mostrar: fee_amount = 0.05
```

### **3. Testar Envio:**

```typescript
// No console do navegador
import { pixSendService } from './src/services/pixSendService'

await pixSendService.sendPix({
  user_id: 'seu-user-id',
  amount: 100,
  pix_key: '12345678900',
  pix_key_type: 'cpf',
  description: 'Teste'
})

// Verificar:
// - Saldo debitado: R$ 104,15 (100 + 4,10 banco + 0,05 sistema)
// - Taxa registrada: R$ 0,05
```

---

## 💡 Dicas de Uso

### **1. Transparência com Clientes:**

Mostre as taxas claramente:

```typescript
// No modal de envio
<div className="text-sm text-gray-400">
  <p>Valor: R$ {amount.toFixed(2)}</p>
  <p>Taxa do banco: R$ {bankFee.toFixed(2)}</p>
  <p>Taxa da plataforma: R$ {systemFee.toFixed(2)}</p>
  <p className="font-bold">Total: R$ {total.toFixed(2)}</p>
</div>
```

### **2. Relatório Mensal:**

```sql
-- Gerar relatório do mês
SELECT 
  DATE_TRUNC('day', collected_at) as dia,
  COUNT(*) as transacoes,
  SUM(fee_amount) as receita
FROM system_fee_collections
WHERE collected_at >= DATE_TRUNC('month', CURRENT_DATE)
  AND status = 'collected'
GROUP BY DATE_TRUNC('day', collected_at)
ORDER BY dia;
```

### **3. Projeção de Receita:**

```sql
-- Média diária dos últimos 30 dias
SELECT 
  AVG(daily_total) as media_diaria,
  AVG(daily_total) * 30 as projecao_mensal
FROM (
  SELECT 
    DATE(collected_at) as dia,
    SUM(fee_amount) as daily_total
  FROM system_fee_collections
  WHERE collected_at >= CURRENT_DATE - INTERVAL '30 days'
    AND status = 'collected'
  GROUP BY DATE(collected_at)
) subquery;
```

---

## 📈 Exemplos de Receita

### **Cenário 1: Gateway Pequeno**
- 100 PIX recebidos/dia × R$ 0,05 = R$ 5,00/dia
- 50 PIX enviados/dia × R$ 0,05 = R$ 2,50/dia
- **Total: R$ 7,50/dia = R$ 225,00/mês**

### **Cenário 2: Gateway Médio**
- 500 PIX recebidos/dia × R$ 0,05 = R$ 25,00/dia
- 200 PIX enviados/dia × R$ 0,05 = R$ 10,00/dia
- **Total: R$ 35,00/dia = R$ 1.050,00/mês**

### **Cenário 3: Gateway Grande**
- 2.000 PIX recebidos/dia × R$ 0,05 = R$ 100,00/dia
- 1.000 PIX enviados/dia × R$ 0,05 = R$ 50,00/dia
- **Total: R$ 150,00/dia = R$ 4.500,00/mês**

---

## ✅ Checklist de Implementação

- [ ] Executar `SQL_TAXA_SISTEMA.sql` no Supabase
- [ ] Verificar tabelas criadas
- [ ] Testar recebimento de PIX
- [ ] Verificar taxa coletada
- [ ] Testar envio de PIX
- [ ] Verificar taxa coletada
- [ ] Adicionar cards de receita no dashboard admin
- [ ] Criar página de relatórios
- [ ] Testar com clientes reais

---

## 🎯 Resultado Final

**Para cada PIX:**
- ✅ Cliente recebe/envia PIX
- ✅ Taxa de R$ 0,05 é coletada automaticamente
- ✅ Registrado em `system_fee_collections`
- ✅ Visível em relatórios
- ✅ Transparente para o cliente

**Sua receita é automática e escalável!** 💰

---

**Versão:** 1.0.0  
**Data:** 08/11/2024  
**Status:** ✅ Pronto para Uso
