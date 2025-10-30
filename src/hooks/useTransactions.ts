import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface Transaction {
  id: string
  amount: number
  status: string
  payment_method: string
  customer_name: string | null
  customer_email: string | null
  description: string | null
  created_at: string
}

interface UseTransactionsOptions {
  status?: string
  limit?: number
  offset?: number
}

export function useTransactions(options: UseTransactionsOptions = {}) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [total, setTotal] = useState(0)

  const loadTransactions = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (options.status && options.status !== 'all') {
        query = query.eq('status', options.status)
      }

      if (options.limit) {
        query = query.limit(options.limit)
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
      }

      const { data, error: queryError, count } = await query

      if (queryError) throw queryError

      setTransactions(data || [])
      setTotal(count || 0)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTransactions()
  }, [options.status, options.limit, options.offset])

  return { transactions, loading, error, total, refetch: loadTransactions }
}
