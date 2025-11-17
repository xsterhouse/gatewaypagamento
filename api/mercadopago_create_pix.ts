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
    console.log('🚀 Criando PIX via MercadoPago')
    console.log('📋 Request body:', req.body)
    
    const { amount, description, transactionId, customer } = req.body

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN

    if (!accessToken) {
      console.error('❌ Token não configurado')
      return res.status(500).json({ 
        success: false,
        error: 'Token do Mercado Pago não configurado no servidor' 
      })
    }

    // Validar dados obrigatórios
    if (!amount || !description) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valor e descrição são obrigatórios' 
      })
    }

    // Validar amount
    const amountNum = Number(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valor deve ser um número maior que 0' 
      })
    }

    // Dados do cliente
    const customerData = customer || {
      nome: 'Cliente Gateway',
      cpf: '12345678909',
      email: 'cliente@dimpay.com.br'
    }

    console.log('👤 Customer data:', customerData)
    console.log('💰 Amount:', amountNum)
    console.log('📝 Description:', description)

    const body = {
      transaction_amount: amountNum,
      description: description || 'Pagamento PIX',
      payment_method_id: 'pix',
      payer: {
        email: customerData.email || 'cliente@dimpay.com.br',
        first_name: customerData.nome?.split(' ')[0] || 'Cliente',
        last_name: customerData.nome?.split(' ').slice(1).join(' ') || 'Gateway',
        identification: {
          type: 'CPF',
          number: customerData.cpf?.replace(/\D/g, '') || '12345678909'
        }
      },
      external_reference: transactionId,
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.dimpay.com.br'}/api/mercadopago`
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
      statusText: response.statusText,
      id: data.id,
      status_payment: data.status,
      message: data.message,
      error_detail: data.error || data.cause || data.details
    })

    if (!response.ok) {
      console.error('❌ Erro completo Mercado Pago:', {
        status: response.status,
        statusText: response.statusText,
        data: data,
        headers: Object.fromEntries(response.headers.entries())
      })
      
      // Extrair mensagem de erro mais detalhada
      let errorMessage = 'Erro ao criar pagamento'
      if (data.message) {
        errorMessage = data.message
      } else if (data.cause && Array.isArray(data.cause) && data.cause.length > 0) {
        errorMessage = data.cause[0].description || data.cause[0].message || errorMessage
      } else if (data.error) {
        errorMessage = data.error
      }
      
      return res.status(response.status).json({
        success: false,
        error: errorMessage,
        debug: {
          status: response.status,
          mercado_pago_data: data
        }
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
