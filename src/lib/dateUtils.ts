/**
 * Utilitários para lidar com datas e evitar problemas de timezone
 */

/**
 * Converte uma data do input (YYYY-MM-DD) para o formato correto de salvamento
 * mantendo o dia correto independente do timezone
 * 
 * IMPORTANTE: Esta função garante que a data escolhida pelo usuário
 * seja EXATAMENTE a data salva no banco, sem mudança de dia.
 * 
 * @param dateString - Data no formato YYYY-MM-DD (do input type="date")
 * @returns String da data no formato YYYY-MM-DD (sem hora, sem timezone)
 * 
 * @example
 * // Usuário escolhe 20/11/2025 no input
 * convertDateToISO("2025-11-20") // Retorna: "2025-11-20"
 * // Salva no banco: "2025-11-20"
 * // Exibe no CRUD: "20/11/2025" ✅
 */
export function convertDateToISO(dateString: string): string {
  if (!dateString) {
    throw new Error('Data inválida')
  }

  // Validar formato YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateString)) {
    throw new Error('Formato de data inválido. Use YYYY-MM-DD')
  }

  // Retornar a data exatamente como está (YYYY-MM-DD)
  // NÃO adicionar horário, NÃO converter para Date object
  // Isso evita QUALQUER problema de timezone
  return dateString
}

/**
 * Converte uma data ISO string para o formato YYYY-MM-DD
 * para usar em input type="date"
 * 
 * @param isoString - Data em formato ISO
 * @returns Data no formato YYYY-MM-DD
 */
export function convertISOToDateInput(isoString: string): string {
  if (!isoString) return ''
  
  // Extrair apenas a parte da data (YYYY-MM-DD)
  // Isso evita problemas de timezone ao exibir
  const [datePart] = isoString.split('T')
  return datePart
}

/**
 * Formata uma data ISO para exibição em português (DD/MM/YYYY)
 * 
 * @param isoString - Data em formato ISO
 * @returns Data formatada DD/MM/YYYY
 */
export function formatDateForDisplay(isoString: string): string {
  if (!isoString) return ''
  
  // Extrair apenas a parte da data
  const [datePart] = isoString.split('T')
  const [year, month, day] = datePart.split('-')
  
  return `${day}/${month}/${year}`
}
