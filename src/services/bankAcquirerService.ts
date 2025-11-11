import { supabase } from '@/lib/supabase'

// ========================================
// TIPOS E INTERFACES
// ========================================

export interface BankAcquirer {
  id: string
  name: string
  bank_code: string
  client_id?: string
  client_secret?: string
  certificate?: string
  pix_key?: string
  pix_key_type?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random'
  account_number?: string
  account_digit?: string
  agency?: string
  agency_digit?: string
  api_base_url?: string
  api_auth_url?: string
  api_pix_url?: string
  is_active: boolean
  is_default: boolean
  environment: 'sandbox' | 'production'
  daily_limit?: number
  transaction_limit?: number
  fee_percentage?: number
  fee_fixed?: number
  description?: string
  logo_url?: string
  // Webhook fields
  webhook_url?: string
  webhook_secret?: string
  webhook_events?: string[]
  webhook_enabled?: boolean
  status: 'active' | 'inactive' | 'maintenance'
  created_at: string
  updated_at: string
}

export interface PixTransaction {
  id?: string
  user_id: string
  acquirer_id?: string
  deposit_id?: string
  transaction_type: 'deposit' | 'withdrawal' | 'transfer'
  amount: number
  fee_amount: number
  net_amount: number
  pix_code?: string
  pix_qr_code?: string
  pix_key?: string
  pix_key_type?: string
  pix_txid?: string
  pix_e2e_id?: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  description?: string
  error_message?: string
  payer_name?: string
  payer_document?: string
  receiver_name?: string
  receiver_document?: string
  expires_at?: string
  metadata?: Record<string, any>
}

export interface CreatePixPaymentParams {
  amount: number
  description: string
  user_id: string
  acquirer_id?: string
  expires_in_minutes?: number
}

export interface SendPixParams {
  user_id: string
  amount: number
  description: string
  pix_key: string
  pix_key_type: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random'
  receiver_name?: string
  receiver_document?: string
  acquirer_id?: string
}

export interface SendPixResponse {
  success: boolean
  transaction_id?: string
  e2e_id?: string
  error?: string
}

export interface PixPaymentResponse {
  success: boolean
  transaction_id?: string
  pix_code?: string
  pix_qr_code?: string
  expires_at?: string
  error?: string
}

// ========================================
// SERVIÇO DE ADQUIRENTES BANCÁRIOS
// ========================================

class BankAcquirerService {
  
  // ========================================
  // GERENCIAMENTO DE ADQUIRENTES
  // ========================================
  
  /**
   * Busca todos os adquirentes
   */
  async getAllAcquirers(): Promise<BankAcquirer[]> {
    const { data, error } = await supabase
      .from('bank_acquirers')
      .select('*')
      .order('is_default', { ascending: false })
      .order('name')
    
    if (error) throw error
    return data || []
  }
  
  /**
   * Busca adquirentes ativos
   */
  async getActiveAcquirers(): Promise<BankAcquirer[]> {
    const { data, error } = await supabase
      .from('bank_acquirers')
      .select('*')
      .eq('is_active', true)
      .eq('status', 'active')
      .order('is_default', { ascending: false })
      .order('name')
    
    if (error) throw error
    return data || []
  }
  
  /**
   * Busca o adquirente padrão
   */
  async getDefaultAcquirer(): Promise<BankAcquirer | null> {
    const { data, error } = await supabase
      .from('bank_acquirers')
      .select('*')
      .eq('is_default', true)
      .eq('is_active', true)
      .single()
    
    if (error) {
      console.error('Erro ao buscar adquirente padrão:', error)
      return null
    }
    
    return data
  }
  
  /**
   * Busca um adquirente por ID
   */
  async getAcquirerById(id: string): Promise<BankAcquirer | null> {
    const { data, error } = await supabase
      .from('bank_acquirers')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Erro ao buscar adquirente:', error)
      return null
    }
    
