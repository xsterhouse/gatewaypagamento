/**
 * ========================================
 * SNIPPET: Função de Formatação de Data
 * ========================================
 * 
 * Copie e cole esta função no seu componente
 * ou adicione em src/lib/utils.ts
 */

/**
 * Formata data de YYYY-MM-DD para DD/MM/YYYY
 * SEM problemas de timezone
 * 
 * @param dateString - Data no formato "YYYY-MM-DD" ou "YYYY-MM-DDTHH:mm:ss.sssZ"
 * @returns Data formatada "DD/MM/YYYY"
 * 
 * @example
 * formatDate("2025-11-10") // "10/11/2025"
 * formatDate("2025-11-10T12:00:00.000Z") // "10/11/2025"
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '-'

  // Se tiver horário, extrair apenas a data
  let datePart = dateString
  if (dateString.includes('T')) {
    datePart = dateString.split('T')[0]
  }

  // Validar formato YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(datePart)) {
    return dateString // Retornar como está se inválido
  }

  // Dividir e formatar
  const [year, month, day] = datePart.split('-')
  return `${day}/${month}/${year}`
}

/**
 * ========================================
 * USO NO COMPONENTE:
 * ========================================
 */

// Exemplo 1: Em uma tabela
/*
<td>{formatDate(fatura.due_date)}</td>
*/

// Exemplo 2: Em um card
/*
<p>Vencimento: {formatDate(fatura.due_date)}</p>
*/

// Exemplo 3: Com fallback
/*
<span>{formatDate(fatura.due_date) || 'Sem data'}</span>
*/

/**
 * ========================================
 * VERSÃO INLINE (para uso rápido):
 * ========================================
 */

// Se você não quer criar uma função separada:
/*
<td>
  {fatura.due_date?.split('T')[0].split('-').reverse().join('/')}
</td>
*/

// Explicação da versão inline:
// 1. split('T')[0] → Remove horário se existir
// 2. split('-') → Divide em [year, month, day]
// 3. reverse() → Inverte para [day, month, year]
// 4. join('/') → Junta com "/" → "10/11/2025"

/**
 * ========================================
 * VERSÃO COM TRATAMENTO DE ERRO:
 * ========================================
 */

export function formatDateSafe(dateString: string | null | undefined): string {
  try {
    if (!dateString) return '-'

    let datePart = dateString
    if (dateString.includes('T')) {
      datePart = dateString.split('T')[0]
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(datePart)) {
      console.warn('Formato de data inválido:', dateString)
      return '-'
    }

    const [year, month, day] = datePart.split('-')
    return `${day}/${month}/${year}`
  } catch (error) {
    console.error('Erro ao formatar data:', error)
    return '-'
  }
}

/**
 * ========================================
 * TESTES RÁPIDOS:
 * ========================================
 */

// Copie e cole no console do navegador para testar:
/*
const formatDate = (dateString) => {
  if (!dateString) return '-'
  let datePart = dateString.includes('T') ? dateString.split('T')[0] : dateString
  const [year, month, day] = datePart.split('-')
  return `${day}/${month}/${year}`
}

console.log(formatDate("2025-11-10")) // "10/11/2025" ✅
console.log(formatDate("2025-11-10T12:00:00.000Z")) // "10/11/2025" ✅
console.log(formatDate("2025-01-01")) // "01/01/2025" ✅
console.log(formatDate("2025-12-31")) // "31/12/2025" ✅
*/

/**
 * ========================================
 * COMPARAÇÃO DE PERFORMANCE:
 * ========================================
 */

// ❌ LENTO (usa Date object):
function formatDateSlow(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR')
}

// ✅ RÁPIDO (manipula string):
function formatDateFast(dateString: string): string {
  const [year, month, day] = dateString.split('-')
  return `${day}/${month}/${year}`
}

// Diferença: ~10x mais rápido!
// Além de não ter problema de timezone 🎯
