import { supabase } from '@/lib/supabase'
import { bankAcquirerService } from './bankAcquirerService'

// ========================================
// TIPOS E INTERFACES
// ========================================

export interface PaymentLink {
  id: string
  user_id: string
  title: string
  description?: string
  price_type: 'fixed' | 'variable'
  amount?: number
  min_amount?: number
  max_amount?: number
  allow_quantity: boolean
  max_quantity: number
  image_url?: string
  success_message?: string
  redirect_url?: string
  slug: string
  short_code?: string
  is_active: boolean
  expires_at?: string
  max_uses?: number
  current_uses: number
  total_amount: number
  total_transactions: number
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface CheckoutTransaction {
  id?: string
  payment_link_id: string
  user_id?: string
  pix_transaction_id?: string
  payer_name?: string
  payer_email?: string
  payer_phone?: string
  payer_document?: string
  quantity: number
  unit_amount: number
  total_amount: number
  fee_amount: number
  net_amount: number
  status: 'pending' | 'paid' | 'expired' | 'cancelled'
  pix_code?: string
  pix_qr_code?: string
  created_at?: string
  paid_at?: string
  expires_at?: string
  metadata?: Record<string, any>
}

export interface CreatePaymentLinkParams {
  title: string
  description?: string
  price_type: 'fixed' | 'variable'
  amount?: number
  min_amount?: number
  max_amount?: number
  allow_quantity?: boolean
  max_quantity?: number
  image_url?: string
  success_message?: string
  redirect_url?: string
  expires_at?: string
  max_uses?: number
}

export interface CreateCheckoutParams {
  payment_link_id: string
  quantity?: number
  custom_amount?: number
  payer_name?: string
  payer_email?: string
  payer_phone?: string
  payer_document?: string
}

// ========================================
// SERVIÇO DE CHECKOUT
// ========================================

class CheckoutService {
  
  // ========================================
  // GERENCIAMENTO DE LINKS DE PAGAMENTO
  // ========================================
  
  /**
   * Gera slug único a partir do título
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]+/g, '-') // Substitui caracteres especiais por -
      .replace(/^-+|-+$/g, '') // Remove - do início e fim
      .substring(0, 100) // Limita tamanho
  }
  
  /**
   * Cria um novo link de pagamento
   */
  async createPaymentLink(userId: string, params: CreatePaymentLinkParams): Promise<PaymentLink> {
    try {
      // Gerar slug
      const baseSlug = this.generateSlug(params.title)
      
      // Gerar código curto via função do banco
      const { data: shortCodeData } = await supabase.rpc('generate_short_code')
      const shortCode = shortCodeData || undefined
      
      // Gerar slug único via função do banco
      const { data: slugData } = await supabase.rpc('generate_unique_slug', { base_slug: baseSlug })
      const slug = slugData || baseSlug
      
      const linkData: Partial<PaymentLink> = {
        user_id: userId,
        title: params.title,
        description: params.description,
        price_type: params.price_type,
        amount: params.amount,
        min_amount: params.min_amount,
        max_amount: params.max_amount,
        allow_quantity: params.allow_quantity || false,
        max_quantity: params.max_quantity || 1,
        image_url: params.image_url,
        success_message: params.success_message,
        redirect_url: params.redirect_url,
        slug,
        short_code: shortCode,
        expires_at: params.expires_at,
        max_uses: params.max_uses,
        is_active: true
      }
      
      const { data, error } = await supabase
        .from('payment_links')
        .insert(linkData)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error: any) {
      console.error('Erro ao criar link de pagamento:', error)
      throw error
    }
  }
  
  /**
   * Busca links de pagamento do usuário
   */
  async getUserPaymentLinks(userId: string): Promise<PaymentLink[]> {
    const { data, error } = await supabase
      .from('payment_links')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }
  
  /**
   * Busca link por slug
   */
  async getPaymentLinkBySlug(slug: string): Promise<PaymentLink | null> {
    const { data, error } = await supabase
      .from('payment_links')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()
    
    if (error) {
      console.error('Erro ao buscar link:', error)
      return null
    }
    
    return data
  }
  
  /**
   * Busca link por código curto
   */
  async getPaymentLinkByCode(code: string): Promise<PaymentLink | null> {
    const { data, error } = await supabase
      .from('payment_links')
      .select('*')
      .eq('short_code', code)
      .eq('is_active', true)
      .single()
    
    if (error) {
      console.error('Erro ao buscar link:', error)
      return null
    }
    
    return data
  }
  
