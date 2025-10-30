# 📅 Guia Definitivo: Salvar Datas SEM Problemas de Timezone

## 🐛 O Problema

Quando você escolhe **20/11/2025** no input, o sistema salva como **19/11/2025**.

### Por que isso acontece?

```javascript
// ❌ ERRADO - Causa mudança de dia
const data = new Date("2025-11-20")
console.log(data.toISOString())
// Resultado no Brasil (UTC-3): "2025-11-19T03:00:00.000Z"
// O dia mudou de 20 para 19! ❌
```

O JavaScript converte a string para o timezone local (Brasil = UTC-3), fazendo a data "voltar" 3 horas, o que pode mudar o dia.

## ✅ A Solução

**Nunca use `new Date()` com strings de data!**

Salve a data **exatamente como está** no formato `YYYY-MM-DD`:

```javascript
// ✅ CORRETO - Mantém o dia
const data = "2025-11-20" // Do input type="date"
// Salvar direto no banco: "2025-11-20"
// Sem conversão = Sem problema de timezone!
```

## 🎯 Implementação Completa

### 1. Função Utilitária

```typescript
// src/lib/dateUtils.ts

export function convertDateToISO(dateString: string): string {
  if (!dateString) {
    throw new Error('Data inválida')
  }

  // Validar formato YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateString)) {
    throw new Error('Formato de data inválido. Use YYYY-MM-DD')
  }

  // Retornar exatamente como está
  // NÃO converter para Date object
  return dateString
}
```

### 2. Componente de Formulário

```tsx
import { useState } from 'react'
import { convertDateToISO } from '@/lib/dateUtils'

export function FormularioFatura() {
  const [formData, setFormData] = useState({
    nome: '',
    valor: '',
    data: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // ✅ Usar a data exatamente como está
    const dataFormatada = convertDateToISO(formData.data)
    
    const payload = {
      nome: formData.nome,
      valor: parseFloat(formData.valor),
      data: dataFormatada // "2025-11-20"
    }

    // Salvar no banco
    await salvarFatura(payload)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.nome}
        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
        placeholder="Nome do cliente"
      />

      <input
        type="number"
        step="0.01"
        value={formData.valor}
        onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
        placeholder="Valor"
      />

      <input
        type="date"
        value={formData.data}
        onChange={(e) => setFormData({ ...formData, data: e.target.value })}
      />

      <button type="submit">Salvar</button>
    </form>
  )
}
```

### 3. Salvar no Banco (Supabase)

```typescript
const { error } = await supabase
  .from('faturas')
  .insert({
    nome: formData.nome,
    valor: parseFloat(formData.valor),
    data: formData.data // "2025-11-20" (sem hora)
  })
```

### 4. Exibir no CRUD

```typescript
// src/lib/utils.ts

export function formatDate(date: string): string {
  // Se for string ISO com horário, extrair apenas a data
  if (typeof date === 'string' && date.includes('T')) {
    const [datePart] = date.split('T')
    const [year, month, day] = datePart.split('-')
    return `${day}/${month}/${year}`
  }
  
  // Se for apenas YYYY-MM-DD
  const [year, month, day] = date.split('-')
  return `${day}/${month}/${year}`
}

// Uso:
formatDate("2025-11-20") // "20/11/2025"
```

## 📊 Fluxo Completo

```
Usuário escolhe no input: 20/11/2025
         ↓
Input retorna: "2025-11-20"
         ↓
convertDateToISO(): "2025-11-20"
         ↓
Salva no banco: "2025-11-20"
         ↓
Lê do banco: "2025-11-20"
         ↓
formatDate(): "20/11/2025"
         ↓
Exibe no CRUD: 20/11/2025 ✅
```

## 🗄️ Configuração do Banco de Dados

### PostgreSQL / Supabase

```sql
CREATE TABLE faturas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  data DATE NOT NULL,  -- Tipo DATE (sem hora)
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Importante:** Use o tipo `DATE` (não `TIMESTAMP`) para armazenar apenas a data.

## ❌ Erros Comuns

### Erro 1: Usar `new Date()`

```javascript
// ❌ ERRADO
const data = new Date(formData.data)
const dataISO = data.toISOString()
// Resultado: "2025-11-19T03:00:00.000Z" (dia mudou!)
```

### Erro 2: Adicionar horário desnecessário

```javascript
// ❌ ERRADO
const dataComHora = formData.data + "T00:00:00.000Z"
// Isso pode causar problemas dependendo do timezone
```

### Erro 3: Usar `toLocaleDateString()`

```javascript
// ❌ ERRADO para salvar
const data = new Date(formData.data)
const dataFormatada = data.toLocaleDateString('pt-BR')
// Resultado: "19/11/2025" (dia mudou!)
```

## ✅ Boas Práticas

### 1. Sempre valide o formato

```typescript
const dateRegex = /^\d{4}-\d{2}-\d{2}$/
if (!dateRegex.test(dateString)) {
  throw new Error('Formato inválido')
}
```

### 2. Use tipos corretos no banco

```sql
-- ✅ CORRETO
data DATE NOT NULL

-- ❌ EVITE (a menos que precise de hora)
data TIMESTAMP NOT NULL
```

### 3. Documente o formato esperado

```typescript
/**
 * @param dateString - Data no formato YYYY-MM-DD
 * @returns Data no formato DD/MM/YYYY
 */
export function formatDate(dateString: string): string {
  // ...
}
```

## 🧪 Testes

```typescript
// Teste 1: Conversão básica
expect(convertDateToISO("2025-11-20")).toBe("2025-11-20")

// Teste 2: Formatação para exibição
expect(formatDate("2025-11-20")).toBe("20/11/2025")

// Teste 3: Validação de formato inválido
expect(() => convertDateToISO("20/11/2025")).toThrow()

// Teste 4: Data vazia
expect(() => convertDateToISO("")).toThrow()
```

## 🌍 Funciona em Qualquer Timezone

Esta solução funciona em:
- ✅ Brasil (UTC-3)
- ✅ Portugal (UTC+0)
- ✅ Japão (UTC+9)
- ✅ Estados Unidos (UTC-5 a UTC-8)
- ✅ Qualquer lugar do mundo!

## 📚 Resumo

| Ação | ❌ Errado | ✅ Correto |
|------|-----------|------------|
| Salvar | `new Date(data).toISOString()` | `data` (YYYY-MM-DD) |
| Exibir | `new Date(data).toLocaleDateString()` | `formatDate(data)` |
| Tipo no Banco | `TIMESTAMP` | `DATE` |
| Conversão | Usar `Date` object | Manipular string diretamente |

## 🎉 Resultado Final

```
Escolhe: 20/11/2025 → Salva: 2025-11-20 → Exibe: 20/11/2025 ✅
Escolhe: 01/01/2026 → Salva: 2026-01-01 → Exibe: 01/01/2026 ✅
Escolhe: 31/12/2025 → Salva: 2025-12-31 → Exibe: 31/12/2025 ✅
```

**Sem mudança de dia. Sempre!** 🎯
