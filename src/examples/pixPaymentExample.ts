import { pixProcessorService } from '@/services/pixProcessorService'
import { bankAcquirerService } from '@/services/bankAcquirerService'

// ========================================
// EXEMPLOS DE USO DO SISTEMA PIX
// ========================================

/**
 * Exemplo 1: Criar um PIX usando o adquirente padrão
 */
export async function createPixWithDefaultAcquirer() {
  try {
    console.log('📝 Exemplo 1: Criar PIX com adquirente padrão')
    
    const result = await pixProcessorService.createPixPayment({
      amount: 100.00,
      description: 'Depósito via PIX',
      user_id: 'user-uuid-here',
      payer_name: 'João Silva',
      payer_document: '12345678900',
      expires_in_minutes: 30
    })
    
    if (result.success) {
      console.log('✅ PIX criado com sucesso!')
      console.log('🔢 Código PIX:', result.pix_code)
      console.log('📱 QR Code:', result.pix_qr_code)
      console.log('⏰ Expira em:', result.expires_at)
      console.log('🏦 Adquirente:', result.acquirer_name)
      
      // Retornar para o frontend
      return {
        success: true,
        transaction_id: result.transaction_id,
        pix_code: result.pix_code,
        pix_qr_code: result.pix_qr_code,
        expires_at: result.expires_at
      }
    } else {
      console.error('❌ Erro:', result.error)
      return {
        success: false,
        error: result.error
      }
    }
    
  } catch (error: any) {
    console.error('❌ Erro ao criar PIX:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Exemplo 2: Criar um PIX com adquirente específico
 */
export async function createPixWithSpecificAcquirer() {
  try {
    console.log('📝 Exemplo 2: Criar PIX com adquirente específico')
    
    // 1. Listar adquirentes disponíveis
    const acquirers = await bankAcquirerService.getActiveAcquirers()
    console.log('🏦 Adquirentes ativos:', acquirers.map(a => a.name))
    
    // 2. Selecionar Mercado Pago
    const mercadoPago = acquirers.find(a => 
      a.name.toLowerCase().includes('mercado pago')
    )
    
    if (!mercadoPago) {
      throw new Error('Mercado Pago não encontrado')
    }
    
    // 3. Criar PIX
    const result = await pixProcessorService.createPixPayment({
      amount: 250.50,
      description: 'Recarga de créditos',
      user_id: 'user-uuid-here',
      acquirer_id: mercadoPago.id,
      payer_name: 'Maria Santos',
      payer_document: '98765432100'
    })
    
    if (result.success) {
      console.log('✅ PIX criado via', result.acquirer_name)
      return result
    } else {
      console.error('❌ Erro:', result.error)
      return result
    }
    
  } catch (error: any) {
    console.error('❌ Erro:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Exemplo 3: Consultar status de um PIX
 */
export async function checkPixStatus(transaction_id: string) {
  try {
    console.log('🔍 Exemplo 3: Consultar status do PIX')
    
    const status = await pixProcessorService.getPixStatus(transaction_id)
    
    console.log('📊 Status:', status.status)
    if (status.paid_at) {
      console.log('💰 Pago em:', status.paid_at)
    }
    
    return status
    
  } catch (error: any) {
    console.error('❌ Erro ao consultar status:', error)
    return {
      status: 'error',
      error: error.message
    }
  }
}

/**
 * Exemplo 4: Listar estatísticas de um adquirente
 */
export async function getAcquirerStats(acquirer_id: string) {
  try {
    console.log('📊 Exemplo 4: Estatísticas do adquirente')
    
    const stats = await bankAcquirerService.getAcquirerStatistics(acquirer_id)
    
    console.log('📈 Estatísticas:')
    console.log('  - Total de transações:', stats.total_transactions)
    console.log('  - Volume total:', `R$ ${stats.total_volume}`)
    console.log('  - Taxa de sucesso:', `${stats.success_rate}%`)
    console.log('  - Transações bem-sucedidas:', stats.successful_transactions)
    console.log('  - Transações falhadas:', stats.failed_transactions)
    
    return stats
    
  } catch (error: any) {
    console.error('❌ Erro:', error)
    return null
  }
}

/**
 * Exemplo 5: Fluxo completo de pagamento
 */
export async function completePaymentFlow() {
  try {
    console.log('🚀 Exemplo 5: Fluxo completo de pagamento')
    
    // 1. Criar PIX
    console.log('\n1️⃣ Criando PIX...')
    const payment = await pixProcessorService.createPixPayment({
      amount: 150.00,
      description: 'Compra de produto',
      user_id: 'user-uuid-here',
      payer_name: 'Carlos Oliveira',
      payer_document: '11122233344'
    })
    
    if (!payment.success) {
      throw new Error(payment.error)
    }
    
    console.log('✅ PIX criado:', payment.transaction_id)
    
    // 2. Mostrar QR Code para o usuário
    console.log('\n2️⃣ Exibindo QR Code para o cliente...')
    console.log('📱 QR Code Base64:', payment.pix_qr_code?.substring(0, 50) + '...')
    console.log('🔢 Código Copia e Cola:', payment.pix_code?.substring(0, 50) + '...')
    
    // 3. Aguardar pagamento (simulação)
    console.log('\n3️⃣ Aguardando pagamento...')
    console.log('⏰ Expira em:', payment.expires_at)
    
    // 4. Consultar status (em produção, isso seria feito via webhook)
    console.log('\n4️⃣ Consultando status...')
    const status = await pixProcessorService.getPixStatus(payment.transaction_id!)
    console.log('📊 Status atual:', status.status)
    
    // 5. Quando o webhook notificar que foi pago
    if (status.status === 'completed') {
      console.log('\n5️⃣ ✅ Pagamento confirmado!')
      console.log('💰 Pago em:', status.paid_at)
      console.log('🎉 Liberar produto/serviço para o cliente')
    } else {
      console.log('\n5️⃣ ⏳ Aguardando pagamento...')
    }
    
    return {
      success: true,
      payment,
      status
    }
    
  } catch (error: any) {
    console.error('❌ Erro no fluxo:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// ========================================
// EXECUTAR EXEMPLOS
// ========================================

// Descomente para testar:
// createPixWithDefaultAcquirer()
// createPixWithSpecificAcquirer()
// checkPixStatus('transaction-id-here')
// getAcquirerStats('acquirer-id-here')
// completePaymentFlow()
