import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { transactionId } = await req.json()

    if (!transactionId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Transaction ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: transaction, error } = await supabaseClient
      .from('pix_transactions')
      .select('*')
      .eq('id', transactionId)
      .single()

    if (error) {
      return new Response(
        JSON.stringify({ success: false, error: 'Transação não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar expiração
    if (transaction.status === 'pending' && transaction.expires_at) {
      const expiresAt = new Date(transaction.expires_at)
      const now = new Date()
      
      if (now > expiresAt) {
        await supabaseClient
          .from('pix_transactions')
          .update({ 
            status: 'expired',
            updated_at: new Date().toISOString()
          })
          .eq('id', transactionId)

        transaction.status = 'expired'
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        transaction: {
          id: transaction.id,
          status: transaction.status,
          amount: transaction.amount,
          created_at: transaction.created_at,
          expires_at: transaction.expires_at
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
