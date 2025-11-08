import { supabase } from '@/lib/supabase'
import { pixProcessorService } from './pixProcessorService'
import { bankAcquirerService } from './bankAcquirerService'

// ========================================
// TIPOS E INTERFACES
// ========================================

export interface WebhookEvent {
  type: string
  transaction_id: string
  user_id: string
  amount: number
  description?: string
  e2e_id?: string
  metadata?: Record<string, any>
}

export interface WebhookValidation {
  valid: boolean
  error?: string
}

// ========================================
// SERVIÇO DE WEBHOOKS
// ========================================

class WebhookService {
  
  /**
   * Processar webhook de PIX do banco
   */
  async processPixWebhook(
    acquirerId: string,
    signature: string,
    payload: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🪝 Processando webhook PIX:', { acquirerId, payload })
      
      // 1. Buscar adquirente
      const acquirer = await bankAcquirerService.getAcquirerById(acquirerId)
      if (!acquirer) {
        return { success: false, error: 'Adquirente não encontrado' }
      }
      
      // 2. Validar assinatura do webhook
      const validation = await this.validateWebhookSignature(
        acquirer.webhook_secret || '',
        signature,
        payload
      )
      
      if (!validation.valid) {
        console.error('❌ Assinatura inválida:', validation.error)
        return { success: false, error: 'Assinatura inválida' }
      }
      
      // 3. Processar evento baseado no tipo
      const event = this.parseWebhookEvent(payload)
      if (!event) {
        return { success: false, error: 'Formato de evento inválido' }
      }
      
      // 4. Processar no pixProcessorService
      await pixProcessorService.processWebhook(acquirer, event)
      
      // 5. Registrar webhook recebido
      await this.logWebhook(acquirerId, event.type, payload, true)
      
      console.log('✅ Webhook processado com sucesso')
      return { success: true }
      
    } catch (error: any) {
      console.error('❌ Erro ao processar webhook:', error)
      
      // Registrar erro
      await this.logWebhook(acquirerId, 'error', payload, false, error.message)
      
      return { success: false, error: error.message }
    }
  }
  
  /**
   * Validar assinatura do webhook
   */
  private async validateWebhookSignature(
    secret: string,
    signature: string,
    payload: any
  ): Promise<WebhookValidation> {
    try {
      // Se não há secret configurado, aceitar (modo desenvolvimento)
      if (!secret || secret === '') {
        console.warn('⚠️ Webhook sem validação de assinatura (desenvolvimento)')
        return { valid: true }
      }
      
      // Gerar hash HMAC-SHA256 do payload
      const payloadString = JSON.stringify(payload)
      const encoder = new TextEncoder()
      const data = encoder.encode(payloadString)
      const keyData = encoder.encode(secret)
      
      // Importar chave
      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )
      
      // Gerar assinatura
      const signatureBuffer = await crypto.subtle.sign('HMAC', key, data)
      const signatureArray = Array.from(new Uint8Array(signatureBuffer))
      const signatureHex = signatureArray
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
      
      // Comparar assinaturas
      const isValid = signatureHex === signature
      
      if (!isValid) {
        return {
          valid: false,
          error: 'Assinatura não corresponde'
        }
      }
      
      return { valid: true }
      
    } catch (error: any) {
      console.error('Erro ao validar assinatura:', error)
      return {
        valid: false,
        error: error.message
      }
    }
  }
  
  /**
   * Parsear evento do webhook
   */
  private parseWebhookEvent(payload: any): WebhookEvent | null {
    try {
      // Formato genérico - adaptar conforme o banco
      return {
        type: payload.event || payload.type || 'unknown',
        transaction_id: payload.transaction_id || payload.txid,
        user_id: payload.user_id || payload.customer_id,
        amount: parseFloat(payload.amount || payload.value || '0'),
        description: payload.description || payload.message,
        e2e_id: payload.e2e_id || payload.end_to_end_id,
        metadata: payload.metadata || {}
      }
    } catch (error) {
      console.error('Erro ao parsear evento:', error)
      return null
    }
  }
  
  /**
   * Registrar webhook recebido (log)
   */
  private async logWebhook(
    acquirerId: string,
    eventType: string,
    payload: any,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    try {
      await supabase.from('webhook_logs').insert({
        acquirer_id: acquirerId,
        event_type: eventType,
        payload: payload,
        success: success,
        error_message: errorMessage,
        processed_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Erro ao registrar log de webhook:', error)
    }
  }
  
  /**
   * Confirmar PIX manualmente (para testes ou quando webhook falha)
   */
  async manualConfirmPix(
    transactionId: string,
    e2eId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔧 Confirmação manual de PIX:', transactionId)
      
      // Buscar transação
      const { data: transaction, error } = await supabase
        .from('pix_transactions')
        .select('*')
        .eq('id', transactionId)
        .single()
      
      if (error || !transaction) {
        return { success: false, error: 'Transação não encontrada' }
      }
      
      // Verificar se já está completa
      if (transaction.status === 'completed') {
        return { success: false, error: 'Transação já confirmada' }
      }
      
      // Criar evento simulado
      const event: WebhookEvent = {
        type: 'pix.completed',
        transaction_id: transactionId,
        user_id: transaction.user_id,
        amount: transaction.amount,
        description: transaction.description,
        e2e_id: e2eId
      }
      
      // Processar como se fosse webhook
      const acquirer = await bankAcquirerService.getAcquirerById(transaction.acquirer_id)
      if (!acquirer) {
        return { success: false, error: 'Adquirente não encontrado' }
      }
      
      await pixProcessorService.processWebhook(acquirer, event)
      
      console.log('✅ PIX confirmado manualmente')
      return { success: true }
      
    } catch (error: any) {
      console.error('❌ Erro na confirmação manual:', error)
      return { success: false, error: error.message }
    }
  }
  
  /**
   * Buscar logs de webhooks
   */
  async getWebhookLogs(
    acquirerId?: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('webhook_logs')
        .select('*')
        .order('processed_at', { ascending: false })
        .limit(limit)
      
      if (acquirerId) {
        query = query.eq('acquirer_id', acquirerId)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar logs:', error)
      return []
    }
  }
}

// Exportar instância única
export const webhookService = new WebhookService()
