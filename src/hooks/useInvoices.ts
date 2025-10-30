import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface Invoice {
  id: string
  amount: number
  due_date: string
  status: string
  created_at: string
}

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadInvoices = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: queryError } = await supabase
        .from('invoices')
        .select('*')
        .order('due_date', { ascending: false })

      if (queryError) throw queryError

      setInvoices(data || [])
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvoices()
  }, [])

  return { invoices, loading, error, refetch: loadInvoices }
}
