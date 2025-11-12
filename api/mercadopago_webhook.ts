import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Mercado Pago testa o webhook com GET primeiro
  if (req.method === 'GET') {
    console.log('✅ Webhook GET test from Mercado Pago')
    return res.status(200).json({ 
      status: 'ok',
      message: 'Webhook endpoint is ready' 
    })
  }

  // Processar notificações POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🔔 Webhook received from Mercado Pago')
    console.log('Headers:', req.headers)
    console.log('Body:', req.body)

    const { type, action, data } = req.body

    // Mercado Pago envia notificações de diferentes tipos
    // Pode ser type: "payment" ou action: "payment.created", "payment.updated"
    if (type === 'payment' || action?.startsWith('payment.')) {
      const paymentId = data?.id

      console.log('💳 Payment notification:', paymentId)

      // Buscar detalhes do pagamento
      const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN

      if (!accessToken) {
        console.error('❌ MERCADO_PAGO_ACCESS_TOKEN not configured')
        return res.status(500).json({ error: 'Mercado Pago not configured' })
      }

      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        console.error('❌ Error fetching payment details')
        return res.status(500).json({ error: 'Error fetching payment details' })
      }

      const payment = await response.json()

      console.log('📊 Payment details:', {
        id: payment.id,
        status: payment.status,
        amount: payment.transaction_amount,
        external_reference: payment.external_reference
      })

      // Buscar transação no banco (usando pix_txid que armazena o ID do Mercado Pago)
      const { data: transaction, error: txError } = await supabase
        .from('pix_transactions')
        .select('*')
        .eq('pix_txid', paymentId.toString())
        .single()

      if (txError || !transaction) {
        console.error('❌ Transaction not found for payment:', paymentId)
        console.error('Error:', txError)
        // Retornar 200 para evitar retry do Mercado Pago
        return res.status(200).json({ 
          received: true,
          message: 'Transaction not found in database' 
        })
      }

      console.log('✅ Transaction found:', transaction.id)

      // Atualizar status da transação
      let newStatus = 'pending'
      
      if (payment.status === 'approved') {
        newStatus = 'completed'
        
        // Creditar saldo do usuário
        console.log('💰 Crediting user balance:', {
          userId: transaction.user_id,
          amount: transaction.net_amount
        })

        const { error: balanceError } = await supabase.rpc('update_user_balance', {
          p_user_id: transaction.user_id,
          p_amount: transaction.net_amount,
          p_operation: 'add'
        })

        if (balanceError) {
          console.error('❌ Error updating balance:', balanceError)
        } else {
          console.log('✅ Balance updated successfully')
        }
      } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
        newStatus = 'failed'
      } else if (payment.status === 'in_process') {
        newStatus = 'processing'
      }

      // Atualizar transação
      const { error: updateError } = await supabase
        .from('pix_transactions')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', transaction.id)

      if (updateError) {
        console.error('❌ Error updating transaction:', updateError)
        return res.status(500).json({ error: 'Error updating transaction' })
      }

      console.log('✅ Transaction updated:', {
        id: transaction.id,
        status: newStatus
      })

      return res.status(200).json({ success: true })
    }

    // Outros tipos de notificação
    console.log('ℹ️ Unhandled notification type:', type)
    return res.status(200).json({ success: true })
  } catch (error: any) {
    console.error('❌ Webhook error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
}