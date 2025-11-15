import { createPixPayment } from '@/lib/efi-client'
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
    const response = await fetch('/api/efi_create_invoice', {
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

    const result = await response.json()
    console.log('✅ Resposta EFI Invoice:', result)

    if (!response.ok || !result.success) {
      console.error('❌ Erro ao gerar fatura EFI:', result.error)
      return {
        success: false,
        error: result.error || 'Erro ao gerar pagamento da fatura'
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
 * Gera código de barras no padrão brasileiro
 */
function generateBarcode(invoiceId: string, amount: number): string {
  // Formato simplificado de código de barras para fatura
  // Em produção, isso viria da API EFI de boletos
  const bankCode = '237' // Banco Bradesco (exemplo)
  const currencyCode = '9' // Real
  const checkDigit = '2'
  const expirationFactor = calculateExpirationFactor()
  const amountFormatted = amount.toFixed(2).replace('.', '').padStart(10, '0')
  const ourNumber = generateOurNumber(invoiceId)
  
  // Montar código de barras (44 dígitos)
  const barcode = `${bankCode}${currencyCode}${checkDigit}${expirationFactor}${amountFormatted}${ourNumber}`
  
  // Calcular dígito verificador
  const calculatedCheckDigit = calculateBarcodeCheckDigit(barcode)
  
  return barcode.substring(0, 4) + calculatedCheckDigit + barcode.substring(5)
}

/**
 * Calcula fator de vencimento (dias desde 07/10/1997)
 */
function calculateExpirationFactor(): string {
  const baseDate = new Date('1997-10-07')
  const today = new Date()
  const daysDiff = Math.floor((today.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24))
  return daysDiff.toString().padStart(4, '0')
}

/**
 * Gera nosso número (identificação da fatura)
 */
function generateOurNumber(invoiceId: string): string {
  // Usar os primeiros caracteres do UUID e completar com zeros
  const cleanId = invoiceId.replace(/-/g, '').substring(0, 10)
  return cleanId.padEnd(17, '0')
}

/**
 * Calcula dígito verificador do código de barras (módulo 11)
 */
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
