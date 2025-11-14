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

    // Verificar ambiente
    console.log('🔧 Ambiente:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasCertificate: !!certificateBase64,
      hasPixKey: !!process.env.EFI_PIX_KEY,
      sandbox: sandbox,
      nodeEnv: process.env.NODE_ENV
    })

    if (!clientId || !clientSecret || !certificateBase64) {
      console.error('❌ Credenciais faltando:', {
        clientId: !!clientId,
        clientSecret: !!clientSecret,
        certificateBase64: !!certificateBase64
      })
      return res.status(500).json({ 
        success: false, 
        error: 'Credenciais ou certificado da EFI não configurados' 
      })
    }

    // Tentar salvar certificado temporariamente
    let efipay
    let certificatePath = ''
    try {
      const fs = await import('fs')
      const path = await import('path')
      
      // Usar diretório temporário do sistema
      const os = await import('os')
      const tmpDir = os.tmpdir()
      certificatePath = path.join(tmpDir, 'efi-certificate.p12')
      
      console.log('💾 Salvando certificado em:', certificatePath)
      
      const certificateBuffer = Buffer.from(certificateBase64, 'base64')
      fs.writeFileSync(certificatePath, certificateBuffer)

      efipay = new EfiPay({ 
        client_id: clientId, 
        client_secret: clientSecret, 
        certificate: certificatePath, 
        sandbox 
      })
    } catch (certError: any) {
      console.error('❌ Erro ao salvar certificado:', certError)
      return res.status(500).json({ 
        success: false, 
        error: 'Erro ao processar certificado da EFI: ' + (certError?.message || certError?.toString() || 'Erro desconhecido')
      })
    }

    // Dados do cliente (padrão se não informado)
    const customerData = customer || {
      name: 'Cliente Dimpay',
      cpf: '12345678909',
      email: 'cliente@dimpay.com.br'
    }

    // Data de vencimento (padrão 3 dias se não informada)
    const dueDateCalculated = dueDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Corpo da requisição para cobrança PIX (não boleto tradicional)
    const body = {
      calendario: {
        expiracao: 86400 // 24 horas em segundos
      },
      devedor: {
        nome: customerData.name,
        cpf: customerData.cpf
      },
      valor: {
        original: amount.toFixed(2).replace('.', ',')
      },
      chave: process.env.EFI_PIX_KEY || 'fe9d3c1f-7830-4152-9faa-d26c26dc8da9',
      solicitacaoPagador: description || 'Pagamento via PIX'
    }

    console.log('📦 Enviando para EFI:', body)
    console.log('🔧 Config EFI:', { 
      hasClientId: !!clientId, 
      hasClientSecret: !!clientSecret, 
      hasCertificate: !!certificateBase64,
      sandbox,
      certificatePath: certificatePath 
    })

    // Criar cobrança (PIX)
    console.log('📡 Enviando requisição para EFI...')
    let response
    try {
      response = await efipay.pixCreateImmediateCharge([], body)
      console.log('✅ Resposta EFI recebida:', response)
    } catch (efiError: any) {
      console.error('❌ Erro na chamada EFI:', efiError)
      return res.status(500).json({ 
        success: false, 
        error: 'Erro na comunicação com EFI: ' + (efiError?.message || efiError?.toString() || 'Erro desconhecido')
      })
    }

    if (!response) {
      return res.status(500).json({ success: false, error: 'Resposta inválida da EFI' })
    }

    // Gerar QR Code para pagamento via PIX
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
        barcode: null, // EFI não gera código de barras para PIX
        linha_digitavel: null, // EFI não gera linha digitável para PIX
        pix_code: response.pixCopiaECola || null
      },
      files: {
        pdf_base64: null, // EFI não gera PDF para PIX
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
