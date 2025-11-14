import { supabase } from '@/lib/supabase'

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { transactionId, status } = req.body

    if (!transactionId || !status) {
      return res.status(400).json({ error: 'Transaction ID and status are required' })
    }

    if (!['pending', 'paid', 'expired', 'failed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    console.log('🔄 Atualizando status PIX:', { transactionId, status })

    // Atualizar transação
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
      return res.status(500).json({ error: 'Transaction not found' })
    }

    // Se status for 'paid', creditar na carteira do usuário
    if (status === 'paid') {
      const { error: walletError } = await supabase
        .from('user_wallets')
        .upsert({
          user_id: transaction.user_id,
          balance: transaction.amount,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        })

      if (walletError) {
        console.error('❌ Erro ao creditar carteira:', walletError)
        // Não falhar a atualização, apenas logar erro
      } else {
        console.log('💰 Carteira creditada com sucesso!')
      }
    }

    console.log('✅ Status atualizado:', transaction.status)

    return res.status(200).json({
      success: true,
      transaction: {
        id: transaction.id,
        status: transaction.status,
        amount: transaction.amount,
        updated_at: transaction.updated_at
      }
    })

  } catch (error: any) {
    console.error('❌ Erro ao atualizar status PIX:', error)
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
}
