import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: any, res: any) {
  try {
    // Permitir CORS
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
      return res.status(200).end()
    }

    // Obter operation da query ou do body
    let operation = req.query.operation
    
    // Se não tiver na query e for POST, tentar obter do body
    if (!operation && req.method === 'POST' && req.body) {
      operation = req.body.operation
    }

    console.log('🔧 Operação PIX solicitada:', operation)

    switch (operation) {
      case 'check_status':
        return await handleCheckStatus(req, res)
      case 'update_status':
        return await handleUpdateStatus(req, res)
      case 'list_transactions':
        return await handleListTransactions(req, res)
      default:
        return res.status(400).json({ error: 'Operação inválida', operation })
    }
  } catch (error) {
    console.error('❌ Erro geral no handler:', error)
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    })
  }
}

async function handleCheckStatus(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { transactionId } = req.body

  if (!transactionId) {
    return res.status(400).json({ 
      success: false,
      error: 'Transaction ID is required' 
    })
  }

  console.log('🔍 Verificando status da transação:', transactionId)

  const { data: transaction, error } = await supabase
    .from('pix_transactions')
    .select('*')
    .eq('id', transactionId)
    .single()

  if (error) {
    console.error('❌ Erro ao buscar transação:', error)
    return res.status(404).json({
      success: false,
      error: 'Transação não encontrada'
    })
  }

  // Verificar se expirou
  if (transaction.status === 'pending' && transaction.expires_at) {
    const expiresAt = new Date(transaction.expires_at)
    const now = new Date()
    
    if (now > expiresAt) {
      console.log('⏰ Transação expirada')
      
      const { error: updateError } = await supabase
        .from('pix_transactions')
        .update({ 
          status: 'expired',
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId)

      if (!updateError) {
        transaction.status = 'expired'
      }
    }
  }

  return res.status(200).json({
    success: true,
    transaction: {
      id: transaction.id,
      status: transaction.status,
      amount: transaction.amount,
      created_at: transaction.created_at,
      expires_at: transaction.expires_at
    }
  })
}

async function handleUpdateStatus(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { transactionId, status } = req.body

  if (!transactionId || !status) {
    return res.status(400).json({ error: 'Transaction ID and status are required' })
  }

  if (!['pending', 'paid', 'expired', 'failed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' })
  }

  console.log('🔄 Atualizando status PIX:', { transactionId, status })

  const { data: transaction, error } = await supabase
    .from('pix_transactions')
    .update({ 
      status: status,
      updated_at: new Date().toISOString()
    })
    .eq('id', transactionId)
    .select()
    .single()

  if (error) {
    console.error('❌ Erro ao atualizar transação:', error)
    return res.status(500).json({ error: 'Erro ao atualizar transação' })
  }

  return res.status(200).json({
    success: true,
    transaction
  })
}

async function handleListTransactions(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, status, limit = 50 } = req.query

  let query = supabase
    .from('pix_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(parseInt(limit))

  if (userId) {
    query = query.eq('user_id', userId)
  }

  if (status) {
    query = query.eq('status', status)
  }

  const { data: transactions, error } = await query

  if (error) {
    console.error('❌ Erro ao listar transações:', error)
    return res.status(500).json({ error: 'Erro ao listar transações' })
  }

  return res.status(200).json({
    success: true,
    transactions
  })
}
