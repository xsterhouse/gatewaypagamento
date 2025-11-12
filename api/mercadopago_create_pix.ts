import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Permitir CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { amount, description, transactionId } = req.body

    console.log('🚀 Criando PIX via backend:', { amount, description, transactionId })

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.VITE_MERCADO_PAGO_ACCESS_TOKEN

    if (!accessToken) {
      console.error('❌ Token não configurado')
      return res.status(500).json({ 
        success: false,
        error: 'Token do Mercado Pago não configurado no servidor' 
      })
    }

    const body = {
      transaction_amount: amount,
      description: description,
      payment_method_id: 'pix',
      payer: {
        email: 'cliente@dimpay.com.br'
      },
      external_reference: transactionId,
      notification_url: `${process.env.VERCEL_URL || req.headers.host}/api/mercadopago/webhook`
    }

    console.log('📦 Enviando para Mercado Pago:', body)

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

    console.log('📡 Resposta Mercado Pago:', {
      status: response.status,
      id: data.id,
      status_payment: data.status
    })

    if (!response.ok) {
      console.error('❌ Erro Mercado Pago:', data)
      return res.status(response.status).json({
        success: false,
        error: data.message || 'Erro ao criar pagamento'
      })
    }

    // Extrair dados do QR Code
    const qrCode = data.point_of_interaction?.transaction_data?.qr_code
    const qrCodeBase64 = data.point_of_interaction?.transaction_data?.qr_code_base64
    const expiresAt = data.date_of_expiration

    if (!qrCode) {
      console.error('❌ QR Code não encontrado na resposta')
      return res.status(500).json({
        success: false,
        error: 'QR Code não gerado pelo Mercado Pago'
      })
    }

    console.log('✅ PIX criado com sucesso!')

    return res.status(200).json({
      success: true,
      qr_code: qrCode,
      qr_code_base64: qrCodeBase64,
      id: String(data.id),
      expires_at: expiresAt
    })

  } catch (error: any) {
    console.error('❌ Erro ao criar PIX:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao criar pagamento PIX'
    })
  }
}
