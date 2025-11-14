import EfiPay from 'sdk-node-apis-efi'

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { amount, pixKey, pixKeyType, description, transactionId } = req.body
    console.log('💸 Enviando PIX via EFI:', { amount, pixKey, pixKeyType })

    const clientId = process.env.EFI_CLIENT_ID
    const clientSecret = process.env.EFI_CLIENT_SECRET
    const certificatePath = process.env.EFI_CERTIFICATE_PATH || '/tmp/efi-certificate.p12'
    const sandbox = process.env.EFI_SANDBOX === 'true'

    if (!clientId || !clientSecret) {
      return res.status(500).json({ success: false, error: 'Credenciais da EFI não configuradas' })
    }

    const efipay = new EfiPay({ client_id: clientId, client_secret: clientSecret, certificate: certificatePath, sandbox })
    const idEnvio = transactionId || `E${Date.now()}${Math.random().toString(36).substring(7)}`

    const body = {
      valor: amount.toFixed(2),
      pagador: {
        chave: process.env.EFI_PIX_KEY || '',
        infoPagador: description || ''
      },
      favorecido: {
        chave: pixKey
      }
    }

    console.log(' Enviando PIX:', { idEnvio, body })
    const response = await efipay.pixSend({ idEnvio }, body)
    console.log(' Resposta EFI:', response)

    if (!response || response.status !== 'REALIZADO') {
      return res.status(500).json({
        success: false,
        error: 'Falha ao enviar PIX - Status: ' + (response?.status || 'desconhecido')
      })
    }

    return res.status(200).json({
      success: true,
      e2e_id: response.e2eId,
      transaction_id: idEnvio,
      status: response.status
    })
  } catch (error: any) {
    console.error(' Erro ao enviar PIX via EFI:', error)
    return res.status(500).json({ success: false, error: error.message || 'Erro ao enviar PIX via EFI' })
  }
}