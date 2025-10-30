import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string | Date): string {
  // ✅ SOLUÇÃO: Nunca usar new Date() com strings de data
  // Manipular a string diretamente para evitar problemas de timezone
  
  if (typeof date === 'string') {
    // Se tiver horário (ISO completo), extrair apenas a data
    let datePart = date
    if (date.includes('T')) {
      datePart = date.split('T')[0]
    }
    
    // Validar formato YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (dateRegex.test(datePart)) {
      const [year, month, day] = datePart.split('-')
      return `${day}/${month}/${year}`
    }
  }
  
  // Fallback para Date objects (não recomendado para datas do banco)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}
