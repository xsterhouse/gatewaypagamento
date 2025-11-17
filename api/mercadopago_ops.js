export default async function handler(req, res) {
  try {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
      return res.status(200).end()
    }

    // Obter operation
    let operation = req.query.operation
    
    if (!operation && req.method === 'POST' && req.body) {
      operation = req.body.operation
    }

    if (!operation && req.method === 'GET') {
      operation = 'test'
    }

    console.log('🔧 Operação:', operation)

    switch (operation) {
      case 'create_pix':
        return await handleCreatePix(req, res)
      case 'webhook':
        return await handleWebhook(req, res)
      case 'test':
        return await handleTest(req, res)
      default:
        return res.status(400).json({ error: 'Operação inválida' })
    }
  } catch (error) {
    console.error('❌ Erro:', error)
    return res.status(500).json({ 
      error: 'Erro interno',
      details: error.message
    })
  }
}

async function handleCreatePix(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🚀 Criando PIX')
    
    const { amount, description, transactionId, customer } = req.body
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN

    if (!accessToken) {
      return res.status(500).json({ 
        success: false,
        error: 'Token não configurado' 
      })
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
      notification_url: 'https://app.dimpay.com.br/api/mercadopago_ops?operation=webhook'
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
      console.error('❌ Erro MP:', data)
      
      let errorMessage = 'Erro ao criar pagamento'
      if (data.message) {
        errorMessage = data.message
      } else if (data.cause && Array.isArray(data.cause) && data.cause.length > 0) {
        errorMessage = data.cause[0].description || data.cause[0].message || errorMessage
      }
      
      return res.status(response.status).json({
        success: false,
        error: errorMessage
      })
    }

    const qrCode = data.point_of_interaction?.transaction_data?.qr_code
    const qrCodeBase64 = data.point_of_interaction?.transaction_data?.qr_code_base64

    if (!qrCode) {
      return res.status(500).json({
        success: false,
        error: 'QR Code não retornado'
      })
    }

    return res.status(200).json({
      success: true,
      id: data.id,
      qr_code: qrCode,
      qr_code_base64: qrCodeBase64,
      status: data.status,
      expires_at: data.date_of_expiration
    })

  } catch (error) {
    console.error('❌ Erro:', error)
    return res.status(500).json({
      success: false,
      error: 'Erro interno'
    })
  }
}

async function handleWebhook(req, res) {
  console.log('📨 Webhook recebido')
  return res.status(200).json({ success: true })
}

async function handleTest(req, res) {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN

  if (!accessToken) {
    return res.status(500).json({ 
      success: false,
      error: 'Token não configurado'
    })
  }

  try {
    const testResponse = await fetch('https://api.mercadopago.com/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    const userData = await testResponse.json()
    
    if (!testResponse.ok) {
      return res.status(400).json({
        success: false,
        error: 'Token inválido'
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Configuração OK',
      user: {
        id: userData.id,
        email: userData.email
      }
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Erro ao testar'
    })
  }
}
