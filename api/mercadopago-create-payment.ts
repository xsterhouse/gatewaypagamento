import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  )

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { transactionId, amount, description, externalReference } = req.body

    if (!transactionId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN

    if (!accessToken) {
      console.error('❌ MERCADO_PAGO_ACCESS_TOKEN not configured')
      return res.status(500).json({ error: 'Mercado Pago not configured' })
    }

    console.log('🔵 Creating PIX payment:', { transactionId, amount, description })

    // Criar pagamento PIX no Mercado Pago
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Idempotency-Key': externalReference
      },
      body: JSON.stringify({
        transaction_amount: amount,
        description: description || 'Depósito via PIX',
        payment_method_id: 'pix',
        payer: {
          email: 'cliente@dimpay.com.br' // Email genérico
        },
        external_reference: externalReference,
        notification_url: `${process.env.VERCEL_URL || 'https://app.dimpay.com.br'}/api/mercadopago/webhook`
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ Mercado Pago API error:', error)
      return res.status(response.status).json({ 
        error: 'Erro ao criar pagamento',
        details: error 
      })
    }

    const payment = await response.json()

    console.log('✅ PIX payment created:', payment.id)

    // Retornar dados do pagamento
    return res.status(200).json({
      id: payment.id,
      status: payment.status,
      qr_code: payment.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: payment.point_of_interaction?.transaction_data?.qr_code_base64,
      ticket_url: payment.point_of_interaction?.transaction_data?.ticket_url,
      expires_at: payment.date_of_expiration
    })
  } catch (error: any) {
    console.error('❌ Error creating PIX payment:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
}
