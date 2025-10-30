/**
 * Utilitários para lidar com datas e evitar problemas de timezone
 */

/**
 * Converte uma data do input (YYYY-MM-DD) para ISO string
 * mantendo o dia correto independente do timezone
 * 
 * @param dateString - Data no formato YYYY-MM-DD (do input type="date")
 * @returns ISO string da data às 12:00 UTC
 */
export function convertDateToISO(dateString: string): string {
  if (!dateString) {
    throw new Error('Data inválida')
  }

  // Dividir a data em partes
  const [year, month, day] = dateString.split('-').map(Number)
  
  // Validar
  if (!year || !month || !day) {
    throw new Error('Formato de data inválido. Use YYYY-MM-DD')
  }

  // Criar a data diretamente em UTC às 12:00
  // Isso garante que o dia não mude independente do timezone
  const isoString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00.000Z`
  
  return isoString
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
