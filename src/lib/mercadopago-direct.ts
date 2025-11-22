/**
 * Cliente Mercado Pago - Chamadas via Backend
 * Usa endpoint do backend para evitar CORS
 */

export interface CreatePixPaymentParams {
  amount: number
  description: string
  transactionId: string
  customer?: {
    nome: string
    cpf: string
    email: string
  }
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
 * Usa endpoint do backend para evitar CORS
 */
export async function createPixPayment(params: CreatePixPaymentParams): Promise<PixPaymentResult> {
  try {
    console.log('🚀 Criando PIX via Supabase Edge Function:', params)

    const body = {
      amount: params.amount,
      description: params.description,
      transactionId: params.transactionId,
      customer: params.customer
    }

    console.log('📦 Request body:', body)

    // Usar Supabase Edge Function
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const response = await fetch(`${supabaseUrl}/functions/v1/mercadopago-create-pix`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(body)
    })

    console.log('📡 Status da resposta:', response.status)
    console.log('📡 Headers:', Object.fromEntries(response.headers.entries()))

    // Verificar se a resposta é JSON
    const contentType = response.headers.get('content-type')
    console.log('📄 Content-Type:', contentType)
    
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      console.error('❌ Resposta não é JSON!')
      console.error('📄 Content-Type recebido:', contentType)
      console.error('📄 Primeiros 500 caracteres:', text.substring(0, 500))
      console.error('📄 Resposta completa:', text)
      
      // Se for HTML, provavelmente é uma página de erro
      if (text.includes('<html') || text.includes('<!DOCTYPE')) {
        return {
          success: false,
          error: 'API do Mercado Pago retornou HTML em vez de JSON. Possível problema de CORS ou URL incorreta.'
        }
      }
      
      return {
        success: false,
        error: `Resposta inesperada da API (${response.status}): ${text.substring(0, 100)}`
      }
    }

    const data = await response.json()
    console.log('✅ Resposta Mercado Pago:', data)

    if (!response.ok) {
      console.error('❌ Erro Mercado Pago:', response.status, data)
      
      // Mensagens de erro mais claras
      let errorMsg = 'Erro ao criar pagamento PIX'
      if (response.status === 401) {
        errorMsg = 'Token do Mercado Pago inválido ou expirado'
      } else if (response.status === 400) {
        errorMsg = data.message || 'Dados inválidos enviados ao Mercado Pago'
      } else if (data.message) {
        errorMsg = data.message
      }
      
      return {
        success: false,
        error: errorMsg
      }
    }

    // Backend já retorna os dados formatados
    console.log('✅ PIX criado com sucesso!', {
      id: data.id,
      qr_code_length: data.qr_code?.length
    })

    return {
      success: data.success,
      qr_code: data.qr_code,
      qr_code_base64: data.qr_code_base64,
      id: data.id,
      expires_at: data.expires_at,
      error: data.error
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
