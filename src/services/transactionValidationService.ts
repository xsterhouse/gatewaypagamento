import { supabase } from '@/lib/supabase'

// ========================================
// TIPOS
// ========================================

export interface ValidationResult {
  valid: boolean
  error?: string
  warning?: string
}

export interface TransactionLimits {
  min_amount: number
  max_amount: number
  daily_limit: number
  monthly_limit: number
}

// ========================================
// SERVIÇO DE VALIDAÇÃO DE TRANSAÇÕES
// ========================================

class TransactionValidationService {
  
  // Limites padrão
  private readonly DEFAULT_LIMITS = {
    pix: {
      min_amount: 1.00,
      max_amount: 10000.00,
      daily_limit: 50000.00,
      monthly_limit: 200000.00
    },
    boleto: {
      min_amount: 5.00,
      max_amount: 50000.00,
      daily_limit: 100000.00,
      monthly_limit: 500000.00
    },
    ted: {
      min_amount: 10.00,
      max_amount: 100000.00,
      daily_limit: 200000.00,
      monthly_limit: 1000000.00
    }
  }

  /**
   * Validar valor da transação
   */
  validateAmount(amount: number, payment_type: string): ValidationResult {
    if (amount <= 0) {
      return {
        valid: false,
        error: 'Valor deve ser maior que zero'
      }
    }

    const limits = this.DEFAULT_LIMITS[payment_type as keyof typeof this.DEFAULT_LIMITS]
    
    if (!limits) {
      return {
        valid: false,
        error: 'Tipo de pagamento inválido'
      }
    }

    if (amount < limits.min_amount) {
      return {
        valid: false,
        error: `Valor mínimo é R$ ${limits.min_amount.toFixed(2)}`
      }
    }

    if (amount > limits.max_amount) {
      return {
        valid: false,
        error: `Valor máximo é R$ ${limits.max_amount.toFixed(2)}`
      }
    }

    return { valid: true }
  }

  /**
   * Validar KYC do usuário
   */
  async validateKYC(user_id: string): Promise<ValidationResult> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('kyc_status, status')
        .eq('id', user_id)
        .single()

      if (error || !user) {
        return {
          valid: false,
          error: 'Usuário não encontrado'
        }
      }

      if (user.status === 'suspended') {
        return {
          valid: false,
          error: 'Conta suspensa. Entre em contato com o suporte.'
        }
      }

      if (user.kyc_status !== 'approved') {
        return {
          valid: false,
          error: 'KYC não aprovado. Complete a verificação de identidade antes de realizar transações.'
        }
      }

