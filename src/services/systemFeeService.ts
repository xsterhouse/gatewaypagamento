import { supabase } from '@/lib/supabase'

// ========================================
// TIPOS E INTERFACES
// ========================================

export interface SystemFee {
  id: string
  operation_type: 'pix_receive' | 'pix_send' | 'withdrawal'
  fee_percentage: number
  fee_fixed: number
  min_fee: number
  max_fee?: number
  is_active: boolean
  description?: string
}

export interface FeeCollection {
  id?: string
  user_id: string
  transaction_id?: string
  operation_type: string
  transaction_amount: number
  fee_amount: number
  status: 'collected' | 'refunded'
  metadata?: Record<string, any>
  collected_at?: string
}

// ========================================
// SERVIÇO DE TAXAS DO SISTEMA
// ========================================

class SystemFeeService {
  
  /**
   * Calcular taxa do sistema para uma operação
   */
  async calculateFee(
    operationType: 'pix_receive' | 'pix_send' | 'withdrawal',
    amount: number
  ): Promise<number> {
    try {
      // Buscar configuração de taxa
      const { data, error } = await supabase
        .from('system_fees')
        .select('*')
        .eq('operation_type', operationType)
        .eq('is_active', true)
        .single()
      
      if (error || !data) {
        console.log('Taxa não configurada, usando padrão: R$ 0,05')
        return 0.05 // Taxa padrão
      }
      
      // Calcular taxa
      let calculatedFee = (amount * data.fee_percentage) + data.fee_fixed
      
      // Aplicar taxa mínima
      if (calculatedFee < data.min_fee) {
        calculatedFee = data.min_fee
      }
      
      // Aplicar taxa máxima (se configurada)
      if (data.max_fee && calculatedFee > data.max_fee) {
        calculatedFee = data.max_fee
      }
      
      return calculatedFee
      
    } catch (error) {
      console.error('Erro ao calcular taxa:', error)
      return 0.05 // Taxa padrão em caso de erro
    }
  }
  
  /**
   * Coletar taxa do sistema
   */
  async collectFee(params: {
    user_id: string
    transaction_id?: string
    operation_type: 'pix_receive' | 'pix_send' | 'withdrawal'
    transaction_amount: number
    fee_amount: number
    metadata?: Record<string, any>
  }): Promise<{ success: boolean; collection_id?: string; error?: string }> {
    try {
      const collection: Omit<FeeCollection, 'id' | 'collected_at'> = {
        user_id: params.user_id,
        transaction_id: params.transaction_id,
        operation_type: params.operation_type,
        transaction_amount: params.transaction_amount,
        fee_amount: params.fee_amount,
        status: 'collected',
        metadata: params.metadata
      }
      
      const { data, error } = await supabase
        .from('system_fee_collections')
        .insert(collection)
        .select()
        .single()
      
      if (error) throw error
      
      console.log(`✅ Taxa coletada: R$ ${params.fee_amount.toFixed(2)} (${params.operation_type})`)
      
      return {
        success: true,
        collection_id: data.id
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao coletar taxa:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
  
  /**
   * Estornar taxa (em caso de falha na transação)
   */
  async refundFee(collectionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('system_fee_collections')
        .update({ status: 'refunded' })
        .eq('id', collectionId)
      
      if (error) throw error
      
      console.log('✅ Taxa estornada')
      
      return { success: true }
      
    } catch (error: any) {
      console.error('❌ Erro ao estornar taxa:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
  
  /**
   * Buscar configuração de taxa
   */
  async getFeeConfig(operationType: string): Promise<SystemFee | null> {
    try {
      const { data, error } = await supabase
        .from('system_fees')
        .select('*')
        .eq('operation_type', operationType)
        .single()
      
      if (error) throw error
      return data
      
    } catch (error) {
      console.error('Erro ao buscar configuração:', error)
      return null
    }
  }
  
  /**
   * Atualizar configuração de taxa (apenas admin)
   */
  async updateFeeConfig(
    operationType: string,
    config: Partial<SystemFee>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('system_fees')
        .update(config)
        .eq('operation_type', operationType)
      
      if (error) throw error
      
      console.log('✅ Configuração de taxa atualizada')
      
      return { success: true }
      
    } catch (error: any) {
      console.error('❌ Erro ao atualizar configuração:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
  
  /**
   * Buscar histórico de taxas coletadas
   */
  async getFeeHistory(userId?: string, limit: number = 50) {
    try {
      let query = supabase
        .from('system_fee_collections')
        .select('*')
        .order('collected_at', { ascending: false })
        .limit(limit)
      
      if (userId) {
        query = query.eq('user_id', userId)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      return data || []
      
    } catch (error) {
      console.error('Erro ao buscar histórico:', error)
      return []
    }
  }
  
  /**
   * Relatório de taxas coletadas
   */
  async getFeeReport(startDate?: string, endDate?: string) {
    try {
      let query = supabase
        .from('system_fee_report')
        .select('*')
        .order('date', { ascending: false })
      
      if (startDate) {
        query = query.gte('date', startDate)
      }
      
      if (endDate) {
        query = query.lte('date', endDate)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      return data || []
      
    } catch (error) {
      console.error('Erro ao buscar relatório:', error)
      return []
    }
  }
  
  /**
   * Total de taxas coletadas
   */
  async getTotalFeesCollected(period?: 'today' | 'week' | 'month' | 'all'): Promise<number> {
    try {
      let query = supabase
        .from('system_fee_collections')
        .select('fee_amount')
        .eq('status', 'collected')
      
      // Filtrar por período
      if (period === 'today') {
        query = query.gte('collected_at', new Date().toISOString().split('T')[0])
      } else if (period === 'week') {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        query = query.gte('collected_at', weekAgo.toISOString())
      } else if (period === 'month') {
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        query = query.gte('collected_at', monthAgo.toISOString())
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      const total = data?.reduce((sum, item) => sum + parseFloat(item.fee_amount.toString()), 0) || 0
      
      return total
      
    } catch (error) {
      console.error('Erro ao calcular total:', error)
      return 0
    }
  }
}

// Exportar instância única
export const systemFeeService = new SystemFeeService()
