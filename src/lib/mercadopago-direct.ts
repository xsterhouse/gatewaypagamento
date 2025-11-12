/**
 * Cliente Mercado Pago - Chamadas Diretas
 * Usa a API do Mercado Pago diretamente do frontend
 */

const MERCADO_PAGO_ACCESS_TOKEN = import.meta.env.VITE_MERCADO_PAGO_ACCESS_TOKEN || 'hxE568qqSBPbyCoTQtmS5rO6l0GCyzjI'

export interface CreatePixPaymentParams {
  amount: number
  description: string
  transactionId: string
}

export interface PixPaymentResult {
  success: boolean
  qr_code?: string
  qr_code_base64?: string
  id?: string
  expires_at?: string
  error?: string
}

/**
 * Criar pagamento PIX via Mercado Pago
 */
export async function createPixPayment(params: CreatePixPaymentParams): Promise<PixPaymentResult> {
  try {
    console.log('🚀 Criando PIX no Mercado Pago:', params)

    // Verificar se o token está configurado
    if (!MERCADO_PAGO_ACCESS_TOKEN || MERCADO_PAGO_ACCESS_TOKEN === 'hxE568qqSBPbyCoTQtmS5rO6l0GCyzjI') {
      console.error('❌ Token do Mercado Pago não configurado!')
      return {
        success: false,
        error: 'Token do Mercado Pago não configurado. Configure VITE_MERCADO_PAGO_ACCESS_TOKEN no arquivo .env'
      }
    }

    const body = {
      transaction_amount: params.amount,
      description: params.description,
      payment_method_id: 'pix',
      payer: {
        email: 'cliente@dimpay.com.br'
      },
      external_reference: params.transactionId,
      notification_url: window.location.origin + '/api/mercadopago/webhook'
    }

    console.log('📦 Request body:', body)
    console.log('🔑 Token length:', MERCADO_PAGO_ACCESS_TOKEN.length)

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        'X-Idempotency-Key': params.transactionId
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    console.log('✅ Resposta Mercado Pago:', data)

    if (!response.ok) {
      console.error('❌ Erro Mercado Pago:', response.status, data)
      return {
        success: false,
        error: data.message || `HTTP ${response.status}: ${JSON.stringify(data)}`
      }
    }

    // Extrair dados do QR Code
    const qrCode = data.point_of_interaction?.transaction_data?.qr_code
    const qrCodeBase64 = data.point_of_interaction?.transaction_data?.qr_code_base64
    const expiresAt = data.date_of_expiration

    if (!qrCode) {
      console.error('❌ QR Code não encontrado na resposta')
      return {
        success: false,
        error: 'QR Code não gerado pelo Mercado Pago'
      }
    }

    console.log('✅ PIX criado com sucesso!', {
      id: data.id,
      status: data.status,
      qr_code_length: qrCode?.length
    })

    return {
      success: true,
      qr_code: qrCode,
      qr_code_base64: qrCodeBase64,
      id: String(data.id),
      expires_at: expiresAt
    }

  } catch (error: any) {
    console.error('❌ Erro ao criar PIX:', error)
    
    // Erro de rede/CORS
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Erro de conexão com Mercado Pago. Verifique sua conexão com a internet ou se o token está correto.'
      }
    }
    
    return {
      success: false,
      error: error.message || 'Erro ao criar pagamento PIX'
    }
  }
}
