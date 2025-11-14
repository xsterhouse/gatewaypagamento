import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // LOG IMEDIATO - ANTES DE QUALQUER COISA
  console.log('🚀🚀🚀 EFI WEBHOOK INICIADO - PRIMEIRO LOG')
  console.log('📋 Timestamp:', new Date().toISOString())
  console.log('📋 Method:', req.method)
  console.log('📋 URL:', req.url)

  try {
    // Headers para compatibilidade com EFI
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
      return res.status(200).end()
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    // Validar variáveis de ambiente primeiro
    console.log('🔍 ENV CHECK:', {
      hasUrl: !!process.env.VITE_SUPABASE_URL,
      hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      url: process.env.VITE_SUPABASE_URL?.substring(0, 20) + '...'
    })

    if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Missing Supabase environment variables')
      return res.status(500).json({ 
        error: 'Configuration error',
        details: 'Missing database configuration'
      })
    }

    // Inicializar Supabase DENTRO do handler
    console.log('📦 Carregando Supabase...')
    const { createClient } = require('@supabase/supabase-js')
    console.log('✅ Supabase carregado')
    
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    console.log('✅ Cliente Supabase criado')

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