  /**
   * Atualiza link de pagamento
   */
  async updatePaymentLink(id: string, updates: Partial<PaymentLink>): Promise<PaymentLink> {
    const { data, error } = await supabase
      .from('payment_links')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
  
  /**
   * Ativa/Desativa link
   */
  async togglePaymentLink(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('payment_links')
      .update({ is_active: isActive })
      .eq('id', id)
    
    if (error) throw error
  }
  
  /**
   * Deleta link de pagamento
   */
  async deletePaymentLink(id: string): Promise<void> {
    const { error } = await supabase
      .from('payment_links')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
  
  // ========================================
  // PROCESSAMENTO DE CHECKOUT
  // ========================================
  
  /**
   * Cria transação de checkout e gera PIX
   */
  async createCheckout(params: CreateCheckoutParams): Promise<{
    success: boolean
    transaction?: CheckoutTransaction
    pix_code?: string
    pix_qr_code?: string
    error?: string
  }> {
    try {
      // 1. Buscar link de pagamento
      const { data: link, error: linkError } = await supabase
        .from('payment_links')
        .select('*')
        .eq('id', params.payment_link_id)
        .single()
      
      if (linkError || !link) {
        return { success: false, error: 'Link de pagamento não encontrado' }
      }
      
      // 2. Validar se está ativo
      if (!link.is_active) {
        return { success: false, error: 'Link de pagamento inativo' }
      }
      
      // 3. Validar expiração
      if (link.expires_at && new Date(link.expires_at) < new Date()) {
        return { success: false, error: 'Link de pagamento expirado' }
      }
      
      // 4. Validar limite de usos
      if (link.max_uses && link.current_uses >= link.max_uses) {
        return { success: false, error: 'Limite de usos atingido' }
      }
      
      // 5. Calcular valores
      const quantity = params.quantity || 1
      let unitAmount: number
      
      if (link.price_type === 'fixed') {
        unitAmount = link.amount || 0
      } else {
        // Preço variável
        unitAmount = params.custom_amount || link.min_amount || 0
        
        if (link.min_amount && unitAmount < link.min_amount) {
          return { success: false, error: `Valor mínimo: R$ ${link.min_amount.toFixed(2)}` }
        }
        
        if (link.max_amount && unitAmount > link.max_amount) {
          return { success: false, error: `Valor máximo: R$ ${link.max_amount.toFixed(2)}` }
        }
      }
      
      // 6. Validar quantidade
      if (link.allow_quantity && quantity > link.max_quantity) {
        return { success: false, error: `Quantidade máxima: ${link.max_quantity}` }
      }
      
      const totalAmount = unitAmount * quantity
      const feeAmount = totalAmount * 0.035 // 3.5%
      const netAmount = totalAmount - feeAmount
      
      // 7. Gerar PIX via adquirente
      const pixResult = await bankAcquirerService.createPixPayment({
        amount: totalAmount,
        description: `${link.title} (${quantity}x)`,
        user_id: link.user_id,
        expires_in_minutes: 30
      })
      
      if (!pixResult.success) {
        return { success: false, error: pixResult.error }
      }
      
      // 8. Criar transação de checkout
      const transaction: Partial<CheckoutTransaction> = {
        payment_link_id: params.payment_link_id,
        user_id: link.user_id,
        pix_transaction_id: pixResult.transaction_id,
        payer_name: params.payer_name,
        payer_email: params.payer_email,
        payer_phone: params.payer_phone,
        payer_document: params.payer_document,
        quantity,
        unit_amount: unitAmount,
        total_amount: totalAmount,
        fee_amount: feeAmount,
        net_amount: netAmount,
        status: 'pending',
        pix_code: pixResult.pix_code,
        pix_qr_code: pixResult.pix_qr_code,
        expires_at: pixResult.expires_at
      }
      
      const { data, error } = await supabase
        .from('checkout_transactions')
        .insert(transaction)
        .select()
        .single()
      
      if (error) throw error
      
      return {
        success: true,
        transaction: data,
        pix_code: pixResult.pix_code,
        pix_qr_code: pixResult.pix_qr_code
      }
      
    } catch (error: any) {
      console.error('Erro ao criar checkout:', error)
      return {
        success: false,
        error: error.message || 'Erro ao processar checkout'
      }
    }
  }
  
  /**
   * Busca transações de um link
   */
  async getLinkTransactions(linkId: string): Promise<CheckoutTransaction[]> {
    const { data, error } = await supabase
      .from('checkout_transactions')
      .select('*')
      .eq('payment_link_id', linkId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }
  
  /**
   * Busca estatísticas de um link
   */
  async getLinkStatistics(linkId: string) {
    const { data, error } = await supabase
      .from('payment_link_statistics')
      .select('*')
      .eq('id', linkId)
      .single()
    
    if (error) {
      console.error('Erro ao buscar estatísticas:', error)
      return null
    }
    
    return data
  }
  
  /**
   * Confirma pagamento de checkout
   */
  async confirmCheckoutPayment(transactionId: string): Promise<void> {
    const { error } = await supabase
      .from('checkout_transactions')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString()
      })
      .eq('id', transactionId)
    
    if (error) throw error
  }
}

// Exportar instância única
export const checkoutService = new CheckoutService()
