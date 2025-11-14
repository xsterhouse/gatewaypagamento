import EfiPay from 'sdk-node-apis-efi'

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { amount, description, customer, dueDate } = req.body
    console.log('🧾 Criando Boleto via EFI:', { amount, description, customer, dueDate })

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

    const efipay = new EfiPay({ 
      client_id: clientId, 
      client_secret: clientSecret, 
      certificate: certificatePath, 
      sandbox 
    })

    // Dados do cliente (padrão se não informado)
    const customerData = customer || {
      name: 'Cliente Dimpay',
      cpf: '12345678909',
      email: 'cliente@dimpay.com.br'
    }

    // Data de vencimento (padrão 3 dias se não informada)
    const dueDateCalculated = dueDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Corpo da requisição para boleto
    const body = {
      calendario: {
        dataDeVencimento: dueDateCalculated,
        validadeAposVencimento: 30
      },
      devedor: {
        nome: customerData.name,
        cpf: customerData.cpf,
        email: customerData.email
      },
      valor: {
        original: amount.toFixed(2).replace('.', ',')
      },
      chave: process.env.EFI_PIX_KEY || 'fe9d3c1f-7830-4152-9faa-d26c26dc8da9',
      solicitacaoPagador: description || 'Pagamento de Boleto'
    }

    console.log('📦 Enviando para EFI:', body)
    console.log('🔧 Config EFI:', { 
      hasClientId: !!clientId, 
      hasClientSecret: !!clientSecret, 
      hasCertificate: !!certificateBase64,
      sandbox,
      certificatePath: certificatePath 
    })

    // Criar cobrança (boleto)
    const response = await efipay.pixCreateImmediateCharge([], body)
    console.log('📡 Resposta EFI:', response)

    if (!response) {
      return res.status(500).json({ success: false, error: 'Resposta inválida da EFI' })
    }

    // Gerar PDF do boleto
    let pdfBase64 = null
    try {
      const pdfResponse = await efipay.pdfCharge({ id: response.loc.id })
      pdfBase64 = pdfResponse
    } catch (pdfError) {
      console.error('⚠️ Erro ao gerar PDF:', pdfError)
      // Continuar sem PDF
    }

    // Gerar QR Code para pagamento via PIX do boleto
    let qrCodeData = null
    try {
      const qrResponse = await efipay.pixGenerateQRCode({ id: response.loc.id })
      qrCodeData = {
        qr_code: response.pixCopiaECola,
        qr_code_base64: qrResponse.imagemQrcode
      }
    } catch (qrError) {
      console.error('⚠️ Erro ao gerar QR Code:', qrError)
      // Continuar sem QR Code
    }

    return res.status(200).json({
      success: true,
      charge: {
        id: response.txid,
        loc_id: response.loc.id,
        status: 'pending',
        amount: amount,
        description: description,
        due_date: dueDateCalculated,
        created_at: new Date().toISOString()
      },
      payment_codes: {
        barcode: response.codigoBarras || null,
        linha_digitavel: response.linhaDigitavel || null,
        pix_code: response.pixCopiaECola || null
      },
      files: {
        pdf_base64: pdfBase64,
        qr_code: qrCodeData
      },
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })

  } catch (error: any) {
    console.error('❌ Erro ao criar boleto via EFI:', error)
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Erro ao criar boleto via EFI' 
    })
  }
}
