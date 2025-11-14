import EfiPay from 'sdk-node-apis-efi'

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { amount, description, transactionId, pixKey } = req.body
    console.log('🚀 Criando PIX via EFI:', { amount, description, transactionId })

    const clientId = process.env.EFI_CLIENT_ID
    const clientSecret = process.env.EFI_CLIENT_SECRET
    const certificateBase64 = process.env.EFI_CERTIFICATE_BASE64
    const sandbox = process.env.EFI_SANDBOX === 'true'

    if (!clientId || !clientSecret || !certificateBase64) {
      return res.status(500).json({ success: false, error: 'Credenciais ou certificado da EFI não configurados' })
    }

    // Salvar certificado temporariamente
    const fs = await import('fs')
    
    const certificatePath = '/tmp/efi-certificate.p12'
    
    const certificateBuffer = Buffer.from(certificateBase64, 'base64')
    fs.writeFileSync(certificatePath, certificateBuffer)

    const efipay = new EfiPay({ client_id: clientId, client_secret: clientSecret, certificate: certificatePath, sandbox })
    const txid = transactionId || `${Date.now()}${Math.random().toString(36).substring(7)}`

    const body = {
      calendario: { expiracao: 3600 },
      devedor: { nome: 'Cliente Dimpay', cpf: '12345678909' },
      valor: { original: amount.toFixed(2) },
      chave: pixKey || process.env.EFI_PIX_KEY,
      solicitacaoPagador: description
    }

    console.log('📦 Enviando para EFI:', { txid, body })
    console.log('🔧 Config EFI:', { 
      hasClientId: !!clientId, 
      hasClientSecret: !!clientSecret, 
      hasCertificate: !!certificateBase64,
      sandbox,
      certificatePath: certificatePath 
    })

    const response = await efipay.pixCreateImmediateCharge([], body)
    console.log('📡 Resposta EFI:', response)

    if (!response || !response.loc) {
      return res.status(500).json({ success: false, error: 'Resposta inválida da EFI' })
    }

    const qrCodeResponse = await efipay.pixGenerateQRCode({ id: response.loc.id })

    return res.status(200).json({
      success: true,
      qr_code: response.pixCopiaECola,
      qr_code_base64: qrCodeResponse.imagemQrcode,
      id: response.txid,
      loc_id: response.loc.id,
      expires_at: new Date(Date.now() + 3600000).toISOString()
    })
  } catch (error: any) {
    console.error('❌ Erro ao criar PIX via EFI:', error)
    return res.status(500).json({ success: false, error: error.message || 'Erro ao criar PIX via EFI' })
  }
}