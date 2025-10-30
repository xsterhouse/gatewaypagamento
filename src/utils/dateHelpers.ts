/**
 * ========================================
 * FUNÇÕES UTILITÁRIAS PARA DATAS
 * ========================================
 * 
 * Estas funções garantem que datas sejam manipuladas
 * SEM problemas de timezone
 */

/**
 * Valida se uma string está no formato YYYY-MM-DD
 * 
 * @param dateString - String a ser validada
 * @returns true se válida, false caso contrário
 * 
 * @example
 * isValidDateFormat("2025-11-20") // true
 * isValidDateFormat("20/11/2025") // false
 * isValidDateFormat("2025-13-01") // true (formato válido, mas mês inválido)
 */
export function isValidDateFormat(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  return regex.test(dateString)
}

/**
 * Converte data do formato YYYY-MM-DD para DD/MM/YYYY
 * 
 * ✅ IMPORTANTE: Esta função NÃO usa Date object
 * Apenas manipula a string, evitando problemas de timezone
 * 
 * @param dateISO - Data no formato YYYY-MM-DD
 * @returns Data no formato DD/MM/YYYY
 * 
 * @example
 * formatDateBR("2025-11-20") // "20/11/2025"
 * formatDateBR("2026-01-01") // "01/01/2026"
 */
export function formatDateBR(dateISO: string): string {
  if (!dateISO || !isValidDateFormat(dateISO)) {
    return ''
  }

  const [year, month, day] = dateISO.split('-')
  return `${day}/${month}/${year}`
}

/**
 * Converte data do formato DD/MM/YYYY para YYYY-MM-DD
 * 
 * @param dateBR - Data no formato DD/MM/YYYY
 * @returns Data no formato YYYY-MM-DD
 * 
 * @example
 * formatDateISO("20/11/2025") // "2025-11-20"
 * formatDateISO("01/01/2026") // "2026-01-01"
 */
export function formatDateISO(dateBR: string): string {
  if (!dateBR) return ''

  const [day, month, year] = dateBR.split('/')
  return `${year}-${month}-${day}`
}

/**
 * Extrai apenas a parte da data de uma string ISO completa
 * 
 * Útil quando o banco retorna "2025-11-20T12:00:00.000Z"
 * e você quer apenas "2025-11-20"
 * 
 * @param isoString - String ISO completa
 * @returns Apenas a parte da data (YYYY-MM-DD)
 * 
 * @example
 * extractDateFromISO("2025-11-20T12:00:00.000Z") // "2025-11-20"
 * extractDateFromISO("2025-11-20") // "2025-11-20"
 */
export function extractDateFromISO(isoString: string): string {
  if (!isoString) return ''

  // Se já estiver no formato YYYY-MM-DD, retornar como está
  if (isValidDateFormat(isoString)) {
    return isoString
  }

  // Se tiver horário (T), extrair apenas a data
  if (isoString.includes('T')) {
    const [datePart] = isoString.split('T')
    return datePart
  }

  return isoString
}

/**
 * Converte data para ISO string com horário meio-dia UTC
 * 
 * ⚠️ USE APENAS SE O BACKEND EXIGIR TIMESTAMP COMPLETO
 * 
 * Meio-dia UTC (12:00) garante que o dia não mude
 * em nenhum timezone do mundo (-12 a +14)
 * 
 * @param dateString - Data no formato YYYY-MM-DD
 * @returns ISO string com horário meio-dia UTC
 * 
 * @example
 * toISOWithNoonUTC("2025-11-20") // "2025-11-20T12:00:00.000Z"
 */
export function toISOWithNoonUTC(dateString: string): string {
  if (!dateString || !isValidDateFormat(dateString)) {
    throw new Error('Data inválida. Use formato YYYY-MM-DD')
  }

  return `${dateString}T12:00:00.000Z`
}

/**
 * Prepara data para salvamento no banco
 * 
 * ✅ RECOMENDADO: Retorna apenas YYYY-MM-DD (sem hora)
 * Use esta função para garantir que a data seja salva corretamente
 * 
 * @param dateString - Data do input (YYYY-MM-DD)
 * @returns Data pronta para salvar
 * 
 * @example
 * prepareDateForDB("2025-11-20") // "2025-11-20"
 */
export function prepareDateForDB(dateString: string): string {
  if (!dateString) {
    throw new Error('Data é obrigatória')
  }

  if (!isValidDateFormat(dateString)) {
    throw new Error('Formato de data inválido. Use YYYY-MM-DD')
  }

  // Retornar exatamente como está
  // NÃO converter para Date
  // NÃO adicionar horário
  return dateString
}

/**
 * Prepara data para exibição no input type="date"
 * 
 * @param dateValue - Data do banco (pode ser YYYY-MM-DD ou ISO completo)
 * @returns Data no formato YYYY-MM-DD para o input
 * 
 * @example
 * prepareDateForInput("2025-11-20T12:00:00.000Z") // "2025-11-20"
 * prepareDateForInput("2025-11-20") // "2025-11-20"
 */
export function prepareDateForInput(dateValue: string): string {
  if (!dateValue) return ''
  return extractDateFromISO(dateValue)
}

/**
 * ========================================
 * EXEMPLO DE USO COMPLETO
 * ========================================
 * 
 * // 1. SALVAR NO BANCO
 * const dataSelecionada = "2025-11-20" // Do input type="date"
 * const dataParaSalvar = prepareDateForDB(dataSelecionada)
 * 
 * await supabase.from('invoices').insert({
 *   due_date: dataParaSalvar // "2025-11-20"
 * })
 * 
 * // 2. CARREGAR DO BANCO
 * const { data } = await supabase.from('invoices').select('due_date')
 * const dataParaInput = prepareDateForInput(data[0].due_date)
 * 
 * <input type="date" value={dataParaInput} />
 * 
 * // 3. EXIBIR NA TELA
 * const dataFormatada = formatDateBR(data[0].due_date)
 * <p>Vencimento: {dataFormatada}</p> // "20/11/2025"
 * 
 * ========================================
 * POR QUE ISSO FUNCIONA?
 * ========================================
 * 
 * ❌ ERRADO (causa mudança de dia):
 * new Date("2025-11-20") → "2025-11-19T03:00:00.000Z" (Brasil)
 * 
 * ✅ CORRETO (mantém o dia):
 * "2025-11-20" → "2025-11-20" (sem conversão)
 * 
 * A chave é: NUNCA usar new Date() com strings de data!
 */
