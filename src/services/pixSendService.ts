import { supabase } from '@/lib/supabase'
import { bankAcquirerService, SendPixParams } from './bankAcquirerService'
import { walletService } from './walletService'
import { notificationService } from './notificationService'
import { systemFeeService } from './systemFeeService'

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
      
      // 1. Validar saldo disponível (pré-validação no frontend)
      const availableBalance = await walletService.getAvailableBalance(params.user_id)
      
      // Calcular taxas (apenas para exibição/estimativa)
      // Nota: As taxas reais serão aplicadas pela Edge Function ou ajustadas aqui se necessário
      // A Edge Function atualmente debita apenas o valor enviado, as taxas devem ser tratadas à parte ou incluídas
      // Por enquanto, vamos manter a lógica de verificar se tem saldo para Valor + Taxas
      
      const bankFee = params.amount * 0.0350 + 0.60 // Taxa do banco
      const systemFee = await systemFeeService.calculateFee('pix_send', params.amount) // Taxa do sistema
      const totalAmount = params.amount + bankFee + systemFee
      
      console.log(`💰 Valor a enviar: R$ ${params.amount.toFixed(2)}`)
      console.log(`🏦 Taxa do banco: R$ ${bankFee.toFixed(2)}`)
      console.log(`💵 Taxa do sistema: R$ ${systemFee.toFixed(2)}`)
      console.log(`📊 Total estimado a debitar: R$ ${totalAmount.toFixed(2)}`)
      
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
      
      // 3. Chamar Edge Function para realizar o envio real
      console.log('🚀 Chamando Edge Function mercadopago-send-pix...')
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const response = await fetch(`${supabaseUrl}/functions/v1/mercadopago-send-pix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          user_id: params.user_id,
          amount: params.amount, // A Edge Function vai debitar este valor da carteira
          pix_key: params.pix_key,
          pix_key_type: params.pix_key_type,
          description: params.description
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        console.error('❌ Erro na Edge Function:', data)
        return {
          success: false,
          error: data.error || data.message || 'Erro ao processar envio de PIX'
        }
      }
      
      // 4. Processar Taxas (separadamente, já que a Edge Function debita apenas o valor principal)
      // Debitar taxas da carteira
      const feesTotal = bankFee + systemFee
      
      if (feesTotal > 0) {
        console.log('💸 Debitando taxas separadamente:', feesTotal)
        await walletService.debit(
          params.user_id,
          feesTotal,
          `Taxas PIX - Envio para ${params.pix_key}`,
          data.transaction_id,
          'fee_collection'
        )
        
        // Registrar coleta de taxa do sistema
        await systemFeeService.collectFee({
          user_id: params.user_id,
          transaction_id: data.transaction_id,
          operation_type: 'pix_send',
          transaction_amount: params.amount,
          fee_amount: systemFee,
          metadata: {
            bank_fee: bankFee,
            total_debited: totalAmount,
            pix_key: params.pix_key
          }
        })
        
        // Atualizar transação com informações de taxas
        if (data.transaction_id) {
           await supabase
            .from('pix_transactions')
            .update({
              fee_amount: feesTotal,
              net_amount: totalAmount, // Valor + Taxas
              metadata: {
                ...data.metadata, // Manter metadados existentes
                bank_fee: bankFee,
                system_fee: systemFee,
                total_debited: totalAmount
              }
            })
            .eq('id', data.transaction_id)
        }
      }

      // 5. Notificar sucesso
      await notificationService.create({
        user_id: params.user_id,
        title: '✅ PIX Enviado',
        message: `PIX de R$ ${params.amount.toFixed(2)} enviado para ${params.pix_key}. Total debitado: R$ ${totalAmount.toFixed(2)} (incluindo taxas).`,
        type: 'success',
        category: 'pix',
        action_url: '/financeiro',
        metadata: {
          transaction_id: data.transaction_id,
          amount: params.amount,
          bank_fee: bankFee,
          system_fee: systemFee,
          total_debited: totalAmount
        }
      })
      
      console.log('✅ PIX enviado com sucesso via Edge Function')
      
      return {
        success: true,
        transaction_id: data.transaction_id,
        e2e_id: data.pix_e2e_id, // Se a Edge Function retornar
        balance_after: availableBalance - totalAmount // Estimativa
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
