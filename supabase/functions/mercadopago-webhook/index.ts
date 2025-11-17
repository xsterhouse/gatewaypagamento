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
