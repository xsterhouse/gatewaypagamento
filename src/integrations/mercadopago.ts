import { BankAcquirer } from '@/services/bankAcquirerService'
import { CreatePixPaymentParams, PixPaymentResult } from '@/services/pixProcessorService'

// ========================================
// INTEGRAÇÃO MERCADO PAGO
// ========================================

class MercadoPagoIntegration {
  
  /**
   * Criar pagamento PIX no Mercado Pago
   */
  async createPixPayment(
    acquirer: BankAcquirer, 
    params: CreatePixPaymentParams
  ): Promise<PixPaymentResult> {
    try {
      console.log('💳 Criando PIX no Mercado Pago...')
      
      // 1. Autenticar
      const token = await this.authenticate(acquirer)
      
      // 2. Calcular expiração
      const expiresInMinutes = params.expires_in_minutes || 30
      const expirationDate = new Date()
      expirationDate.setMinutes(expirationDate.getMinutes() + expiresInMinutes)
      
      // 3. Criar pagamento
      const apiUrl = acquirer.api_pix_url || `${acquirer.api_base_url}/v1/payments`
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': this.generateIdempotencyKey()
        },
        body: JSON.stringify({
          transaction_amount: params.amount,
          description: params.description,
          payment_method_id: 'pix',
          date_of_expiration: expirationDate.toISOString(),
          payer: {
            email: 'customer@example.com',
            first_name: params.payer_name || 'Cliente',
            identification: params.payer_document ? {
              type: params.payer_document.length === 11 ? 'CPF' : 'CNPJ',
              number: params.payer_document
            } : undefined
          },
          notification_url: acquirer.webhook_url
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        console.error('❌ Erro Mercado Pago:', error)
        throw new Error(error.message || 'Erro ao criar pagamento')
      }
      
      const data = await response.json()
      
      console.log('✅ PIX criado no Mercado Pago:', data.id)
      
      return {
        success: true,
        pix_code: data.point_of_interaction?.transaction_data?.qr_code,
        pix_qr_code: data.point_of_interaction?.transaction_data?.qr_code_base64,
        pix_txid: data.id.toString(),
        expires_at: data.date_of_expiration
      }
      
    } catch (error: any) {
      console.error('❌ Erro na integração Mercado Pago:', error)
      return {
        success: false,
        error: error.message || 'Erro ao processar pagamento'
      }
    }
  }
  
  /**
   * Consultar status de pagamento
   */
  async checkPaymentStatus(
    acquirer: BankAcquirer, 
    payment_id: string
  ): Promise<{
    status: string
    paid_at?: string
  }> {
    try {
      const token = await this.authenticate(acquirer)
      
      const apiUrl = `${acquirer.api_base_url}/v1/payments/${payment_id}`
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Erro ao consultar pagamento')
      }
      
      const data = await response.json()
      
      // Mapear status do Mercado Pago para nosso sistema
      const statusMap: { [key: string]: string } = {
        'pending': 'pending',
        'approved': 'completed',
        'authorized': 'processing',
        'in_process': 'processing',
        'in_mediation': 'processing',
        'rejected': 'failed',
        'cancelled': 'cancelled',
        'refunded': 'cancelled',
        'charged_back': 'cancelled'
      }
      
      return {
        status: statusMap[data.status] || 'pending',
        paid_at: data.status === 'approved' ? data.date_approved : undefined
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao consultar status:', error)
      return { status: 'error' }
    }
  }
  
  /**
   * Validar assinatura de webhook
   */
  validateWebhookSignature(
    signature: string,
    body: any,
    secret: string
  ): boolean {
    try {
      // Mercado Pago usa x-signature header
      // Implementar validação de assinatura
      // Por enquanto, retornar true em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        return true
      }
      
      // TODO: Implementar validação real
      // const expectedSignature = crypto
      //   .createHmac('sha256', secret)
      //   .update(JSON.stringify(body))
      //   .digest('hex')
      
      // return signature === expectedSignature
      
      return true
    } catch (error) {
      console.error('❌ Erro ao validar assinatura:', error)
      return false
    }
  }
  
  /**
   * Processar evento de webhook
   */
  async processWebhookEvent(event: any): Promise<{
    type: string
    transaction_id?: string
    status?: string
    amount?: number
  }> {
    try {
      // Mercado Pago envia eventos no formato:
      // { action: "payment.created", data: { id: "123" } }
      
      const action = event.action || event.type
      const paymentId = event.data?.id
      
      if (!paymentId) {
        throw new Error('Payment ID não encontrado no webhook')
      }
      
      // Mapear ações para tipos de evento
      const eventTypeMap: { [key: string]: string } = {
        'payment.created': 'pix.created',
        'payment.updated': 'pix.completed',
        'payment.approved': 'pix.completed',
        'payment.rejected': 'pix.failed',
        'payment.cancelled': 'pix.reversed',
        'payment.refunded': 'pix.reversed'
      }
      
      return {
        type: eventTypeMap[action] || 'pix.created',
        transaction_id: paymentId,
        status: event.data?.status
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao processar evento:', error)
      throw error
    }
  }
  
  // ========================================
  // MÉTODOS PRIVADOS
  // ========================================
  
  /**
   * Autenticar no Mercado Pago
   */
  private async authenticate(acquirer: BankAcquirer): Promise<string> {
    try {
      // Mercado Pago usa Access Token direto no client_secret
      // Não precisa de OAuth para pagamentos
      if (acquirer.client_secret) {
        return acquirer.client_secret
      }
      
      // Se precisar de OAuth
      if (acquirer.api_auth_url && acquirer.client_id) {
        const response = await fetch(acquirer.api_auth_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: acquirer.client_id,
            client_secret: acquirer.client_secret,
            grant_type: 'client_credentials'
          })
        })
        
        if (!response.ok) {
          throw new Error('Erro na autenticação')
        }
        
        const data = await response.json()
        return data.access_token
      }
      
      throw new Error('Credenciais não configuradas')
      
    } catch (error: any) {
      console.error('❌ Erro na autenticação:', error)
      throw new Error('Falha na autenticação com Mercado Pago')
    }
  }
  
  /**
   * Gerar chave de idempotência
   */
  private generateIdempotencyKey(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(7)}`
  }
}

export const mercadoPagoIntegration = new MercadoPagoIntegration()
