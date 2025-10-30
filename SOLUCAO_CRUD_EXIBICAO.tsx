/**
 * ========================================
 * SOLUÇÃO: Exibir Data no CRUD sem Timezone
 * ========================================
 * 
 * PROBLEMA:
 * - Banco salva: "2025-11-10"
 * - Console mostra: "2025-11-10"
 * - Painel exibe: "09/11/2025" ❌ (um dia antes!)
 * 
 * CAUSA:
 * A função de formatação estava usando new Date("2025-11-10")
 * que converte para timezone local (Brasil UTC-3)
 * 
 * SOLUÇÃO:
 * Manipular a string diretamente, sem converter para Date
 */

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Fatura {
  id: string
  invoice_number: string
  user_name: string
  amount: number
  due_date: string // "2025-11-10" (string YYYY-MM-DD)
  status: string
  description: string
}

export function CRUDFaturas() {
  const [faturas, setFaturas] = useState<Fatura[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFaturas()
  }, [])

  const loadFaturas = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      console.log('📦 Faturas do banco:', data)
      console.log('📅 Exemplo de data:', data[0]?.due_date)

      setFaturas(data || [])
    } catch (error) {
      console.error('Erro ao carregar faturas:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * ========================================
   * FUNÇÃO DE FORMATAÇÃO CORRETA
   * ========================================
   * 
   * ✅ Esta função NÃO usa new Date()
   * ✅ Manipula a string diretamente
   * ✅ Funciona em qualquer timezone
   */
  const formatarData = (dataString: string): string => {
    if (!dataString) return '-'

    // Se tiver horário (ex: "2025-11-10T12:00:00.000Z"), extrair apenas a data
    let datePart = dataString
    if (dataString.includes('T')) {
      datePart = dataString.split('T')[0]
    }

    // Validar formato YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(datePart)) {
      console.warn('Formato de data inválido:', dataString)
      return dataString // Retornar como está se não for válido
    }

    // Dividir e formatar
    const [year, month, day] = datePart.split('-')
    return `${day}/${month}/${year}`
  }

  if (loading) {
    return <div>Carregando...</div>
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Faturas</h1>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800">
            <th className="border p-2 text-left">Número</th>
            <th className="border p-2 text-left">Cliente</th>
            <th className="border p-2 text-left">Valor</th>
            <th className="border p-2 text-left">Vencimento</th>
            <th className="border p-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {faturas.map((fatura) => (
            <tr key={fatura.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
              <td className="border p-2">{fatura.invoice_number}</td>
              <td className="border p-2">{fatura.user_name}</td>
              <td className="border p-2">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(fatura.amount)}
              </td>
              <td className="border p-2">
                {/* ✅ AQUI: Usar a função de formatação correta */}
                {formatarData(fatura.due_date)}
              </td>
              <td className="border p-2">{fatura.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Debug: Mostrar dados brutos */}
      <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded">
        <h3 className="font-bold mb-2">🔍 Debug - Primeira Fatura:</h3>
        {faturas[0] && (
          <div className="text-sm space-y-1">
            <p>
              <strong>due_date (bruto):</strong> {faturas[0].due_date}
            </p>
            <p>
              <strong>due_date (formatado):</strong> {formatarData(faturas[0].due_date)}
            </p>
            <p>
              <strong>Tipo:</strong> {typeof faturas[0].due_date}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * ========================================
 * COMPARAÇÃO: ERRADO vs CORRETO
 * ========================================
 * 
 * ❌ ERRADO (causa mudança de dia):
 * 
 * const formatarData = (dataString: string) => {
 *   const data = new Date(dataString) // ❌ Converte para timezone local
 *   return data.toLocaleDateString('pt-BR')
 * }
 * 
 * Input: "2025-11-10"
 * Resultado: "09/11/2025" ❌ (um dia antes no Brasil UTC-3)
 * 
 * ✅ CORRETO (mantém o dia):
 * 
 * const formatarData = (dataString: string) => {
 *   const [year, month, day] = dataString.split('-')
 *   return `${day}/${month}/${year}`
 * }
 * 
 * Input: "2025-11-10"
 * Resultado: "10/11/2025" ✅ (dia correto)
 * 
 * ========================================
 * POR QUE ISSO ACONTECE?
 * ========================================
 * 
 * Quando você faz new Date("2025-11-10"):
 * 
 * 1. JavaScript interpreta como meia-noite LOCAL
 * 2. No Brasil (UTC-3): "2025-11-10T00:00:00-03:00"
 * 3. Ao converter para UTC: "2025-11-09T03:00:00.000Z"
 * 4. O dia muda de 10 para 09!
 * 
 * Solução: NÃO usar new Date() com strings de data
 * 
 * ========================================
 * ALTERNATIVA: Usar UTC Explicitamente
 * ========================================
 * 
 * Se você REALMENTE precisa usar Date object:
 * 
 * const formatarDataComUTC = (dataString: string) => {
 *   const [year, month, day] = dataString.split('-')
 *   const data = new Date(Date.UTC(
 *     parseInt(year),
 *     parseInt(month) - 1,
 *     parseInt(day)
 *   ))
 *   return data.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
 * }
 * 
 * Mas a solução com split é mais simples e eficiente!
 * 
 * ========================================
 * TESTES:
 * ========================================
 * 
 * console.log(formatarData("2025-11-10")) // "10/11/2025" ✅
 * console.log(formatarData("2025-01-01")) // "01/01/2025" ✅
 * console.log(formatarData("2025-12-31")) // "31/12/2025" ✅
 * console.log(formatarData("2025-11-10T12:00:00.000Z")) // "10/11/2025" ✅
 */

export default CRUDFaturas
