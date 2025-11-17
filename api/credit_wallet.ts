import { supabase } from '@/lib/supabase'

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, amount, description } = req.body

    if (!userId || !amount) {
      return res.status(400).json({ 
        error: 'userId e amount são obrigatórios' 
      })
    }

    console.log('💰 Creditando carteira:', { userId, amount, description })

    // Buscar saldo atual
    const { data: wallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('balance')
      .eq('user_id', userId)
      .single()

    if (walletError && walletError.code !== 'PGRST116') {
      throw walletError
    }

    const currentBalance = wallet?.balance || 0
    const newBalance = Number(currentBalance) + Number(amount)

    // Atualizar ou criar carteira
    const { data, error } = await supabase
      .from('user_wallets')
      .upsert({
        user_id: userId,
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // Registrar transação
    const { error: txError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: userId,
        amount: amount,
        previous_balance: currentBalance,
        new_balance: newBalance,
        description: description || 'Crédito de carteira',
        status: 'completed',
        created_at: new Date().toISOString()
      })

    if (txError) {
      console.error('⚠️ Erro ao registrar transação:', txError)
    }

    console.log('✅ Carteira creditada com sucesso!')

    return res.status(200).json({
      success: true,
      wallet: data,
      new_balance: newBalance
    })

  } catch (error: any) {
    console.error('❌ Erro ao creditar carteira:', error)
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
}
