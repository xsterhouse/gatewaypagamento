// Biblioteca para integração com Mercado Pago
import { supabase } from './supabase'

const MP_PUBLIC_KEY = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY || ''

interface CreatePixPaymentParams {
  userId: string
  amount: number
  description?: string
}

interface CreatePixPaymentResponse {
  success: boolean
  paymentId?: string
  qrCode?: string
  qrCodeBase64?: string
  expiresAt?: string
  error?: string
}

interface ProcessWithdrawalParams {
  userId: string
  amount: number
  pixKey: string
  pixKeyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random'
  description?: string
}

/**
 * Criar pagamento PIX (Depósito)
 */
export async function createPixPayment({
  userId,
  amount,
  description = 'Depósito via PIX'
}: CreatePixPaymentParams): Promise<CreatePixPaymentResponse> {
  try {
    console.log('🔵 Criando pagamento PIX:', { userId, amount, description })

    // Calcular taxa (exemplo: 1%)
    const fee = amount * 0.01
    const netAmount = amount - fee

    // Criar registro na tabela pix_transactions
    const { data: transaction, error: dbError } = await supabase
      .from('pix_transactions')
      .insert({
        user_id: userId,
        type: 'deposit',
        amount,
        fee,
        net_amount: netAmount,
        status: 'pending',
        description,
        mp_external_reference: `DEP-${userId}-${Date.now()}`
      })
      .select()
      .single()

    if (dbError) {
      console.error('❌ Erro ao criar transação:', dbError)
      throw dbError
    }

    console.log('✅ Transação criada:', transaction.id)

    // Chamar API do Mercado Pago via serverless function
    const response = await fetch('/api/mercadopago/create-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        transactionId: transaction.id,
        amount,
        description,
        externalReference: transaction.mp_external_reference
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Erro ao criar pagamento')
    }

    const paymentData = await response.json()

    // Atualizar transação com dados do MP
    await supabase
      .from('pix_transactions')
      .update({
        mp_payment_id: paymentData.id,
        mp_qr_code: paymentData.qr_code,
        mp_qr_code_base64: paymentData.qr_code_base64,
        expires_at: paymentData.expires_at
      })
      .eq('id', transaction.id)

    console.log('✅ Pagamento PIX criado:', paymentData.id)

    return {
      success: true,
      paymentId: paymentData.id,
      qrCode: paymentData.qr_code,
      qrCodeBase64: paymentData.qr_code_base64,
      expiresAt: paymentData.expires_at
    }
  } catch (error: any) {
    console.error('❌ Erro ao criar pagamento PIX:', error)
    return {
      success: false,
      error: error.message || 'Erro ao criar pagamento PIX'
    }
  }
}

/**
 * Processar saque PIX
 */
export async function processWithdrawal({
  userId,
  amount,
  pixKey,
  pixKeyType,
  description = 'Saque via PIX'
}: ProcessWithdrawalParams): Promise<CreatePixPaymentResponse> {
  try {
    console.log('🔵 Processando saque PIX:', { userId, amount, pixKey, pixKeyType })

    // Verificar saldo
    const { data: balance, error: balanceError } = await supabase
      .from('user_balances')
      .select('available_balance')
      .eq('user_id', userId)
      .single()

    if (balanceError || !balance) {
      throw new Error('Erro ao verificar saldo')
    }

    if (balance.available_balance < amount) {
      throw new Error('Saldo insuficiente')
    }

    // Calcular taxa (exemplo: R$ 2,00 fixo)
    const fee = 2.00
    const netAmount = amount - fee

    // Criar registro na tabela pix_transactions
    const { data: transaction, error: dbError } = await supabase
      .from('pix_transactions')
      .insert({
        user_id: userId,
        type: 'withdrawal',
        amount,
        fee,
        net_amount: netAmount,
        status: 'pending',
        description,
        pix_key: pixKey,
        pix_key_type: pixKeyType,
        mp_external_reference: `WIT-${userId}-${Date.now()}`
      })
      .select()
      .single()

    if (dbError) {
      console.error('❌ Erro ao criar transação:', dbError)
      throw dbError
    }

    console.log('✅ Transação criada:', transaction.id)

    // Chamar API do Mercado Pago via serverless function
    const response = await fetch('/api/mercadopago/process-withdrawal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        transactionId: transaction.id,
        amount: netAmount,
        pixKey,
        pixKeyType,
        description,
        externalReference: transaction.mp_external_reference
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Erro ao processar saque')
    }

    const withdrawalData = await response.json()

    // Atualizar transação com dados do MP
    await supabase
      .from('pix_transactions')
      .update({
        mp_payment_id: withdrawalData.id,
        status: 'processing'
      })
      .eq('id', transaction.id)

    // Bloquear saldo
    await supabase.rpc('update_user_balance', {
      p_user_id: userId,
      p_amount: amount,
      p_operation: 'subtract'
    })

    console.log('✅ Saque PIX processado:', withdrawalData.id)

    return {
      success: true,
      paymentId: withdrawalData.id
    }
  } catch (error: any) {
    console.error('❌ Erro ao processar saque PIX:', error)
    return {
      success: false,
      error: error.message || 'Erro ao processar saque PIX'
    }
  }
}

/**
 * Consultar status de pagamento
 */
export async function getPaymentStatus(paymentId: string) {
  try {
    const response = await fetch(`/api/mercadopago/payment-status/${paymentId}`)
    
    if (!response.ok) {
      throw new Error('Erro ao consultar status')
    }

    return await response.json()
  } catch (error: any) {
    console.error('❌ Erro ao consultar status:', error)
    throw error
  }
}

export { MP_PUBLIC_KEY }
