import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
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
        // Nota: O txid do Inter é o que usamos para identificar a transação
        const { data: transaction, error: searchError } = await supabaseClient
          .from('pix_transactions')
          .select('*')
          .eq('transaction_id', txid) // Assumindo que transaction_id guarda o txid
          .single()

        if (searchError || !transaction) {
          console.error(`Transação não encontrada para TxId: ${txid}`)
          continue
        }

        // 3. Atualizar status para 'completed'
        if (transaction.status !== 'completed') {
          const { error: updateError } = await supabaseClient
            .from('pix_transactions')
            .update({
              status: 'completed',
              end_to_end_id: endToEndId,
              updated_at: new Date().toISOString(),
              metadata: {
                ...transaction.metadata,
                webhook_data: pix,
                paid_at: horario
              }
            })
            .eq('id', transaction.id)

          if (updateError) {
            console.error(`Erro ao atualizar transação ${transaction.id}:`, updateError)
          } else {
            console.log(`Transação ${transaction.id} atualizada para COMPLETED com sucesso!`)
          }
        } else {
          console.log(`Transação ${transaction.id} já estava concluída.`)
        }
      }
    }

    return new Response(JSON.stringify({ message: 'Webhook processado' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Erro no webhook:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
