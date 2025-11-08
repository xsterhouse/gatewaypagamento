import { supabase } from '@/lib/supabase'

// ========================================
// TIPOS E INTERFACES
// ========================================

export interface Wallet {
  id: string
  user_id: string
  currency_code: string
  balance: number
  blocked_balance: number
  created_at: string
  updated_at: string
}

export interface WalletTransaction {
  id?: string
  wallet_id: string
  user_id: string
  transaction_type: 'credit' | 'debit' | 'lock' | 'unlock'
  amount: number
  balance_before: number
  balance_after: number
  description: string
  reference_id?: string
  reference_type?: string
  metadata?: Record<string, any>
  created_at?: string
}

// ========================================
// SERVIÇO DE CARTEIRAS
// ========================================

class WalletService {
  
  /**
   * Buscar carteira de um usuário por moeda
   */
  async getWallet(userId: string, currencyCode: string = 'BRL'): Promise<Wallet | null> {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .eq('currency_code', currencyCode)
        .single()
      
      if (error) {
        console.error('Erro ao buscar carteira:', error)
        return null
      }
      
      return data
    } catch (error) {
      console.error('Erro ao buscar carteira:', error)
      return null
    }
  }
  
  /**
   * Buscar todas as carteiras de um usuário
   */
  async getUserWallets(userId: string): Promise<Wallet[]> {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .order('currency_code')
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar carteiras:', error)
      return []
    }
  }
  
  /**
   * Criar carteira se não existir
   */
  async getOrCreateWallet(userId: string, currencyCode: string = 'BRL'): Promise<Wallet | null> {
    try {
      // Tentar buscar carteira existente
      let wallet = await this.getWallet(userId, currencyCode)
      
      if (wallet) {
        return wallet
      }
      
      // Criar nova carteira
      const { data, error } = await supabase
        .from('wallets')
        .insert({
          user_id: userId,
          currency_code: currencyCode,
          balance: 0,
          blocked_balance: 0
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao criar carteira:', error)
      return null
    }
  }
  
  /**
   * Creditar valor na carteira (PRINCIPAL PARA PIX)
   */
  async credit(
    userId: string,
    amount: number,
    description: string,
    referenceId?: string,
    referenceType?: string,
    currencyCode: string = 'BRL'
  ): Promise<{ success: boolean; wallet?: Wallet; error?: string }> {
    try {
      console.log('💰 Creditando saldo:', { userId, amount, description })
      
      // Validar valor
      if (amount <= 0) {
        return { success: false, error: 'Valor deve ser maior que zero' }
      }
      
      // Buscar ou criar carteira
      const wallet = await this.getOrCreateWallet(userId, currencyCode)
      if (!wallet) {
        return { success: false, error: 'Erro ao buscar carteira' }
      }
      
      const balanceBefore = wallet.balance
      const balanceAfter = balanceBefore + amount
      
      // Atualizar saldo da carteira
      const { data: updatedWallet, error: updateError } = await supabase
        .from('wallets')
        .update({ 
          balance: balanceAfter,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id)
        .select()
        .single()
      
      if (updateError) throw updateError
      
      // Registrar transação na carteira
      await this.logWalletTransaction({
        wallet_id: wallet.id,
        user_id: userId,
        transaction_type: 'credit',
        amount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        description,
        reference_id: referenceId,
        reference_type: referenceType
      })
      
      console.log('✅ Saldo creditado com sucesso:', {
        before: balanceBefore,
        after: balanceAfter,
        amount
      })
      
      return { success: true, wallet: updatedWallet }
      
    } catch (error: any) {
      console.error('❌ Erro ao creditar saldo:', error)
      return { success: false, error: error.message }
    }
  }
  
  /**
   * Debitar valor da carteira
   */
  async debit(
    userId: string,
    amount: number,
    description: string,
    referenceId?: string,
    referenceType?: string,
    currencyCode: string = 'BRL'
  ): Promise<{ success: boolean; wallet?: Wallet; error?: string }> {
    try {
      console.log('💸 Debitando saldo:', { userId, amount, description })
      
      // Validar valor
      if (amount <= 0) {
        return { success: false, error: 'Valor deve ser maior que zero' }
      }
      
      // Buscar carteira
      const wallet = await this.getWallet(userId, currencyCode)
      if (!wallet) {
        return { success: false, error: 'Carteira não encontrada' }
      }
      
      // Verificar saldo disponível
      if (wallet.balance < amount) {
        return { success: false, error: 'Saldo insuficiente' }
      }
      
      const balanceBefore = wallet.balance
      const balanceAfter = balanceBefore - amount
      
      // Atualizar saldo
      const { data: updatedWallet, error: updateError } = await supabase
        .from('wallets')
        .update({ 
          balance: balanceAfter,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id)
        .select()
        .single()
      
      if (updateError) throw updateError
      
      // Registrar transação
      await this.logWalletTransaction({
        wallet_id: wallet.id,
        user_id: userId,
        transaction_type: 'debit',
        amount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        description,
        reference_id: referenceId,
        reference_type: referenceType
      })
      
      console.log('✅ Saldo debitado com sucesso')
      
      return { success: true, wallet: updatedWallet }
      
    } catch (error: any) {
      console.error('❌ Erro ao debitar saldo:', error)
      return { success: false, error: error.message }
    }
  }
  
  /**
   * Bloquear saldo (cautelar)
   */
  async lockBalance(
    userId: string,
    amount: number,
    description: string,
    referenceId?: string,
    currencyCode: string = 'BRL'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const wallet = await this.getWallet(userId, currencyCode)
      if (!wallet) {
        return { success: false, error: 'Carteira não encontrada' }
      }
      
      // Verificar se há saldo disponível
      const availableBalance = wallet.balance - wallet.blocked_balance
      if (availableBalance < amount) {
        return { success: false, error: 'Saldo disponível insuficiente' }
      }
      
      // Atualizar saldo bloqueado
      const { error } = await supabase
        .from('wallets')
        .update({ 
          blocked_balance: wallet.blocked_balance + amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id)
      
      if (error) throw error
      
      // Registrar transação
      await this.logWalletTransaction({
        wallet_id: wallet.id,
        user_id: userId,
        transaction_type: 'lock',
        amount,
        balance_before: wallet.balance,
        balance_after: wallet.balance,
        description,
        reference_id: referenceId,
        reference_type: 'lock',
        metadata: { locked_amount: amount }
      })
      
      return { success: true }
      
    } catch (error: any) {
      console.error('Erro ao bloquear saldo:', error)
      return { success: false, error: error.message }
    }
  }
  
  /**
   * Desbloquear saldo
   */
  async unlockBalance(
    userId: string,
    amount: number,
    description: string,
    referenceId?: string,
    currencyCode: string = 'BRL'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const wallet = await this.getWallet(userId, currencyCode)
      if (!wallet) {
        return { success: false, error: 'Carteira não encontrada' }
      }
      
      // Verificar se há saldo bloqueado suficiente
      if (wallet.blocked_balance < amount) {
        return { success: false, error: 'Saldo bloqueado insuficiente' }
      }
      
      // Atualizar saldo bloqueado
      const { error } = await supabase
        .from('wallets')
        .update({ 
          blocked_balance: wallet.blocked_balance - amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id)
      
      if (error) throw error
      
      // Registrar transação
      await this.logWalletTransaction({
        wallet_id: wallet.id,
        user_id: userId,
        transaction_type: 'unlock',
        amount,
        balance_before: wallet.balance,
        balance_after: wallet.balance,
        description,
        reference_id: referenceId,
        reference_type: 'unlock',
        metadata: { unlocked_amount: amount }
      })
      
      return { success: true }
      
    } catch (error: any) {
      console.error('Erro ao desbloquear saldo:', error)
      return { success: false, error: error.message }
    }
  }
  
  /**
   * Registrar transação da carteira (log interno)
   */
  private async logWalletTransaction(transaction: Omit<WalletTransaction, 'id' | 'created_at'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('wallet_transactions')
        .insert(transaction)
      
      if (error) {
        console.error('Erro ao registrar transação da carteira:', error)
      }
    } catch (error) {
      console.error('Erro ao registrar transação da carteira:', error)
    }
  }
  
  /**
   * Buscar histórico de transações da carteira
   */
  async getWalletHistory(
    userId: string,
    currencyCode: string = 'BRL',
    limit: number = 50
  ): Promise<WalletTransaction[]> {
    try {
      const wallet = await this.getWallet(userId, currencyCode)
      if (!wallet) return []
      
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', wallet.id)
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
   * Obter saldo disponível (total - bloqueado)
   */
  async getAvailableBalance(userId: string, currencyCode: string = 'BRL'): Promise<number> {
    const wallet = await this.getWallet(userId, currencyCode)
    if (!wallet) return 0
    return wallet.balance - wallet.blocked_balance
  }
}

// Exportar instância única
export const walletService = new WalletService()
