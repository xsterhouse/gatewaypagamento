// @ts-ignore: Deno types
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// @ts-ignore: Deno types
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log('📨 Webhook recebido:', JSON.stringify(body, null, 2))

    // Mercado Pago envia notificações de pagamento
    if (body.type === 'payment' && body.data?.id) {
      const paymentId = body.data.id
      console.log('💳 Payment ID:', paymentId)

      // Buscar detalhes do pagamento no Mercado Pago
      // @ts-ignore: Deno types
      const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')
      
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      const payment = await mpResponse.json()
      console.log('💰 Payment details:', JSON.stringify(payment, null, 2))
      
      // Identificar tipo de pagamento
      const paymentMethod = payment.payment_method_id
      const isBoleto = paymentMethod && paymentMethod.startsWith('bol')
      console.log(`📋 Tipo de pagamento: ${isBoleto ? 'Boleto' : 'PIX'}`)

      // Atualizar status no banco
      const supabaseClient = createClient(
        // @ts-ignore: Deno types
        Deno.env.get('SUPABASE_URL') ?? '',
        // @ts-ignore: Deno types
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // Buscar transação pelo payment_id do Mercado Pago
      // Tentar múltiplas formas de buscar
      console.log('🔍 Buscando transação com payment_id:', paymentId)
      
      // Busca 1: Por pix_txid (campo direto)
      let { data: transactions } = await supabaseClient
        .from('pix_transactions')
        .select('*')
        .eq('pix_txid', paymentId.toString())

      console.log('📊 Busca por pix_txid:', transactions?.length || 0, 'resultados')
      
      // Busca 2: Por metadata se não encontrou
      if (!transactions || transactions.length === 0) {
        const { data: metadataTransactions } = await supabaseClient
          .from('pix_transactions')
          .select('*')
          .contains('metadata', { mercadopago_payment_id: paymentId })
        
        if (metadataTransactions && metadataTransactions.length > 0) {
          transactions = metadataTransactions
          console.log('📊 Encontrado por metadata:', transactions.length)
        }
      }
      
      // Busca 3: Se não encontrou, buscar por ID direto (caso seja o ID da transação)
      if (!transactions || transactions.length === 0) {
        const { data: directTransaction } = await supabaseClient
          .from('pix_transactions')
          .select('*')
          .eq('id', paymentId.toString())
          .single()
        
        if (directTransaction) {
          transactions = [directTransaction]
          console.log('📊 Encontrado por ID direto')
        }
      }

      const transaction = transactions && transactions.length > 0 ? transactions[0] : null

      // Se não encontrou em pix_transactions, buscar em invoices_boletos
      if (!transaction) {
        console.log('🔍 Buscando em invoices_boletos...')
        const { data: invoice } = await supabaseClient
          .from('invoices_boletos')
          .select('*')
          .eq('mercadopago_payment_id', paymentId.toString())
          .single()

        if (invoice && payment.status === 'approved') {
          console.log('📄 Fatura encontrada, processando pagamento...')
          
          // Chamar função para processar pagamento
          const { error: processError } = await supabaseClient
            .rpc('process_invoice_payment', {
              p_invoice_id: invoice.id,
              p_payment_id: paymentId.toString(),
              p_paid_amount: payment.transaction_amount
            })

          if (processError) {
            console.error('❌ Erro ao processar pagamento da fatura:', processError)
          } else {
            console.log('✅ Pagamento da fatura processado com sucesso!')
          }
        }
      }

      if (transaction) {
        let newStatus = 'pending'
        
        if (payment.status === 'approved') {
          newStatus = 'paid'
        } else if (payment.status === 'cancelled' || payment.status === 'rejected') {
          newStatus = 'failed'
        } else if (payment.status === 'expired') {
          newStatus = 'expired'
        }

        console.log(`🔄 Atualizando transação ${transaction.id} de ${transaction.status} para ${newStatus}`)

        const { error: updateError } = await supabaseClient
          .from('pix_transactions')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.id)

        if (updateError) {
          console.error('❌ Erro ao atualizar:', updateError)
        } else {
          console.log('✅ Status atualizado com sucesso!')
          
          // Se foi aprovado, creditar na carteira
          if (newStatus === 'paid' && transaction.status !== 'paid') {
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
                
                // Creditar taxa na carteira admin
                if (feeAmount > 0) {
                  console.log('💼 Creditando taxa na carteira admin...')
                  
                  const { data: adminWallet } = await supabaseClient
                    .from('wallets')
                    .select('*')
                    .eq('wallet_name', 'Conta Mãe - Taxas Gateway')
                    .single()

                  if (adminWallet) {
                    const { error: adminWalletError } = await supabaseClient
                      .from('wallets')
                      .update({
                        balance: parseFloat(adminWallet.balance) + feeAmount,
                        available_balance: parseFloat(adminWallet.available_balance) + feeAmount,
                        updated_at: new Date().toISOString()
                      })
                      .eq('id', adminWallet.id)

                    if (adminWalletError) {
                      console.error('❌ Erro ao creditar taxa admin:', adminWalletError)
                    } else {
                      console.log('✅ Taxa creditada na carteira admin!')
                      
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
                  } else {
                    console.log('⚠️ Carteira admin não encontrada')
                  }
                }
              }
            } else {
              console.log('⚠️ Carteira não encontrada para o usuário')
            }
          }
        }
      } else {
        console.log('⚠️ Transação não encontrada no banco')
        console.log('🔍 Payment ID recebido:', paymentId)
        console.log('🔍 Tipo:', typeof paymentId)
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erro no webhook:', error)
    return new Response(
      // @ts-ignore: error type
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
