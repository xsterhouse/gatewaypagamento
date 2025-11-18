import { supabase } from '@/lib/supabase'

// ========================================
// TIPOS
// ========================================

export interface CreateBoletoParams {
  user_id: string
  amount: number
  description: string
  payer_name?: string
  payer_email?: string
  payer_document?: string
  payer_address?: {
    street: string
    number: string
    neighborhood: string
    city: string
    state: string
    zip_code: string
  }
  due_date?: Date
}

export interface BoletoResult {
  success: boolean
  boleto_id?: string
  barcode?: string
  digitable_line?: string
  pdf_url?: string
  due_date?: string
  error?: string
}

// ========================================
// SERVIÇO DE BOLETOS
// ========================================

class BoletoService {
  
  /**
   * Criar boleto no Mercado Pago (via Edge Function)
   */
  async createBoleto(params: CreateBoletoParams): Promise<BoletoResult> {
    try {
      console.log('📄 Criando boleto...', params)

      // 1. Calcular data de vencimento (padrão: 3 dias)
      const dueDate = params.due_date || new Date()
      if (!params.due_date) {
        dueDate.setDate(dueDate.getDate() + 3)
      }

      // 3. Chamar Edge Function do Supabase para criar o boleto no Mercado Pago
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      const response = await fetch(`${supabaseUrl}/functions/v1/mercadopago-create-boleto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          amount: params.amount,
          description: params.description,
          due_date: dueDate.toISOString(),
          payer: {
            name: params.payer_name,
            email: params.payer_email,
            document: params.payer_document,
            address: params.payer_address
          }
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        console.error('❌ Erro ao criar boleto (Edge Function):', data)
        throw new Error(data.error || 'Erro ao criar boleto')
      }

      console.log('✅ Boleto criado (Edge Function):', data.id)

      // 5. Retornar dados do boleto; o registro em invoices_boletos é feito na Faturas.tsx
      return {
        success: true,
        boleto_id: data.id?.toString(),
        barcode: data.barcode,
        digitable_line: data.digitable_line,
        pdf_url: data.pdf_url,
        due_date: data.date_of_expiration || dueDate.toISOString()
      }

    } catch (error: any) {
      console.error('❌ Erro ao criar boleto:', error)
      return {
        success: false,
        error: error.message || 'Erro ao criar boleto'
      }
    }
  }

  /**
   * Consultar status do boleto
   */
  async checkBoletoStatus(boleto_id: string): Promise<{
    status: string
    paid_at?: string
  }> {
    try {
      const { data: transaction } = await supabase
        .from('pix_transactions')
        .select('*')
        .eq('id', boleto_id)
        .single()

      if (!transaction) {
        throw new Error('Boleto não encontrado')
      }

      // Buscar no Mercado Pago
      const { data: acquirer } = await supabase
        .from('bank_acquirers')
        .select('*')
        .eq('name', 'Mercado Pago')
        .eq('is_active', true)
        .single()

      if (!acquirer) {
        throw new Error('Mercado Pago não configurado')
      }

      const response = await fetch(
        `${acquirer.api_base_url}/v1/payments/${transaction.pix_txid}`,
        {
          headers: {
            'Authorization': `Bearer ${acquirer.client_secret}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Erro ao consultar status')
      }

      const data = await response.json()

      // Mapear status
      const statusMap: { [key: string]: string } = {
        'pending': 'pending',
        'approved': 'completed',
        'rejected': 'failed',
        'cancelled': 'cancelled',
        'refunded': 'cancelled'
      }

      return {
        status: statusMap[data.status] || 'pending',
        paid_at: data.status === 'approved' ? data.date_approved : undefined
      }

    } catch (error: any) {
      console.error('❌ Erro ao consultar status:', error)
      return { status: 'error' }
    }
  }

  /**
   * Listar boletos do usuário
   */
  async listUserBoletos(user_id: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('pix_transactions')
        .select('*')
        .eq('user_id', user_id)
        .eq('transaction_type', 'deposit')
        .contains('metadata', { payment_method: 'boleto' })
        .order('created_at', { ascending: false })

      if (error) throw error

      return data || []

    } catch (error) {
      console.error('❌ Erro ao listar boletos:', error)
      return []
    }
  }
}

export const boletoService = new BoletoService()
