import { supabase } from '@/lib/supabase'
import { bankAcquirerService, SendPixParams } from './bankAcquirerService'
import { walletService } from './walletService'
import { notificationService } from './notificationService'

// ========================================
// TIPOS E INTERFACES
// ========================================

export interface SendPixRequest extends SendPixParams {
  // Herda todos os campos de SendPixParams
}

export interface SendPixResult {
  success: boolean
  transaction_id?: string
  e2e_id?: string
  error?: string
  balance_after?: number
}

// ========================================
// SERVIÇO DE ENVIO DE PIX
// ========================================

class PixSendService {
  
  /**
   * Enviar PIX com validação completa
   */
  async sendPix(params: SendPixRequest): Promise<SendPixResult> {
    try {
      console.log('💸 Processando envio de PIX:', params)
      
      // 1. Validar saldo disponível
      const availableBalance = await walletService.getAvailableBalance(params.user_id)
      
      // Calcular valor total (valor + taxa estimada)
      const estimatedFee = params.amount * 0.0350 + 0.60 // Taxa padrão
      const totalAmount = params.amount + estimatedFee
      
      if (availableBalance < totalAmount) {
        return {
          success: false,
          error: `Saldo insuficiente. Disponível: R$ ${availableBalance.toFixed(2)}, Necessário: R$ ${totalAmount.toFixed(2)}`
        }
      }
      
      // 2. Validar chave PIX
      const keyValidation = this.validatePixKey(params.pix_key, params.pix_key_type)
      if (!keyValidation.valid) {
        return {
          success: false,
          error: keyValidation.error
        }
      }
      
      // 3. Debitar saldo (bloqueio temporário)
      const debitResult = await walletService.debit(
        params.user_id,
        totalAmount,
        `PIX para ${params.pix_key} - ${params.description}`,
        undefined,
        'pix_send'
      )
      
      if (!debitResult.success) {
        return {
          success: false,
          error: debitResult.error
        }
      }
      
      // 4. Enviar PIX através do adquirente
      const sendResult = await bankAcquirerService.sendPix(params)
      
      if (!sendResult.success) {
        // Reverter débito em caso de falha
        await walletService.credit(
          params.user_id,
          totalAmount,
          `Estorno PIX - ${params.description}`,
          sendResult.transaction_id,
          'pix_send_reversal'
        )
        
        // Notificar falha
        await notificationService.notifyPixFailed(
          params.user_id,
          params.amount,
          sendResult.transaction_id || '',
          sendResult.error
        )
        
        return {
          success: false,
          error: sendResult.error
        }
      }
      
      // 5. Atualizar transação com referência da wallet
      if (sendResult.transaction_id) {
        await supabase
          .from('pix_transactions')
          .update({
            metadata: {
              wallet_debit_id: debitResult.wallet?.id,
              total_debited: totalAmount
            }
          })
          .eq('id', sendResult.transaction_id)
      }
      
      // 6. Notificar sucesso
      await notificationService.create({
        user_id: params.user_id,
        title: '✅ PIX Enviado',
        message: `PIX de R$ ${params.amount.toFixed(2)} enviado para ${params.pix_key}. O valor foi debitado da sua conta.`,
        type: 'success',
        category: 'pix',
        action_url: '/financeiro',
        metadata: {
          transaction_id: sendResult.transaction_id,
          e2e_id: sendResult.e2e_id,
          amount: params.amount
        }
      })
      
      console.log('✅ PIX enviado e saldo debitado')
      
      return {
        success: true,
        transaction_id: sendResult.transaction_id,
        e2e_id: sendResult.e2e_id,
        balance_after: debitResult.wallet?.balance
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao processar envio de PIX:', error)
      return {
        success: false,
        error: error.message || 'Erro ao enviar PIX'
      }
    }
  }
  
  /**
   * Validar chave PIX
   */
  private validatePixKey(key: string, type: string): { valid: boolean; error?: string } {
    switch (type) {
      case 'cpf':
        // Remove formatação
        const cpf = key.replace(/\D/g, '')
        if (cpf.length !== 11) {
          return { valid: false, error: 'CPF inválido' }
        }
        break
        
      case 'cnpj':
        const cnpj = key.replace(/\D/g, '')
        if (cnpj.length !== 14) {
          return { valid: false, error: 'CNPJ inválido' }
        }
        break
        
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(key)) {
          return { valid: false, error: 'Email inválido' }
        }
        break
        
      case 'phone':
        const phone = key.replace(/\D/g, '')
        if (phone.length < 10 || phone.length > 11) {
          return { valid: false, error: 'Telefone inválido' }
        }
        break
        
      case 'random':
        if (key.length !== 32) {
          return { valid: false, error: 'Chave aleatória inválida' }
        }
        break
        
      default:
        return { valid: false, error: 'Tipo de chave inválido' }
    }
    
    return { valid: true }
  }
  
  /**
   * Buscar histórico de envios do usuário
   */
  async getSendHistory(userId: string, limit: number = 50) {
    try {
      const { data, error } = await supabase
        .from('pix_transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('transaction_type', 'withdrawal')
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar histórico:', error)
      return []
    }
  }
  
  /**
   * Cancelar PIX pendente (se possível)
   */
  async cancelPix(transactionId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Buscar transação
      const { data: transaction, error } = await supabase
        .from('pix_transactions')
        .select('*')
        .eq('id', transactionId)
        .eq('user_id', userId)
        .single()
      
      if (error || !transaction) {
        return { success: false, error: 'Transação não encontrada' }
      }
      
      // Só pode cancelar se estiver em processing
      if (transaction.status !== 'processing') {
        return { success: false, error: 'PIX não pode ser cancelado' }
      }
      
      // Marcar como cancelado
      await supabase
        .from('pix_transactions')
        .update({ status: 'cancelled' })
        .eq('id', transactionId)
      
      // Estornar saldo
      const totalAmount = transaction.amount + transaction.fee_amount
      await walletService.credit(
        userId,
        totalAmount,
        `Cancelamento PIX - ${transaction.description}`,
        transactionId,
        'pix_cancellation'
      )
      
      // Notificar
      await notificationService.create({
        user_id: userId,
        title: '🔄 PIX Cancelado',
        message: `PIX de R$ ${transaction.amount.toFixed(2)} foi cancelado. O valor foi estornado.`,
        type: 'info',
        category: 'pix'
      })
      
      return { success: true }
      
    } catch (error: any) {
      console.error('Erro ao cancelar PIX:', error)
      return { success: false, error: error.message }
    }
  }
  
  /**
   * Consultar limites disponíveis
   */
  async getAvailableLimits(userId: string) {
    try {
      const balance = await walletService.getAvailableBalance(userId)
      
      // Buscar adquirente padrão para pegar limites
      const acquirer = await bankAcquirerService.getDefaultAcquirer()
      
      return {
        available_balance: balance,
        transaction_limit: acquirer?.transaction_limit || 5000,
        daily_limit: acquirer?.daily_limit || 50000,
        fee_percentage: acquirer?.fee_percentage || 0.0350,
        fee_fixed: acquirer?.fee_fixed || 0.60
      }
    } catch (error) {
      console.error('Erro ao buscar limites:', error)
      return null
    }
  }
}

// Exportar instância única
export const pixSendService = new PixSendService()
