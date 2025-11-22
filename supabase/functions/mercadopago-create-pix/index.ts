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
    const { amount, description, transactionId, customer } = await req.json()

    // @ts-ignore: Deno types
    const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')

    if (!accessToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = {
      transaction_amount: amount,
      description: description,
      payment_method_id: 'pix',
      payer: {
        email: customer?.email || 'cliente@email.com',
        first_name: customer?.nome || 'Cliente',
        identification: customer?.cpf ? {
          type: customer.cpf.length === 11 ? 'CPF' : 'CNPJ',
          number: customer.cpf
        } : undefined
      },
      notification_url: `${
        // @ts-ignore: Deno types
        Deno.env.get('SUPABASE_URL')
      }/functions/v1/mercadopago-webhook`
    }

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Idempotency-Key': transactionId
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()

    if (!response.ok) {
      let errorMessage = 'Erro ao criar pagamento'
      if (data.message) {
        errorMessage = data.message
      } else if (data.cause && Array.isArray(data.cause) && data.cause.length > 0) {
        errorMessage = data.cause[0].description || data.cause[0].message || errorMessage
      }
      
      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const qrCode = data.point_of_interaction?.transaction_data?.qr_code
    const qrCodeBase64 = data.point_of_interaction?.transaction_data?.qr_code_base64

    if (!qrCode) {
      return new Response(
        JSON.stringify({ success: false, error: 'QR Code não retornado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        id: data.id,
        qr_code: qrCode,
        qr_code_base64: qrCodeBase64,
        status: data.status,
        expires_at: data.date_of_expiration
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      // @ts-ignore: error type
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
