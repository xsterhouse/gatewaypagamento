import { supabase } from '@/lib/supabase'

export interface InvoicePaymentData {
  amount: number
  description: string
  invoiceId: string
  customerName: string
  customerCpf: string
  dueDate: string
}

export interface InvoicePaymentResult {
  success: boolean
  qrCode?: string
  qrCodeBase64?: string
  barcode?: string
  linhaDigitavel?: string
  nossoNumero?: string
  locId?: string
  transactionId?: string
  expiresAt?: string
  error?: string
}

/**
 * Gera QR code e código de barras para fatura via API EFI
 */
export async function generateInvoicePayment(data: InvoicePaymentData): Promise<InvoicePaymentResult> {
  try {
    console.log('🧾 Gerando pagamento para fatura:', data)

    // Gerar fatura completa (boleto + PIX) via EFI
    const response = await fetch('/api/efi_create_invoice_simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: data.amount,
        description: data.description,
        customer: {
          nome: data.customerName,
          cpf: data.customerCpf
        },
        dueDate: data.dueDate,
        invoiceId: data.invoiceId
      })
    })

    console.log('📡 Resposta bruta da API:', response.status, response.statusText)
    
    const result = await response.json()
    console.log('✅ Resposta EFI Invoice:', result)

    if (!response.ok || !result.success) {
      console.error('❌ Erro ao gerar fatura EFI:', {
        status: response.status,
        statusText: response.statusText,
        error: result.error,
        debug: result.debug,
        fullResult: result
      })
      return {
        success: false,
        error: result.error || `Erro ${response.status}: ${response.statusText}`
      }
    }

    // Atualizar fatura no banco com os dados de pagamento
    await updateInvoiceWithPaymentData(data.invoiceId, {
      qr_code_data: result.pix?.qr_code,
      barcode: result.boleto?.codigo_barras,
      loc_id: result.pix?.loc_id,
      transaction_id: result.pix?.transaction_id,
      linha_digitavel: result.boleto?.linha_digitavel,
      nosso_numero: result.boleto?.nosso_numero,
      url_pdf: result.boleto?.url_pdf
    })

    return {
      success: true,
      qrCode: result.pix?.qr_code,
      qrCodeBase64: result.pix?.qr_code_base64,
      barcode: result.boleto?.codigo_barras,
      linhaDigitavel: result.boleto?.linha_digitavel,
      nossoNumero: result.boleto?.nosso_numero,
      locId: result.pix?.loc_id,
      transactionId: result.pix?.transaction_id,
      expiresAt: result.expires_at
    }

  } catch (error: any) {
    console.error('❌ Erro ao gerar pagamento da fatura:', error)
    return {
      success: false,
      error: error.message || 'Erro ao gerar pagamento da fatura'
    }
  }
}


/**
 * Atualiza fatura no banco com dados de pagamento
 */
async function updateInvoiceWithPaymentData(invoiceId: string, paymentData: {
  qr_code_data?: string
  barcode?: string
  loc_id?: string
  transaction_id?: string
  linha_digitavel?: string
  nosso_numero?: string
  url_pdf?: string
}) {
  try {
    const { error } = await supabase
      .from('invoices')
      .update({
        qr_code_data: paymentData.qr_code_data,
        barcode: paymentData.barcode,
        loc_id: paymentData.loc_id,
        transaction_id: paymentData.transaction_id,
        linha_digitavel: paymentData.linha_digitavel,
        nosso_numero: paymentData.nosso_numero,
        url_pdf: paymentData.url_pdf,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)

    if (error) {
      console.error('❌ Erro ao atualizar fatura com dados de pagamento:', error)
    } else {
      console.log('✅ Fatura atualizada com dados de pagamento')
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar fatura:', error)
  }
}

/**
 * Gera linha digitável a partir do código de barras
 */
export function generateLinhaDigitavel(barcode: string): string {
  if (barcode.length !== 44) {
    return barcode
  }

  // Formato: XXXXX.YYYYY.ZZZZZ.WWWWW.VVVVVVVVVVVV
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

/**
 * Calcula dígito verificador de cada campo da linha digitável
 */
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
