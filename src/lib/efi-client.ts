/**
 * Cliente EFI - Chamadas via Backend
 */

export interface CreatePixPaymentParams {
  amount: number
  description: string
  transactionId: string
  pixKey?: string
}

export interface PixPaymentResult {
  success: boolean
  qr_code?: string
  qr_code_base64?: string
  id?: string
  loc_id?: string
  expires_at?: string
  error?: string
}

export interface SendPixParams {
  amount: number
  pixKey: string
  pixKeyType: string
  description?: string
  transactionId: string
}

export interface SendPixResult {
  success: boolean
  e2e_id?: string
  transaction_id?: string
  status?: string
  error?: string
}

/**
 * Criar pagamento PIX via EFI
 */
export async function createPixPayment(params: CreatePixPaymentParams): Promise<PixPaymentResult> {
  try {
    console.log('🚀 Criando PIX via EFI:', params)

    const response = await fetch('/api/efi_create_pix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    })

    const contentType = response.headers.get('content-type')
    
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      console.error('❌ Resposta não é JSON:', text.substring(0, 500))
      
      return {
        success: false,
        error: 'Resposta inesperada da API EFI'
      }
    }

    const data = await response.json()
    console.log('✅ Resposta EFI:', data)

    if (!response.ok) {
      console.error('❌ Erro EFI:', response.status, data)
      
      return {
        success: false,
        error: data.error || 'Erro ao criar pagamento PIX'
      }
    }

    return data

  } catch (error: any) {
    console.error('❌ Erro ao criar PIX via EFI:', error)
    
    return {
      success: false,
      error: error.message || 'Erro ao criar pagamento PIX'
    }
  }
}

/**
 * Enviar PIX via EFI
 */
export async function sendPix(params: SendPixParams): Promise<SendPixResult> {
  try {
    console.log('💸 Enviando PIX via EFI:', params)

    const response = await fetch('/api/efi_send_pix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    })

    const contentType = response.headers.get('content-type')
    
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      console.error('❌ Resposta não é JSON:', text.substring(0, 500))
      
      return {
        success: false,
        error: 'Resposta inesperada da API EFI'
      }
    }

    const data = await response.json()
    console.log('✅ Resposta EFI:', data)

    if (!response.ok) {
      console.error('❌ Erro EFI:', response.status, data)
      
      return {
        success: false,
        error: data.error || 'Erro ao enviar PIX'
      }
    }

    return data

  } catch (error: any) {
    console.error('❌ Erro ao enviar PIX via EFI:', error)
    
    return {
      success: false,
      error: error.message || 'Erro ao enviar PIX'
    }
  }
}