import { supabase } from '@/lib/supabase'
import { bankAcquirerService, BankAcquirer, PixTransaction } from './bankAcquirerService'
import { mercadoPagoIntegration } from '@/integrations/mercadopago'
import { walletService } from './walletService'
import { notificationService } from './notificationService'
import { systemFeeService } from './systemFeeService'

// ========================================
// TIPOS E INTERFACES
// ========================================

export interface CreatePixPaymentParams {
  amount: number
  description: string
  user_id: string
  acquirer_id?: string // Se não informar, usa o padrão
  payer_name?: string
  payer_document?: string
  expires_in_minutes?: number
}

export interface PixPaymentResult {
  success: boolean
  transaction_id?: string
  pix_code?: string
  pix_qr_code?: string
  pix_txid?: string
  expires_at?: string
  error?: string
  acquirer_name?: string
}

// ========================================
// SERVIÇO DE PROCESSAMENTO PIX
// ========================================

class PixProcessorService {
  
  /**
   * Criar um pagamento PIX
   */
  async createPixPayment(params: CreatePixPaymentParams): Promise<PixPaymentResult> {
    try {
      console.log('🏦 Iniciando criação de PIX:', params)
      
      // 1. Buscar adquirente (padrão ou específico)
      const acquirer = await this.getAcquirer(params.acquirer_id)
      
      if (!acquirer) {
        return {
          success: false,
          error: 'Nenhum adquirente disponível'
        }
      }
      
      console.log('✅ Adquirente selecionado:', acquirer.name)
      
      // 2. Verificar se está ativo
      if (!acquirer.is_active || acquirer.status !== 'active') {
        return {
          success: false,
          error: `Adquirente ${acquirer.name} está inativo`
        }
      }
      
      // 3. Verificar limites
      const limitCheck = await this.checkLimits(acquirer, params.amount)
      if (!limitCheck.allowed) {
        return {
          success: false,
          error: limitCheck.reason
        }
      }
      
      // 4. Calcular taxas
      const fees = this.calculateFees(acquirer, params.amount)
      
      // 5. Chamar API do adquirente
      const paymentResult = await this.callAcquirerAPI(acquirer, params)
      
      if (!paymentResult.success) {
        return paymentResult
      }
      
      // 6. Salvar transação no banco
      const transaction = await this.saveTransaction({
        user_id: params.user_id,
        acquirer_id: acquirer.id,
        transaction_type: 'deposit',
        amount: params.amount,
        fee_amount: fees.total,
        net_amount: params.amount - fees.total,
        pix_code: paymentResult.pix_code,
        pix_qr_code: paymentResult.pix_qr_code,
        pix_txid: paymentResult.pix_txid,
        status: 'pending',
        description: params.description,
        payer_name: params.payer_name,
        payer_document: params.payer_document,
        expires_at: paymentResult.expires_at
      })
      
      console.log('✅ PIX criado com sucesso:', transaction.id)
      
      // Notificar usuário sobre PIX pendente
      if (paymentResult.expires_at) {
        await notificationService.notifyPixPending(
          params.user_id,
          params.amount,
          transaction.id,
          paymentResult.expires_at as string
        )
      }
      
      return {
        success: true,
        transaction_id: transaction.id,
        pix_code: paymentResult.pix_code,
        pix_qr_code: paymentResult.pix_qr_code,
        pix_txid: paymentResult.pix_txid,
        expires_at: paymentResult.expires_at,
        acquirer_name: acquirer.name
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao criar PIX:', error)
      return {
        success: false,
        error: error.message || 'Erro ao processar pagamento'
      }
    }
  }
  
  /**
   * Consultar status de um PIX
   */
  async getPixStatus(transaction_id: string): Promise<{
    status: string
    paid_at?: string
    error?: string
  }> {
    try {
      // 1. Buscar transação
      const { data: transaction, error } = await supabase
        .from('pix_transactions')
        .select('*, bank_acquirers(*)')
        .eq('id', transaction_id)
        .single()
      
      if (error || !transaction) {
        throw new Error('Transação não encontrada')
      }
      
      // 2. Se já está completa, retornar status
      if (transaction.status === 'completed') {
        return {
          status: 'completed',
          paid_at: transaction.updated_at
        }
      }
      
      // 3. Consultar status no adquirente
      const acquirer = transaction.bank_acquirers
      const statusResult = await this.checkAcquirerStatus(acquirer, transaction)
      
      // 4. Atualizar status se mudou
      if (statusResult.status !== transaction.status) {
        await this.updateTransactionStatus(transaction_id, statusResult.status)
      }
      
      return statusResult
      
    } catch (error: any) {
      console.error('❌ Erro ao consultar status:', error)
      return {
        status: 'error',
        error: error.message
      }
    }
  }
  
  /**
   * Processar webhook de adquirente
   */
  async processWebhook(acquirer: BankAcquirer, event: any): Promise<void> {
    try {
      console.log('🪝 Processando webhook:', acquirer.name, event.type)
      
      // Verificar se o evento está habilitado
      if (!acquirer.webhook_events?.includes(event.type)) {
        console.log('⚠️ Evento não habilitado:', event.type)
        return
      }
      
      // Processar baseado no tipo de evento
      switch (event.type) {
        case 'pix.created':
          await this.handlePixCreated(event)
          break
        case 'pix.completed':
          await this.handlePixCompleted(event)
          break
        case 'pix.failed':
          await this.handlePixFailed(event)
          break
        case 'pix.reversed':
          await this.handlePixReversed(event)
          break
        default:
          console.log('⚠️ Tipo de evento desconhecido:', event.type)
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao processar webhook:', error)
      throw error
    }
  }
  
  // ========================================
  // MÉTODOS PRIVADOS
  // ========================================
  
  /**
   * Buscar adquirente (padrão ou específico)
   */
  private async getAcquirer(acquirer_id?: string): Promise<BankAcquirer | null> {
    if (acquirer_id) {
      return await bankAcquirerService.getAcquirerById(acquirer_id)
    }
    return await bankAcquirerService.getDefaultAcquirer()
  }
  
  /**
   * Verificar limites do adquirente
   */
  private async checkLimits(acquirer: BankAcquirer, amount: number): Promise<{
    allowed: boolean
    reason?: string
  }> {
    // Verificar limite por transação
    if (acquirer.transaction_limit && amount > acquirer.transaction_limit) {
      return {
        allowed: false,
        reason: `Valor excede limite por transação (R$ ${acquirer.transaction_limit})`
      }
    }
    
    // Verificar limite diário
    if (acquirer.daily_limit) {
      const stats = await bankAcquirerService.getAcquirerStatistics(acquirer.id)
      const todayVolume = stats?.total_volume || 0
      
      if (todayVolume + amount > acquirer.daily_limit) {
        return {
          allowed: false,
          reason: `Limite diário excedido (R$ ${acquirer.daily_limit})`
        }
      }
    }
    
    return { allowed: true }
  }
  
  /**
   * Calcular taxas
   */
  private calculateFees(acquirer: BankAcquirer, amount: number): {
    percentage: number
    fixed: number
    total: number
  } {
    const percentageFee = acquirer.fee_percentage 
      ? amount * acquirer.fee_percentage 
      : 0
    
    const fixedFee = acquirer.fee_fixed || 0
    
    return {
      percentage: percentageFee,
      fixed: fixedFee,
      total: percentageFee + fixedFee
    }
  }
  
  /**
   * Chamar API do adquirente específico
   */
  private async callAcquirerAPI(
    acquirer: BankAcquirer, 
    params: CreatePixPaymentParams
  ): Promise<PixPaymentResult> {
    // Identificar adquirente pelo nome ou código
    const acquirerName = acquirer.name.toLowerCase()
    
    if (acquirerName.includes('mercado pago') || acquirerName.includes('mercadopago')) {
      return await mercadoPagoIntegration.createPixPayment(acquirer, params)
    }
    
    // Adicionar mais integrações aqui
    // if (acquirerName.includes('qi tech')) {
    //   return await qiTechIntegration.createPixPayment(acquirer, params)
    // }
    
    return {
      success: false,
      error: `Integração não implementada para: ${acquirer.name}`
    }
  }
  
  /**
   * Consultar status no adquirente
   */
  private async checkAcquirerStatus(acquirer: BankAcquirer, transaction: any): Promise<{
    status: string
    paid_at?: string
  }> {
    const acquirerName = acquirer.name.toLowerCase()
    
    if (acquirerName.includes('mercado pago') || acquirerName.includes('mercadopago')) {
      return await mercadoPagoIntegration.checkPaymentStatus(acquirer, transaction.pix_txid)
    }
    
    return { status: transaction.status }
  }
  
  /**
   * Salvar transação no banco
   */
  private async saveTransaction(data: Partial<PixTransaction>): Promise<PixTransaction> {
    const { data: transaction, error } = await supabase
      .from('pix_transactions')
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    return transaction
  }
  
  /**
   * Atualizar status da transação
   */
  private async updateTransactionStatus(transaction_id: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('pix_transactions')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction_id)
    
    if (error) throw error
  }
  
  /**
   * Handlers de eventos de webhook
   */
  private async handlePixCreated(event: any): Promise<void> {
    console.log('📝 PIX criado:', event)
    // Implementar lógica específica
  }
  
  private async handlePixCompleted(event: any): Promise<void> {
    console.log('✅ PIX completado:', event)
    
    // Atualizar status da transação
    await this.updateTransactionStatus(event.transaction_id, 'completed')
    
    // 1. Calcular taxa do sistema
    const systemFee = await systemFeeService.calculateFee('pix_receive', event.amount)
    const netAmount = event.amount - systemFee
    
    console.log(`💰 Valor recebido: R$ ${event.amount.toFixed(2)}`)
    console.log(`💵 Taxa do sistema: R$ ${systemFee.toFixed(2)}`)
    console.log(`✅ Valor líquido: R$ ${netAmount.toFixed(2)}`)
    
    // 2. Creditar saldo líquido do usuário (já descontando a taxa)
    const creditResult = await walletService.credit(
      event.user_id,
      netAmount,
      `Depósito PIX - ${event.description || 'Recarga de saldo'}`,
      event.transaction_id,
      'pix_transaction'
    )
    
    if (!creditResult.success) {
      console.error('❌ Erro ao creditar saldo:', creditResult.error)
      // Registrar erro mas não falhar o webhook
    } else {
      console.log('✅ Saldo creditado com sucesso!')
      
      // 3. Registrar coleta de taxa do sistema
      await systemFeeService.collectFee({
        user_id: event.user_id,
        transaction_id: event.transaction_id,
        operation_type: 'pix_receive',
        transaction_amount: event.amount,
        fee_amount: systemFee,
        metadata: {
          description: event.description,
          net_amount: netAmount
        }
      })
      
      // 4. Notificar usuário sobre PIX recebido
      await notificationService.notifyPixReceived(
        event.user_id,
        netAmount, // Mostrar valor líquido na notificação
        event.transaction_id
      )
    }
  }
  
  private async handlePixFailed(event: any): Promise<void> {
    console.log('❌ PIX falhou:', event)
    await this.updateTransactionStatus(event.transaction_id, 'failed')
    
    // Notificar usuário sobre falha
    await notificationService.notifyPixFailed(
      event.user_id,
      event.amount,
      event.transaction_id,
      event.error_message
    )
  }
  
  private async handlePixReversed(event: any): Promise<void> {
    console.log('🔄 PIX estornado:', event)
    await this.updateTransactionStatus(event.transaction_id, 'cancelled')
  }
}

export const pixProcessorService = new PixProcessorService()
