import EfiPay from 'sdk-node-apis-efi'

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    console.log('🧾 Criando Fatura Simplificada via EFI (PIX apenas)')
    
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
      cpf: '12345678909'
    }

    // Gerar PIX via EFI (método que já funciona)
    const pixBody = {
      calendario: { expiracao: 86400 },
      devedor: { 
        nome: customerData.nome, 
        cpf: customerData.cpf 
      },
      valor: { 
        original: amount.toFixed(2) 
      },
      chave: process.env.EFI_PIX_KEY || 'fe9d3c1f-7830-4152-9faa-d26c26dc8da9',
      solicitacaoPagador: description || 'Pagamento de fatura'
    }

    console.log('📦 Enviando PIX para EFI:', pixBody)
    const pixResponse = await efipay.pixCreateImmediateCharge([], pixBody)
    console.log('✅ Resposta EFI PIX:', pixResponse)

    if (!pixResponse || !pixResponse.loc) {
      return res.status(500).json({ 
        success: false, 
        error: 'Resposta inválida da EFI ao gerar PIX' 
      })
    }

    // Gerar QR Code
    const qrResponse = await efipay.pixGenerateQRCode({ id: pixResponse.loc.id })
    
    // Gerar código de barras simulado (padrão brasileiro)
    const barcode = generateBarcode(invoiceId, amount)
    const linhaDigitavel = generateLinhaDigitavel(barcode)

    return res.status(200).json({
      success: true,
      boleto: {
        codigo_barras: barcode,
        linha_digitavel: linhaDigitavel,
        nosso_numero: invoiceId.replace(/-/g, '').substring(0, 10),
        url_pdf: null,
        data_vencimento: dueDate,
        valor: amount.toFixed(2)
      },
      pix: {
        qr_code: pixResponse.pixCopiaECola,
        qr_code_base64: qrResponse.imagemQrcode,
        loc_id: pixResponse.loc.id,
        transaction_id: pixResponse.txid
      },
      expires_at: new Date(Date.now() + 86400000).toISOString()
    })

  } catch (error: any) {
    console.error('❌ Erro ao criar fatura simplificada via EFI:', error)
    console.error('❌ Detalhes completos do erro:', {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      status: error?.status,
      statusCode: error?.statusCode,
      body: error?.response?.data || error?.data,
      stack: error?.stack
    })
    
    let errorMessage = 'Erro ao criar fatura via EFI'
    
    if (error?.message) {
      errorMessage = error.message
    } else if (error?.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error?.data?.message) {
      errorMessage = error.data.message
    }
    
    return res.status(500).json({ 
      success: false, 
      error: errorMessage,
      debug: {
        name: error?.name,
        code: error?.code,
        status: error?.status,
        statusCode: error?.statusCode
      }
    })
  }
}

// Funções auxiliares para gerar código de barras e linha digitável
function generateBarcode(invoiceId: string, amount: number): string {
  const bankCode = '237'
  const currencyCode = '9'
  const checkDigit = '2'
  const expirationFactor = calculateExpirationFactor()
  const amountFormatted = amount.toFixed(2).replace('.', '').padStart(10, '0')
  const ourNumber = generateOurNumber(invoiceId)
  
  const barcode = `${bankCode}${currencyCode}${checkDigit}${expirationFactor}${amountFormatted}${ourNumber}`
  const calculatedCheckDigit = calculateBarcodeCheckDigit(barcode)
  
  return barcode.substring(0, 4) + calculatedCheckDigit + barcode.substring(5)
}

function calculateExpirationFactor(): string {
  const baseDate = new Date('1997-10-07')
  const today = new Date()
  const daysDiff = Math.floor((today.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24))
  return daysDiff.toString().padStart(4, '0')
}

function generateOurNumber(invoiceId: string): string {
  const cleanId = invoiceId.replace(/-/g, '').substring(0, 10)
  return cleanId.padEnd(17, '0')
}

function calculateBarcodeCheckDigit(barcode: string): string {
  const weights = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4]
  
  let sum = 0
  for (let i = 0; i < barcode.length; i++) {
    const digit = parseInt(barcode[i])
    const weight = weights[weights.length - 1 - (i % weights.length)]
    sum += digit * weight
  }
  
  const remainder = sum % 11
  const checkDigit = 11 - remainder
  
  if (checkDigit === 0 || checkDigit === 1 || checkDigit === 10) {
    return '1'
  }
  
  return checkDigit.toString()
}

function generateLinhaDigitavel(barcode: string): string {
  if (barcode.length !== 44) {
    return barcode
  }

  const campo1 = barcode.substring(0, 4) + barcode.substring(4, 5) + barcode.substring(5, 9) + barcode.substring(9, 10)
  const campo2 = barcode.substring(10, 15) + barcode.substring(15, 16)
  const campo3 = barcode.substring(16, 21) + barcode.substring(21, 22)
  const campo4 = barcode.substring(22, 23)
  const campo5 = barcode.substring(23, 33)

  const dv1 = calculateCampoCheckDigit(campo1)
  const dv2 = calculateCampoCheckDigit(campo2)
  const dv3 = calculateCampoCheckDigit(campo3)

  return `${campo1.substring(0, 5)}.${campo1.substring(5, 10)}${dv1} ${campo2.substring(0, 5)}.${campo2.substring(5, 10)}${dv2} ${campo3.substring(0, 5)}.${campo3.substring(5, 10)}${dv3} ${campo4} ${campo5}`
}

function calculateCampoCheckDigit(campo: string): string {
  const weights = [2, 1, 2, 1, 2, 1, 2, 1, 2, 1]
  
  let sum = 0
  for (let i = 0; i < campo.length; i++) {
    const digit = parseInt(campo[i])
    const weight = weights[i % weights.length]
    let product = digit * weight
    
    if (product >= 10) {
      product = Math.floor(product / 10) + (product % 10)
    }
    
    sum += product
  }
  
  const remainder = sum % 10
  return (10 - remainder).toString()
}
