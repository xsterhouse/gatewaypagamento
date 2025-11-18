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
    const { amount, description, payer, due_date } = await req.json()

    // @ts-ignore: Deno types
    const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')

    if (!accessToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token do Mercado Pago não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calcular data de expiração
    const expirationDate = due_date ? new Date(due_date) : new Date()

    const body = {
      transaction_amount: amount,
      description,
      payment_method_id: 'bolbradesco',
      date_of_expiration: expirationDate.toISOString(),
      payer: {
        email: payer?.email || 'customer@example.com',
        first_name: payer?.name || 'Cliente',
        last_name: '',
        identification: payer?.document ? {
          type: payer.document.length === 11 ? 'CPF' : 'CNPJ',
          number: payer.document
        } : undefined,
        address: payer?.address ? {
          street_name: payer.address.street,
          street_number: payer.address.number,
          neighborhood: payer.address.neighborhood,
          city: payer.address.city,
          federal_unit: payer.address.state,
          zip_code: payer.address.zip_code
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
        'X-Idempotency-Key': `boleto-${Date.now()}-${Math.random().toString(36).substring(7)}`
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()

    if (!response.ok) {
      let errorMessage = 'Erro ao criar boleto'
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

    const barcode = data.barcode?.content
    const pdfUrl = data.transaction_details?.external_resource_url

    return new Response(
      JSON.stringify({
        success: true,
        id: data.id,
        barcode,
        digitable_line: barcode,
        pdf_url: pdfUrl,
        status: data.status,
        date_of_expiration: data.date_of_expiration
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
