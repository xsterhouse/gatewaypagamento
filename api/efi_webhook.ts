import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🪝 Webhook EFI recebido:', req.body)
    const { pix } = req.body

    if (!pix || !Array.isArray(pix)) {
      console.log('⚠️ Webhook sem dados de PIX')
      return res.status(200).json({ received: true })
    }

    for (const notification of pix) {
      const { txid, endToEndId } = notification
      console.log('🔍 Processando PIX:', { txid, endToEndId })

      const { data: transaction, error } = await supabase
        .from('pix_transactions')
        .select('*')
        .eq('pix_txid', txid)
        .single()

      if (error || !transaction) {
        console.log('⚠️ Transação não encontrada:', txid)
        continue
      }

      const { error: updateError } = await supabase
        .from('pix_transactions')
        .update({
          status: 'completed',
          pix_e2e_id: endToEndId,
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.id)

      if (updateError) {
        console.error('❌ Erro ao atualizar transação:', updateError)
        continue
      }

      const { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', transaction.user_id)
        .eq('currency_code', 'BRL')
        .single()

      if (wallet) {
        const newBalance = (wallet.balance || 0) + transaction.net_amount

        await supabase
          .from('wallets')
          .update({ balance: newBalance })
          .eq('id', wallet.id)

        await supabase
          .from('wallet_transactions')
          .insert({
            user_id: transaction.user_id,
            wallet_id: wallet.id,
            transaction_type: 'credit',
            amount: transaction.net_amount,
            balance_before: wallet.balance,
            balance_after: newBalance,
            description: `PIX recebido - ${transaction.description}`,
            reference_type: 'pix_deposit',
            reference_id: transaction.id
          })

        console.log('✅ Saldo creditado:', { user_id: transaction.user_id, amount: transaction.net_amount })
      }

      await supabase
        .from('notifications')
        .insert({
          user_id: transaction.user_id,
          title: 'PIX Recebido',
          message: `Seu PIX de R$ ${transaction.amount.toFixed(2)} foi confirmado!`,
          type: 'success',
          read: false
        })
    }

    console.log('✅ Webhook processado com sucesso')
    return res.status(200).json({ received: true })

  } catch (error: any) {
    console.error('❌ Erro ao processar webhook EFI:', error)
    return res.status(500).json({ error: error.message })
  }
}