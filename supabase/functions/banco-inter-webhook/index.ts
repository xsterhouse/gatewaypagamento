// @ts-ignore: Deno types
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore: Deno types
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// @ts-ignore: Deno types
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      // @ts-ignore: Deno types
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore: Deno types
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Receber o payload do Banco Inter
    const payload = await req.json()
    console.log('Webhook recebido:', JSON.stringify(payload))

    // O Banco Inter envia um array de pix recebidos
    if (payload.pix && Array.isArray(payload.pix)) {
      for (const pix of payload.pix) {
        const txid = pix.txid
        const valor = pix.valor
        const endToEndId = pix.endToEndId
        const horario = pix.horario

        console.log(`Processando PIX: TxId=${txid}, Valor=${valor}`)

        // 2. Buscar a transação pelo txid
        // O txid do Inter corresponde ao pix_txid no nosso banco
        console.log(`🔍 Buscando transação com pix_txid: ${txid}`)
        const { data: transaction, error: searchError } = await supabaseClient
          .from('pix_transactions')
          .select('*')
          .eq('pix_txid', txid)
          .single()

        if (searchError || !transaction) {
          console.error(`❌ Transação não encontrada para TxId: ${txid}`)
          continue
        }

        // 3. Atualizar status para 'paid' e creditar carteira
        if (transaction.status !== 'paid') {
          console.log(`🔄 Atualizando transação ${transaction.id} para paid`)
          
          const { error: updateError } = await supabaseClient
            .from('pix_transactions')
            .update({
              status: 'paid',
              updated_at: new Date().toISOString(),
              metadata: {
                ...transaction.metadata,
                webhook_data: pix,
                paid_at: horario,
                end_to_end_id: endToEndId
              }
            })
            .eq('id', transaction.id)

          if (updateError) {
            console.error(`❌ Erro ao atualizar transação ${transaction.id}:`, updateError)
          } else {
            console.log(`✅ Transação ${transaction.id} atualizada para PAID com sucesso!`)
            
            // 4. Creditar saldo na carteira do usuário
            console.log('💰 Creditando valor na carteira...')
            
            // Buscar carteira BRL do usuário
            const { data: wallet } = await supabaseClient
              .from('wallets')
              .select('*')
              .eq('user_id', transaction.user_id)
              .eq('currency_code', 'BRL')
              .eq('is_active', true)
              .single()

            if (wallet) {
              const amount = parseFloat(transaction.amount)
              const feeAmount = parseFloat(transaction.fee_amount || '0')
              const netAmount = amount - feeAmount

              console.log(`💵 Valor: R$ ${amount}, Taxa: R$ ${feeAmount}, Líquido: R$ ${netAmount}`)

              // Atualizar saldo
              const { error: walletError } = await supabaseClient
                .from('wallets')
                .update({
                  balance: parseFloat(wallet.balance) + netAmount,
                  available_balance: parseFloat(wallet.available_balance) + netAmount,
                  updated_at: new Date().toISOString()
                })
                .eq('id', wallet.id)

              if (walletError) {
                console.error('❌ Erro ao atualizar carteira:', walletError)
              } else {
                console.log('✅ Saldo creditado com sucesso!')
                
                // Registrar transação no extrato
                await supabaseClient
                  .from('wallet_transactions')
                  .insert({
                    wallet_id: wallet.id,
                    user_id: wallet.user_id,
                    transaction_type: 'credit',
                    amount: netAmount,
                    balance_before: parseFloat(wallet.balance),
                    balance_after: parseFloat(wallet.balance) + netAmount,
                    description: `Depósito PIX - ${transaction.id.substring(0, 8)}`,
                    created_at: new Date().toISOString(),
                    metadata: {
                      pix_transaction_id: transaction.id,
                      txid: txid
                    }
                  })

                // Creditar taxa na carteira admin (se houver)
                if (feeAmount > 0) {
                  console.log('💼 Creditando taxa na carteira admin...')
                  
                  const { data: adminWallet } = await supabaseClient
                    .from('wallets')
                    .select('*')
                    .eq('wallet_name', 'Conta Mãe - Taxas Gateway')
                    .single()

                  if (adminWallet) {
                    await supabaseClient
                      .from('wallets')
                      .update({
                        balance: parseFloat(adminWallet.balance) + feeAmount,
                        available_balance: parseFloat(adminWallet.available_balance) + feeAmount,
                        updated_at: new Date().toISOString()
                      })
                      .eq('id', adminWallet.id)
                      
                    // Registrar transação de taxa
                    await supabaseClient
                      .from('wallet_transactions')
                      .insert({
                        wallet_id: adminWallet.id,
                        user_id: adminWallet.user_id,
                        transaction_type: 'credit',
                        amount: feeAmount,
                        balance_before: parseFloat(adminWallet.balance),
                        balance_after: parseFloat(adminWallet.balance) + feeAmount,
                        description: `Taxa PIX - Transação ${transaction.id}`,
                        created_at: new Date().toISOString()
                      })
                  }
                }
              }
            } else {
              console.error('⚠️ Carteira não encontrada para o usuário', transaction.user_id)
            }
          }
        } else {
          console.log(`⚠️ Transação ${transaction.id} já estava paga.`)
        }
      }
    }

    return new Response(JSON.stringify({ message: 'Webhook processado' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Erro no webhook:', error)
    return new Response(
      // @ts-ignore: error type
      JSON.stringify({ error: error.message }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
