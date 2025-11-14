import EfiPay from 'sdk-node-apis-efi'

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { pixKey } = req.body
    console.log('🔧 Configurando webhook EFI para chave:', pixKey)

    const clientId = process.env.EFI_CLIENT_ID
    const clientSecret = process.env.EFI_CLIENT_SECRET
    const certificateBase64 = process.env.EFI_CERTIFICATE_BASE64
    const sandbox = process.env.EFI_SANDBOX === 'true'

    if (!clientId || !clientSecret || !certificateBase64) {
      return res.status(500).json({ 
        success: false, 
        error: 'Credenciais ou certificado da EFI não configurados' 
      })
    }

    if (!pixKey) {
      return res.status(400).json({ 
        success: false, 
        error: 'pixKey é obrigatório' 
      })
    }

    // Salvar certificado temporariamente
    const fs = await import('fs')
    const certificatePath = '/tmp/efi-certificate.p12'
    const certificateBuffer = Buffer.from(certificateBase64, 'base64')
    fs.writeFileSync(certificatePath, certificateBuffer)

    const efipay = new EfiPay({ 
      client_id: clientId, 
      client_secret: clientSecret, 
      certificate: certificatePath, 
      sandbox 
    })

    // Configurar webhook
    const webhookUrl = 'https://app.dimpay.com.br/api/efi_webhook'
    
    const params = {
      chave: pixKey
    }

    const body = {
      webhookUrl: webhookUrl
    }

    console.log('📡 Enviando configuração de webhook:', { params, body })
    const response = await efipay.pixConfigWebhook(params, body)
    console.log('✅ Webhook configurado:', response)

    return res.status(200).json({
      success: true,
      message: 'Webhook configurado com sucesso',
      webhookUrl: webhookUrl,
      pixKey: pixKey,
      response: response
    })

  } catch (error: any) {
    console.error('❌ Erro ao configurar webhook EFI:', error)
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Erro ao configurar webhook EFI',
      details: error.response?.data || error
    })
  }
}
