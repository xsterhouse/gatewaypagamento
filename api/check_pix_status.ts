import { supabase } from '@/lib/supabase'

export default async function handler(req: any, res: any) {
  // Permitir CORS
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

    console.log('🔍 Verificando status da transação:', transactionId)

    // Buscar transação no banco
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

    console.log('📊 Status encontrado:', transaction.status)

    // Verificar se a transação expirou
    if (transaction.status === 'pending' && transaction.expires_at) {
      const expiresAt = new Date(transaction.expires_at)
      const now = new Date()
      
      if (now > expiresAt) {
        console.log('⏰ Transação expirada')
        
        // Atualizar status para expirado
        const { error: updateError } = await supabase
          .from('pix_transactions')
          .update({ 
            status: 'expired',
            updated_at: new Date().toISOString()
          })
          .eq('id', transactionId)
          .select()
          .single()

        if (updateError) {
          console.error('❌ Erro ao atualizar para expirado:', updateError)
        } else {
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

  } catch (error) {
    console.error('❌ Erro ao verificar status:', error)
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}
