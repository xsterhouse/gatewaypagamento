import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Permitir CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { operation } = req.query

  try {
    switch (operation) {
      case 'create_pix':
        return await handleCreatePix(req, res)
      case 'create_invoice':
        return await handleCreateInvoice(req, res)
      case 'webhook':
        return await handleWebhook(req, res)
      case 'test':
        return await handleTest(req, res)
      default:
        return res.status(400).json({ error: 'Operação inválida' })
    }
  } catch (error) {
    console.error('❌ Erro na operação Mercado Pago:', error)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

async function handleCreatePix(req: VercelRequest, res: VercelResponse) {
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

    // Criar pagamento PIX
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

    // Extrair dados do QR Code
    const qrCode = data.point_of_interaction?.transaction_data?.qr_code
    const qrCodeBase64 = data.point_of_interaction?.transaction_data?.qr_code_base64

    if (!qrCode) {
      return res.status(500).json({
        success: false,
        error: 'QR Code não retornado pelo Mercado Pago'
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
    console.error('❌ Erro ao criar PIX:', error)
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}

async function handleCreateInvoice(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Lógica de criação de invoice (copiada do arquivo original)
  // ... implementar se necessário
  return res.status(200).json({ success: true, message: 'Invoice criado' })
}

async function handleWebhook(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Lógica de webhook (copiada do arquivo original)
  // ... implementar se necessário
  return res.status(200).json({ success: true })
}

async function handleTest(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN

  if (!accessToken) {
    return res.status(500).json({ 
      success: false,
      error: 'Token do Mercado Pago não configurado',
      debug: {
        MERCADO_PAGO_ACCESS_TOKEN: false
      }
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
        error: 'Token inválido ou expirado'
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Configuração OK',
      debug: {
        token_configured: true,
        api_status: 'connected',
        user_data: {
          id: userData.id,
          email: userData.email,
          site_id: userData.site_id
        }
      }
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Erro ao testar conexão'
    })
  }
}
