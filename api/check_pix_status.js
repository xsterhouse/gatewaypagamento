const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { transactionId } = req.body

    if (!transactionId) {
      return res.status(400).json({ 
        success: false,
        error: 'Transaction ID is required' 
      })
    }

    console.log('🔍 Verificando status:', transactionId)

    const { data: transaction, error } = await supabase
      .from('pix_transactions')
      .select('*')
      .eq('id', transactionId)
      .single()

    if (error) {
      console.error('❌ Erro:', error)
      return res.status(404).json({
        success: false,
        error: 'Transação não encontrada'
      })
    }

    // Verificar expiração
    if (transaction.status === 'pending' && transaction.expires_at) {
      const expiresAt = new Date(transaction.expires_at)
      const now = new Date()
      
      if (now > expiresAt) {
        await supabase
          .from('pix_transactions')
          .update({ 
            status: 'expired',
            updated_at: new Date().toISOString()
          })
          .eq('id', transactionId)

        transaction.status = 'expired'
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

  } catch (error) {
    console.error('❌ Erro:', error)
    return res.status(500).json({
      success: false,
      error: 'Erro interno',
      details: error.message
    })
  }
}