      return { valid: true }

    } catch (error) {
      console.error('❌ Erro ao validar KYC:', error)
      return {
        valid: false,
        error: 'Erro ao validar status do usuário'
      }
    }
  }

  /**
   * Validar limites diários
   */
  async validateDailyLimit(
    user_id: string,
    amount: number,
    payment_type: string
  ): Promise<ValidationResult> {
    try {
      const limits = this.DEFAULT_LIMITS[payment_type as keyof typeof this.DEFAULT_LIMITS]
      
      if (!limits) {
        return { valid: false, error: 'Tipo de pagamento inválido' }
      }

      // Buscar transações do dia
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data: transactions, error } = await supabase
        .from('pix_transactions')
        .select('amount')
        .eq('user_id', user_id)
        .eq('transaction_type', 'deposit')
        .gte('created_at', today.toISOString())
        .in('status', ['pending', 'completed', 'paid'])

      if (error) {
        console.error('❌ Erro ao buscar transações:', error)
        return { valid: false, error: 'Erro ao validar limite diário' }
      }

      const dailyTotal = (transactions || []).reduce(
        (sum, t) => sum + Number(t.amount || 0),
        0
      )

      const newTotal = dailyTotal + amount

      if (newTotal > limits.daily_limit) {
        return {
          valid: false,
          error: `Limite diário excedido. Limite: R$ ${limits.daily_limit.toFixed(2)}, Usado: R$ ${dailyTotal.toFixed(2)}`
        }
      }

      // Avisar se está próximo do limite (80%)
      if (newTotal > limits.daily_limit * 0.8) {
        return {
          valid: true,
          warning: `Você está próximo do limite diário (${((newTotal / limits.daily_limit) * 100).toFixed(0)}%)`
        }
      }

      return { valid: true }

    } catch (error) {
      console.error('❌ Erro ao validar limite diário:', error)
      return {
        valid: false,
        error: 'Erro ao validar limite diário'
      }
    }
  }

  /**
   * Validar limites mensais
   */
  async validateMonthlyLimit(
    user_id: string,
    amount: number,
    payment_type: string
  ): Promise<ValidationResult> {
    try {
      const limits = this.DEFAULT_LIMITS[payment_type as keyof typeof this.DEFAULT_LIMITS]
      
      if (!limits) {
        return { valid: false, error: 'Tipo de pagamento inválido' }
      }

      // Buscar transações do mês
      const firstDayOfMonth = new Date()
      firstDayOfMonth.setDate(1)
      firstDayOfMonth.setHours(0, 0, 0, 0)

      const { data: transactions, error } = await supabase
        .from('pix_transactions')
        .select('amount')
        .eq('user_id', user_id)
        .eq('transaction_type', 'deposit')
        .gte('created_at', firstDayOfMonth.toISOString())
        .in('status', ['pending', 'completed', 'paid'])

      if (error) {
        console.error('❌ Erro ao buscar transações:', error)
        return { valid: false, error: 'Erro ao validar limite mensal' }
      }

      const monthlyTotal = (transactions || []).reduce(
        (sum, t) => sum + Number(t.amount || 0),
        0
      )

      const newTotal = monthlyTotal + amount

      if (newTotal > limits.monthly_limit) {
        return {
          valid: false,
          error: `Limite mensal excedido. Limite: R$ ${limits.monthly_limit.toFixed(2)}, Usado: R$ ${monthlyTotal.toFixed(2)}`
        }
      }

      return { valid: true }

    } catch (error) {
      console.error('❌ Erro ao validar limite mensal:', error)
      return {
        valid: false,
        error: 'Erro ao validar limite mensal'
      }
    }
  }

  /**
   * Validar duplicação de transação
   */
  async validateDuplication(
    user_id: string,
    amount: number,
    description: string
  ): Promise<ValidationResult> {
    try {
      // Buscar transações similares nos últimos 5 minutos
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

      const { data: transactions, error } = await supabase
        .from('pix_transactions')
        .select('id, amount, description, created_at')
        .eq('user_id', user_id)
        .eq('amount', amount)
        .gte('created_at', fiveMinutesAgo.toISOString())
        .limit(1)

      if (error) {
        console.error('❌ Erro ao verificar duplicação:', error)
        // Não bloquear por erro de verificação
        return { valid: true }
      }

      if (transactions && transactions.length > 0) {
        const lastTransaction = transactions[0]
        const timeDiff = Date.now() - new Date(lastTransaction.created_at).getTime()
        const secondsAgo = Math.floor(timeDiff / 1000)

        return {
          valid: false,
          error: `Transação duplicada detectada. Você criou uma transação similar há ${secondsAgo} segundos.`
        }
      }

      return { valid: true }

    } catch (error) {
      console.error('❌ Erro ao validar duplicação:', error)
      // Não bloquear por erro de verificação
      return { valid: true }
    }
  }

  /**
   * Validação completa de transação
   */
  async validateTransaction(
    user_id: string,
    amount: number,
    payment_type: string,
    description?: string
  ): Promise<ValidationResult> {
    // 1. Validar valor
    const amountValidation = this.validateAmount(amount, payment_type)
    if (!amountValidation.valid) {
      return amountValidation
    }

    // 2. Validar KYC
    const kycValidation = await this.validateKYC(user_id)
    if (!kycValidation.valid) {
      return kycValidation
    }

    // 3. Validar limite diário
    const dailyValidation = await this.validateDailyLimit(user_id, amount, payment_type)
    if (!dailyValidation.valid) {
      return dailyValidation
    }

    // 4. Validar limite mensal
    const monthlyValidation = await this.validateMonthlyLimit(user_id, amount, payment_type)
    if (!monthlyValidation.valid) {
      return monthlyValidation
    }

    // 5. Validar duplicação
    if (description) {
      const duplicationValidation = await this.validateDuplication(user_id, amount, description)
      if (!duplicationValidation.valid) {
        return duplicationValidation
      }
    }

    // Retornar avisos se houver
    if (dailyValidation.warning) {
      return {
        valid: true,
        warning: dailyValidation.warning
      }
    }

    return { valid: true }
  }

  /**
   * Obter limites do usuário
   */
  getLimits(payment_type: string): TransactionLimits | null {
    return this.DEFAULT_LIMITS[payment_type as keyof typeof this.DEFAULT_LIMITS] || null
  }
}

export const transactionValidationService = new TransactionValidationService()
