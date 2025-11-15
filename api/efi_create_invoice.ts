import EfiPay from 'sdk-node-apis-efi'

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    console.log('🧾 Criando Fatura/Boleto via EFI')
    
    const { 
      amount, 
      description, 
      customer, 
      dueDate,
      invoiceId 
    } = req.body

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

    // Salvar certificado temporariamente
    const fs = await import('fs')
    const path = await import('path')
    const os = await import('os')
    
    const tmpDir = os.tmpdir()
    const certificatePath = path.join(tmpDir, 'efi-certificate.p12')
    
    const certificateBuffer = Buffer.from(certificateBase64, 'base64')
    fs.writeFileSync(certificatePath, certificateBuffer)

    const efipay = new EfiPay({ 
      client_id: clientId, 
      client_secret: clientSecret, 
      certificate: certificatePath, 
      sandbox 
    })

    // Dados do cliente
    const customerData = customer || {
      nome: 'Cliente Dimpay',
      cpf: '12345678909',
      email: 'cliente@dimpay.com.br'
    }

    // Data de vencimento
    const dueDateCalculated = dueDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Nosso número (identificação)
    const nossoNumero = invoiceId ? invoiceId.replace(/-/g, '').substring(0, 10) : 
                       `${Date.now()}${Math.random().toString(36).substring(7)}`.substring(0, 10)

    // Corpo da requisição para carnê (boleto tradicional)
    const body = {
      valor: amount.toFixed(2),
      nome: customerData.nome,
      cpf: customerData.cpf,
      dataVencimento: dueDateCalculated,
      numero: nossoNumero,
      descricao: description || 'Pagamento de fatura',
      multa: {
        valor: 0,
        tipo: 'percentual'
      },
      juros: {
        valor: 0,
        tipo: 'percentual'
      },
      desconto: {
        valor: 0,
        tipo: 'percentual'
      }
    }

    console.log('📦 Enviando para EFI:', body)

    // Gerar carnê/boleto via EFI
    const response = await efipay.sendCarnê([body])
    console.log('✅ Resposta EFI:', response)

    if (!response || !response.data || response.data.length === 0) {
      return res.status(500).json({ 
        success: false, 
        error: 'Resposta inválida da EFI ao gerar carnê' 
      })
    }

    const boletoData = response.data[0]

    // Gerar QR Code para pagamento PIX (alternativa)
    let qrCodeData = null
    try {
      const pixBody = {
        calendario: { expiracao: 86400 },
        devedor: { nome: customerData.nome, cpf: customerData.cpf },
        valor: { original: amount.toFixed(2) },
        chave: process.env.EFI_PIX_KEY,
        solicitacaoPagador: description || 'Pagamento via PIX'
      }

      const pixResponse = await efipay.pixCreateImmediateCharge([], pixBody)
      const qrResponse = await efipay.pixGenerateQRCode({ id: pixResponse.loc.id })
      
      qrCodeData = {
        qr_code: pixResponse.pixCopiaECola,
        qr_code_base64: qrResponse.imagemQrcode,
        loc_id: pixResponse.loc.id,
        transaction_id: pixResponse.txid
      }
    } catch (qrError) {
      console.error('⚠️ Erro ao gerar QR Code PIX:', qrError)
    }

    return res.status(200).json({
      success: true,
      boleto: {
        codigo_barras: boletoData.codigoBarras,
        linha_digitavel: boletoData.linhaDigitavel,
        nosso_numero: boletoData.nossoNumero,
        url_pdf: boletoData.urlPdf,
        data_vencimento: boletoData.dataVencimento,
        valor: boletoData.valor
      },
      pix: qrCodeData,
      expires_at: new Date(Date.now() + 86400000).toISOString()
    })

  } catch (error: any) {
    console.error('❌ Erro ao criar fatura via EFI:', error)
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Erro ao criar fatura via EFI' 
    })
  }
}