    return data
  }
  
  /**
   * Cria um novo adquirente
   */
  async createAcquirer(acquirer: Partial<BankAcquirer>): Promise<BankAcquirer> {
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from('bank_acquirers')
      .insert({
        ...acquirer,
        created_by: user?.id
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }
  
  /**
   * Atualiza um adquirente
   */
  async updateAcquirer(id: string, updates: Partial<BankAcquirer>): Promise<BankAcquirer> {
    const { data, error } = await supabase
      .from('bank_acquirers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
  
  /**
   * Define um adquirente como padrão
   */
  async setDefaultAcquirer(id: string): Promise<void> {
    const { error } = await supabase
      .from('bank_acquirers')
      .update({ is_default: true })
      .eq('id', id)
    
    if (error) throw error
  }
  
  /**
   * Deleta um adquirente
   */
  async deleteAcquirer(id: string): Promise<void> {
    const { error } = await supabase
      .from('bank_acquirers')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
  
  // ========================================
  // INTEGRAÇÃO PIX
  // ========================================
  
  /**
   * Cria um pagamento PIX
   */
  async createPixPayment(params: CreatePixPaymentParams): Promise<PixPaymentResponse> {
    try {
      // 1. Buscar adquirente (padrão ou específico)
      const acquirer = params.acquirer_id 
        ? await this.getAcquirerById(params.acquirer_id)
        : await this.getDefaultAcquirer()
      
      if (!acquirer) {
        return {
          success: false,
          error: 'Nenhum adquirente disponível'
        }
      }
      
      // 2. Validar limites
      if (acquirer.transaction_limit && params.amount > acquirer.transaction_limit) {
        return {
          success: false,
          error: `Valor excede o limite de R$ ${acquirer.transaction_limit.toFixed(2)}`
        }
      }
      
      // 3. Calcular taxas
      const feePercentage = acquirer.fee_percentage || 0
      const feeFixed = acquirer.fee_fixed || 0
      const feeAmount = (params.amount * feePercentage) + feeFixed
      const netAmount = params.amount - feeAmount
      
      // 4. Gerar código PIX
      const pixCode = this.generatePixCode(params.amount, acquirer)
      const pixQrCode = await this.generateQRCode(pixCode)
      
      // 5. Calcular expiração
      const expiresInMinutes = params.expires_in_minutes || 30
      const expiresAt = new Date()
      expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes)
      
      // 6. Criar transação no banco
      const transaction: Partial<PixTransaction> = {
        user_id: params.user_id,
        acquirer_id: acquirer.id,
        transaction_type: 'deposit',
        amount: params.amount,
        fee_amount: feeAmount,
        net_amount: netAmount,
        pix_code: pixCode,
        pix_qr_code: pixQrCode,
        pix_key: acquirer.pix_key,
        pix_key_type: acquirer.pix_key_type,
        status: 'pending',
        description: params.description,
        expires_at: expiresAt.toISOString(),
        metadata: {
          acquirer_name: acquirer.name,
          bank_code: acquirer.bank_code
        }
      }
      
      const { data, error } = await supabase
        .from('pix_transactions')
        .insert(transaction)
        .select()
        .single()
      
      if (error) throw error
      
      // 7. Se for Mercado Pago, usar API real
      if (acquirer.bank_code === 'MP' && acquirer.client_secret) {
        try {
          const mpResponse = await fetch('/api/debug-create-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              transactionId: data.id,
              amount: params.amount,
              description: params.description,
              externalReference: `PIX-${data.id}`
            })
          })

          if (mpResponse.ok) {
            const mpData = await mpResponse.json()
            console.log('🔧 Debug response:', mpData)
            
            // Gerar PIX simulado temporariamente
            const tempPixCode = `00020126580014br.gov.bcb.pix0136${acquirer.pix_key || 'test@dimpay.com.br'}520400005303986540${amount.toFixed(2)}5802BR5920DiMPay PIX6009SAOPAULO62070503***6304${Math.random().toString(36).substring(2, 8).toUpperCase()}`
            
            // Atualizar transação
            await supabase
              .from('pix_transactions')
              .update({
                pix_code: tempPixCode,
                pix_qr_code: tempPixCode,
                pix_txid: `DEBUG-${data.id}`,
                expires_at: expiresAt.toISOString()
              })
              .eq('id', data.id)
            
            return {
              success: true,
              transaction_id: data.id,
              pix_code: tempPixCode,
              pix_qr_code: tempPixCode,
              expires_at: expiresAt.toISOString()
            }
          }
        } catch (mpError) {
          console.error('Erro ao chamar API do Mercado Pago:', mpError)
          // Continua com o código simulado se a API falhar
        }
      }
      
      // 8. Se for ambiente de produção de outros bancos, fazer chamada real à API
      if (acquirer.environment === 'production' && acquirer.api_base_url && acquirer.bank_code !== 'MP') {
        await this.callBankAPI(acquirer, data)
      }
      
      return {
        success: true,
        transaction_id: data.id,
        pix_code: pixCode,
        pix_qr_code: pixQrCode,
        expires_at: expiresAt.toISOString()
      }
      
    } catch (error: any) {
      console.error('Erro ao criar pagamento PIX:', error)
      return {
        success: false,
        error: error.message || 'Erro ao criar pagamento PIX'
      }
    }
  }
  
  /**
   * Gera código PIX EMV (padrão brasileiro)
   */
  private generatePixCode(amount: number, acquirer: BankAcquirer): string {
    const pixKey = acquirer.pix_key || 'chavepix@exemplo.com'
    const merchantName = acquirer.name.substring(0, 25)
    
    // Gerar ID único para a transação
    const txid = this.generateTxId()
    
    // Formato EMV do PIX
    const payload = [
      '00020126', // Payload Format Indicator
      '580014br.gov.bcb.pix', // Merchant Account Information
      `0136${pixKey}`, // Chave PIX
      '52040000', // Merchant Category Code
      '5303986', // Transaction Currency (986 = BRL)
      `54${String(amount.toFixed(2)).length.toString().padStart(2, '0')}${amount.toFixed(2)}`,
      '5802BR', // Country Code
      `59${merchantName.length.toString().padStart(2, '0')}${merchantName}`,
      '6009SAO PAULO',
      `62${(7 + txid.length).toString().padStart(2, '0')}05${txid.length.toString().padStart(2, '0')}${txid}`,
      '6304' // CRC16 placeholder
    ].join('')
    
    // Calcular CRC16
    const crc = this.calculateCRC16(payload)
    return payload + crc
  }
  
  /**
   * Gera ID de transação único
   */
  private generateTxId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15)
  }
  
  /**
   * Calcula CRC16 para código PIX
   */
  private calculateCRC16(payload: string): string {
    // Implementação simplificada - em produção usar biblioteca específica
    let crc = 0xFFFF
    
    for (let i = 0; i < payload.length; i++) {
      crc ^= payload.charCodeAt(i) << 8
      
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = (crc << 1) ^ 0x1021
        } else {
          crc = crc << 1
        }
      }
    }
    
    crc = crc & 0xFFFF
    return crc.toString(16).toUpperCase().padStart(4, '0')
  }
  
  /**
   * Gera QR Code em base64
   */
  private async generateQRCode(pixCode: string): Promise<string> {
    // Em produção, usar biblioteca como qrcode
    // Por enquanto retorna o código como base64 simples
    return btoa(pixCode)
  }
  
  /**
   * Chama API do banco (Banco Inter, etc)
   */
  private async callBankAPI(acquirer: BankAcquirer, transaction: any): Promise<void> {
    try {
      // Aqui você implementaria a chamada real à API do Banco Inter
      // Exemplo de estrutura:
      
      const apiLog = {
        acquirer_id: acquirer.id,
        transaction_id: transaction.id,
        endpoint: acquirer.api_pix_url,
        method: 'POST',
        request_body: {
          amount: transaction.amount,
          pix_key: acquirer.pix_key
        },
        success: true
      }
      
      // Salvar log
      await supabase.from('acquirer_api_logs').insert(apiLog)
      
    } catch (error: any) {
      console.error('Erro ao chamar API do banco:', error)
      
      // Salvar log de erro
      await supabase.from('acquirer_api_logs').insert({
        acquirer_id: acquirer.id,
        transaction_id: transaction.id,
        endpoint: acquirer.api_pix_url,
        method: 'POST',
        success: false,
        error_message: error.message
      })
    }
  }
  
  /**
   * Verifica status de uma transação PIX
   */
  async checkPixTransactionStatus(transactionId: string): Promise<PixTransaction | null> {
    const { data, error } = await supabase
      .from('pix_transactions')
      .select('*')
      .eq('id', transactionId)
      .single()
    
    if (error) {
      console.error('Erro ao verificar transação:', error)
      return null
    }
    
    return data
  }
  
  /**
   * Confirma pagamento PIX (webhook ou verificação manual)
   */
  async confirmPixPayment(transactionId: string, e2eId?: string): Promise<void> {
    const updates: Partial<PixTransaction> = {
      status: 'completed',
      pix_e2e_id: e2eId
    }
    
    const { error } = await supabase
      .from('pix_transactions')
      .update(updates)
      .eq('id', transactionId)
    
    if (error) throw error
  }
  
  /**
   * Cancela transação PIX
   */
  async cancelPixTransaction(transactionId: string, reason?: string): Promise<void> {
    const { error } = await supabase
      .from('pix_transactions')
      .update({
        status: 'cancelled',
        error_message: reason
      })
      .eq('id', transactionId)
    
    if (error) throw error
  }
  
  /**
   * Busca transações de um usuário
   */
  async getUserTransactions(userId: string, limit = 50): Promise<PixTransaction[]> {
    const { data, error } = await supabase
      .from('pix_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  }
  
  /**
   * Busca estatísticas de um adquirente
   */
  async getAcquirerStatistics(acquirerId: string) {
    const { data, error } = await supabase
      .from('acquirer_statistics')
      .select('*')
      .eq('id', acquirerId)
      .single()
    
    if (error) {
      console.error('Erro ao buscar estatísticas:', error)
      return null
    }
    
    return data
  }
  
  // ========================================
  // ENVIO DE PIX
  // ========================================
  
  /**
   * Enviar PIX para uma chave
   */
  async sendPix(params: SendPixParams): Promise<SendPixResponse> {
    try {
      console.log('💸 Iniciando envio de PIX:', params)
      
      // 1. Buscar adquirente
      const acquirer = params.acquirer_id 
        ? await this.getAcquirerById(params.acquirer_id)
        : await this.getDefaultAcquirer()
      
      if (!acquirer) {
        return {
          success: false,
          error: 'Nenhum adquirente disponível'
        }
      }
      
      // 2. Validar limites
      if (acquirer.transaction_limit && params.amount > acquirer.transaction_limit) {
        return {
          success: false,
          error: `Valor excede o limite de R$ ${acquirer.transaction_limit.toFixed(2)}`
        }
      }
      
      // 3. Calcular taxas
      const feePercentage = acquirer.fee_percentage || 0
      const feeFixed = acquirer.fee_fixed || 0
      const feeAmount = (params.amount * feePercentage) + feeFixed
      const netAmount = params.amount + feeAmount // Usuário paga a taxa
      
      // 4. Gerar E2E ID único
      const e2eId = this.generateE2EId()
      
      // 5. Criar transação no banco
      const transaction: Partial<PixTransaction> = {
        user_id: params.user_id,
        acquirer_id: acquirer.id,
        transaction_type: 'withdrawal',
        amount: params.amount,
        fee_amount: feeAmount,
        net_amount: netAmount,
        pix_key: params.pix_key,
        pix_key_type: params.pix_key_type,
        pix_e2e_id: e2eId,
        status: 'processing',
        description: params.description,
        receiver_name: params.receiver_name,
        receiver_document: params.receiver_document,
        metadata: {
          acquirer_name: acquirer.name,
          bank_code: acquirer.bank_code
        }
      }
      
      const { data, error } = await supabase
        .from('pix_transactions')
        .insert(transaction)
        .select()
        .single()
      
      if (error) throw error
      
      // 6. Se for ambiente de produção, fazer chamada real à API do banco
      if (acquirer.environment === 'production' && acquirer.api_base_url) {
        const apiResult = await this.callBankAPIForSend(acquirer, data, params)
        
        if (!apiResult.success) {
          // Marcar como falha
          await supabase
            .from('pix_transactions')
            .update({ 
              status: 'failed',
              error_message: apiResult.error 
            })
            .eq('id', data.id)
          
          return {
            success: false,
            error: apiResult.error
          }
        }
      }
      
      console.log('✅ PIX enviado com sucesso:', data.id)
      
      return {
        success: true,
        transaction_id: data.id,
        e2e_id: e2eId
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao enviar PIX:', error)
      return {
        success: false,
        error: error.message || 'Erro ao enviar PIX'
      }
    }
  }
  
  /**
   * Gerar End-to-End ID único
   */
  private generateE2EId(): string {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').substring(0, 14)
    const random = Math.random().toString(36).substring(2, 12).toUpperCase()
    return `E${timestamp}${random}`
  }
  
  /**
   * Chamar API do banco para enviar PIX
   */
  private async callBankAPIForSend(
    acquirer: BankAcquirer, 
    transaction: any,
    params: SendPixParams
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Aqui você implementaria a chamada real à API do Banco Inter
      // Exemplo de estrutura:
      
      const apiLog = {
        acquirer_id: acquirer.id,
        transaction_id: transaction.id,
        endpoint: `${acquirer.api_pix_url}/send`,
        method: 'POST',
        request_body: {
          amount: params.amount,
          pix_key: params.pix_key,
          pix_key_type: params.pix_key_type,
          description: params.description
        },
        success: true
      }
      
      // Salvar log
      await supabase.from('acquirer_api_logs').insert(apiLog)
      
      return { success: true }
      
    } catch (error: any) {
      console.error('Erro ao chamar API do banco:', error)
      
      // Salvar log de erro
      await supabase.from('acquirer_api_logs').insert({
        acquirer_id: acquirer.id,
        transaction_id: transaction.id,
        endpoint: `${acquirer.api_pix_url}/send`,
        method: 'POST',
        success: false,
        error_message: error.message
      })
      
      return { 
        success: false, 
        error: error.message 
      }
    }
  }
}

// Exportar instância única
export const bankAcquirerService = new BankAcquirerService()
