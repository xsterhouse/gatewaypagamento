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

    // Verificar saldo na carteira
    const { data: wallet, error: balanceError } = await supabase
      .from('wallets')
      .select('available_balance')
      .eq('user_id', userId)
      .eq('currency_code', 'BRL')
      .eq('is_active', true)
      .single()

    if (balanceError || !wallet) {
      throw new Error('Carteira não encontrada')
    }

    if (wallet.available_balance < amount) {
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
        transaction_type: 'withdrawal',
        amount,
        fee_amount: fee,
        net_amount: netAmount,
        status: 'pending',
        pix_code: pixKey,
        metadata: {
          description,
          pix_key: pixKey,
          pix_key_type: pixKeyType,
          mp_external_reference: `WIT-${userId}-${Date.now()}`
        }
      })
      .select()
      .single()

    if (dbError) {
      console.error('❌ Erro ao criar transação:', dbError)
      throw dbError
    }

    console.log('✅ Transação criada:', transaction.id)

    // NOTA: Mercado Pago não tem API para ENVIAR PIX (apenas receber)
    // Por enquanto, marcar como 'pending' para processamento manual
    // TODO: Integrar com provedor de envio de PIX (ex: Asaas, PagSeguro, etc)
    
    await supabase
      .from('pix_transactions')
      .update({
        status: 'pending',
        metadata: {
          ...transaction.metadata,
          requires_manual_processing: true,
          note: 'Aguardando integração com provedor de envio de PIX'
        }
      })
      .eq('id', transaction.id)

    // Buscar ID da carteira
    const { data: userWallet } = await supabase
      .from('wallets')
      .select('id, available_balance')
      .eq('user_id', userId)
      .eq('currency_code', 'BRL')
      .eq('is_active', true)
      .single()

    if (userWallet) {
      const totalAmount = amount + fee
      const balanceBefore = Number(userWallet.available_balance) || 0
      const balanceAfter = balanceBefore - totalAmount

      // Debitar da carteira
      await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: userWallet.id,
          user_id: userId,
          transaction_type: 'debit',
          amount: totalAmount,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          description: `Saque PIX - ${pixKey}`,
          metadata: {
            pix_transaction_id: transaction.id,
            pix_key: pixKey,
            pix_key_type: pixKeyType,
            original_amount: amount,
            fee: fee
          }
        })

      // Atualizar saldo da carteira
      await supabase
        .from('wallets')
        .update({
          available_balance: balanceAfter,
          balance: balanceAfter
        })
        .eq('id', userWallet.id)

      // Creditar taxa ao admin
      const { data: adminUser } = await supabase
        .from('users')
        .select('id')
        .in('role', ['admin', 'master'])
        .limit(1)
        .single()

      if (adminUser) {
        const { data: adminWallet } = await supabase
          .from('wallets')
          .select('id, available_balance')
          .eq('user_id', adminUser.id)
          .eq('currency_code', 'BRL')
          .eq('is_active', true)
          .single()

        if (adminWallet) {
          const adminBalanceBefore = Number(adminWallet.available_balance) || 0
          const adminBalanceAfter = adminBalanceBefore + fee

          await supabase
            .from('wallet_transactions')
            .insert({
              wallet_id: adminWallet.id,
              user_id: adminUser.id,
              transaction_type: 'credit',
              amount: fee,
              balance_before: adminBalanceBefore,
              balance_after: adminBalanceAfter,
              description: `Taxa PIX - Saque de cliente`,
              metadata: {
                pix_transaction_id: transaction.id,
                source_user_id: userId,
                fee_type: 'pix_withdrawal'
              }
            })

          await supabase
            .from('wallets')
            .update({
              available_balance: adminBalanceAfter,
              balance: adminBalanceAfter
            })
            .eq('id', adminWallet.id)
        }
      }
    }

    console.log('✅ Saque PIX criado (aguardando processamento manual):', transaction.id)

    return {
      success: true,
      paymentId: transaction.id
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
