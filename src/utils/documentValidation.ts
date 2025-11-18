// ========================================
// VALIDAÇÃO DE DOCUMENTOS (CPF/CNPJ)
// ========================================

/**
 * Validar CPF
 */
export function validateCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  cpf = cpf.replace(/[^\d]/g, '')

  // Verifica se tem 11 dígitos
  if (cpf.length !== 11) return false

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpf)) return false

  // Validação do primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i)
  }
  let digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  if (digit !== parseInt(cpf.charAt(9))) return false

  // Validação do segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i)
  }
  digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  if (digit !== parseInt(cpf.charAt(10))) return false

  return true
}

/**
 * Validar CNPJ
 */
export function validateCNPJ(cnpj: string): boolean {
  // Remove caracteres não numéricos
  cnpj = cnpj.replace(/[^\d]/g, '')

  // Verifica se tem 14 dígitos
  if (cnpj.length !== 14) return false

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cnpj)) return false

  // Validação do primeiro dígito verificador
  let length = cnpj.length - 2
  let numbers = cnpj.substring(0, length)
  const digits = cnpj.substring(length)
  let sum = 0
  let pos = length - 7

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--
    if (pos < 2) pos = 9
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(0))) return false

  // Validação do segundo dígito verificador
  length = length + 1
  numbers = cnpj.substring(0, length)
  sum = 0
  pos = length - 7

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--
    if (pos < 2) pos = 9
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(1))) return false

  return true
}

/**
 * Validar CPF ou CNPJ
 */
export function validateDocument(document: string): {
  valid: boolean
  type: 'cpf' | 'cnpj' | null
  error?: string
} {
  const cleaned = document.replace(/[^\d]/g, '')

  if (cleaned.length === 11) {
    const valid = validateCPF(cleaned)
    return {
      valid,
      type: 'cpf',
      error: valid ? undefined : 'CPF inválido'
    }
  }

  if (cleaned.length === 14) {
    const valid = validateCNPJ(cleaned)
    return {
      valid,
      type: 'cnpj',
      error: valid ? undefined : 'CNPJ inválido'
    }
  }

  return {
    valid: false,
    type: null,
    error: 'Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos'
  }
}

/**
 * Formatar CPF
 */
export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/[^\d]/g, '')
  if (cleaned.length !== 11) return cpf
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

/**
 * Formatar CNPJ
 */
export function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/[^\d]/g, '')
  if (cleaned.length !== 14) return cnpj
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

/**
 * Formatar documento (CPF ou CNPJ)
 */
export function formatDocument(document: string): string {
  const cleaned = document.replace(/[^\d]/g, '')
  
  if (cleaned.length === 11) {
    return formatCPF(cleaned)
  }
  
  if (cleaned.length === 14) {
    return formatCNPJ(cleaned)
  }
  
  return document
}

/**
 * Formatar CEP
 */
export function formatCEP(cep: string): string {
  const cleaned = cep.replace(/[^\d]/g, '')
  if (cleaned.length !== 8) return cep
  return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2')
}

/**
 * Validar email
 */
export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}
