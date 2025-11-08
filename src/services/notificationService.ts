import { supabase } from '@/lib/supabase'

// ========================================
// TIPOS E INTERFACES
// ========================================

export interface Notification {
  id?: string
  user_id: string
  title: string
  message: string
  type: 'success' | 'info' | 'warning' | 'error'
  category: 'pix' | 'transaction' | 'wallet' | 'kyc' | 'system'
  read: boolean
  action_url?: string
  metadata?: Record<string, any>
  created_at?: string
}

// ========================================
// SERVIÇO DE NOTIFICAÇÕES
// ========================================

class NotificationService {
  
  /**
   * Criar notificação para usuário
   */
  async create(notification: Omit<Notification, 'id' | 'created_at' | 'read'>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          ...notification,
          read: false
        })
      
      if (error) throw error
      
      console.log('✅ Notificação criada:', notification.title)
      return { success: true }
      
    } catch (error: any) {
      console.error('❌ Erro ao criar notificação:', error)
      return { success: false, error: error.message }
    }
  }
  
  /**
   * Notificar sobre PIX recebido
   */
  async notifyPixReceived(
    userId: string,
    amount: number,
    transactionId: string
  ): Promise<void> {
    await this.create({
      user_id: userId,
      title: '💰 PIX Recebido!',
      message: `Você recebeu R$ ${amount.toFixed(2)} via PIX. O saldo já está disponível em sua carteira.`,
      type: 'success',
      category: 'pix',
      action_url: `/dashboard`,
      metadata: {
        transaction_id: transactionId,
        amount
      }
    })
  }
  
  /**
   * Notificar sobre PIX pendente
   */
  async notifyPixPending(
    userId: string,
    amount: number,
    transactionId: string,
    expiresAt: string
  ): Promise<void> {
    await this.create({
      user_id: userId,
      title: '⏳ PIX Aguardando Pagamento',
      message: `QR Code PIX de R$ ${amount.toFixed(2)} gerado. Aguardando confirmação do pagamento.`,
      type: 'info',
      category: 'pix',
      action_url: `/deposits`,
      metadata: {
        transaction_id: transactionId,
        amount,
        expires_at: expiresAt
      }
    })
  }
  
  /**
   * Notificar sobre PIX expirado
   */
  async notifyPixExpired(
    userId: string,
    amount: number,
    transactionId: string
  ): Promise<void> {
    await this.create({
      user_id: userId,
      title: '⚠️ PIX Expirado',
      message: `O QR Code PIX de R$ ${amount.toFixed(2)} expirou. Gere um novo para realizar o depósito.`,
      type: 'warning',
      category: 'pix',
      action_url: `/deposits`,
      metadata: {
        transaction_id: transactionId,
        amount
      }
    })
  }
  
  /**
   * Notificar sobre PIX falhado
   */
  async notifyPixFailed(
    userId: string,
    amount: number,
    transactionId: string,
    reason?: string
  ): Promise<void> {
    await this.create({
      user_id: userId,
      title: '❌ Erro no PIX',
      message: `Não foi possível processar o PIX de R$ ${amount.toFixed(2)}. ${reason || 'Tente novamente.'}`,
      type: 'error',
      category: 'pix',
      action_url: `/deposits`,
      metadata: {
        transaction_id: transactionId,
        amount,
        reason
      }
    })
  }
  
  /**
   * Notificar sobre saque aprovado
   */
  async notifyWithdrawalApproved(
    userId: string,
    amount: number,
    transactionId: string
  ): Promise<void> {
    await this.create({
      user_id: userId,
      title: '✅ Saque Aprovado',
      message: `Seu saque de R$ ${amount.toFixed(2)} foi aprovado e está sendo processado.`,
      type: 'success',
      category: 'transaction',
      action_url: `/financeiro`,
      metadata: {
        transaction_id: transactionId,
        amount
      }
    })
  }
  
  /**
   * Notificar sobre saque rejeitado
   */
  async notifyWithdrawalRejected(
    userId: string,
    amount: number,
    transactionId: string,
    reason?: string
  ): Promise<void> {
    await this.create({
      user_id: userId,
      title: '❌ Saque Rejeitado',
      message: `Seu saque de R$ ${amount.toFixed(2)} foi rejeitado. ${reason || 'Entre em contato com o suporte.'}`,
      type: 'error',
      category: 'transaction',
      action_url: `/financeiro`,
      metadata: {
        transaction_id: transactionId,
        amount,
        reason
      }
    })
  }
  
  /**
   * Notificar sobre KYC aprovado
   */
  async notifyKycApproved(userId: string): Promise<void> {
    await this.create({
      user_id: userId,
      title: '✅ Verificação Aprovada',
      message: 'Sua verificação de identidade (KYC) foi aprovada! Agora você tem acesso completo à plataforma.',
      type: 'success',
      category: 'kyc',
      action_url: `/dashboard`
    })
  }
  
  /**
   * Notificar sobre KYC rejeitado
   */
  async notifyKycRejected(userId: string, reason?: string): Promise<void> {
    await this.create({
      user_id: userId,
      title: '❌ Verificação Rejeitada',
      message: `Sua verificação de identidade foi rejeitada. ${reason || 'Envie novos documentos.'}`,
      type: 'error',
      category: 'kyc',
      action_url: `/documents`,
      metadata: { reason }
    })
  }
  
  /**
   * Notificar sobre conta bloqueada
   */
  async notifyAccountBlocked(userId: string, reason?: string): Promise<void> {
    await this.create({
      user_id: userId,
      title: '🔒 Conta Bloqueada',
      message: `Sua conta foi temporariamente bloqueada. ${reason || 'Entre em contato com o suporte.'}`,
      type: 'error',
      category: 'system',
      action_url: `/ajuda`,
      metadata: { reason }
    })
  }
  
  /**
   * Notificar sobre conta desbloqueada
   */
  async notifyAccountUnblocked(userId: string): Promise<void> {
    await this.create({
      user_id: userId,
      title: '✅ Conta Desbloqueada',
      message: 'Sua conta foi desbloqueada. Você já pode utilizar todos os recursos da plataforma.',
      type: 'success',
      category: 'system',
      action_url: `/dashboard`
    })
  }
  
  /**
   * Buscar notificações do usuário
   */
  async getUserNotifications(
    userId: string,
    limit: number = 50,
    unreadOnly: boolean = false
  ): Promise<Notification[]> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (unreadOnly) {
        query = query.eq('read', false)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
      return []
    }
  }
  
  /**
   * Marcar notificação como lida
   */
  async markAsRead(notificationId: string): Promise<{ success: boolean }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
      
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Erro ao marcar como lida:', error)
      return { success: false }
    }
  }
  
  /**
   * Marcar todas como lidas
   */
  async markAllAsRead(userId: string): Promise<{ success: boolean }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)
      
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
      return { success: false }
    }
  }
  
  /**
   * Contar notificações não lidas
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false)
      
      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Erro ao contar não lidas:', error)
      return 0
    }
  }
  
  /**
   * Deletar notificação
   */
  async delete(notificationId: string): Promise<{ success: boolean }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
      
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Erro ao deletar notificação:', error)
      return { success: false }
    }
  }
}

// Exportar instância única
export const notificationService = new NotificationService()
