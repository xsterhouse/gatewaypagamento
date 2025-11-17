import { supabase } from '@/lib/supabase'

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, status, limit = 50, offset = 0 } = req.query

    if (!userId) {
      return res.status(400).json({ 
        error: 'userId é obrigatório' 
      })
    }

    console.log('📋 Listando transações PIX:', { userId, status, limit, offset })

    let query = supabase
      .from('pix_transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1)

    // Aplicar filtro de status se fornecido
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query

    if (error) throw error

    console.log(`✅ Encontradas ${data?.length || 0} transações PIX`)

    return res.status(200).json({
      success: true,
      transactions: data || [],
      total: count || 0,
      limit: Number(limit),
      offset: Number(offset)
    })

  } catch (error: any) {
    console.error('❌ Erro ao listar transações PIX:', error)
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
}
