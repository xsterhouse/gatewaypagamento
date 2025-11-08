/**
 * Script para testar webhook localmente
 * 
 * Uso:
 * node testar-webhook.js
 */

const testWebhook = async () => {
  console.log('🧪 Testando Webhook PIX...\n')

  // Configuração
  const WEBHOOK_URL = 'http://localhost:5173/api/webhooks/pix' // Altere para sua URL
  const ACQUIRER_ID = 'cole-id-do-adquirente-aqui' // Obter do banco
  const TRANSACTION_ID = 'cole-id-da-transacao-aqui' // Obter do banco
  const USER_ID = 'cole-id-do-usuario-aqui' // Obter do banco

  // Payload de teste
  const payload = {
    type: 'pix.completed',
    transaction_id: TRANSACTION_ID,
    user_id: USER_ID,
    amount: 100.00,
    description: 'Teste de webhook local',
    e2e_id: 'E12345678202411081234567890AB',
    metadata: {
      test: true,
      timestamp: new Date().toISOString()
    }
  }

  console.log('📦 Payload:', JSON.stringify(payload, null, 2))
  console.log('\n🔗 URL:', WEBHOOK_URL)
  console.log('🏦 Acquirer ID:', ACQUIRER_ID)
  console.log('\n⏳ Enviando...\n')

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-acquirer-id': ACQUIRER_ID,
        'x-signature': 'test-signature-local'
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (response.ok) {
      console.log('✅ Webhook processado com sucesso!')
      console.log('📊 Resposta:', JSON.stringify(data, null, 2))
    } else {
      console.error('❌ Erro ao processar webhook')
      console.error('Status:', response.status)
      console.error('Resposta:', JSON.stringify(data, null, 2))
    }

  } catch (error) {
    console.error('❌ Erro ao enviar webhook:', error.message)
    console.error('\n💡 Dica: Certifique-se que o servidor está rodando em', WEBHOOK_URL)
  }
}

// Executar teste
testWebhook()

/**
 * COMO USAR:
 * 
 * 1. Obter IDs necessários no Supabase:
 * 
 *    SELECT id FROM bank_acquirers WHERE name LIKE '%Inter%';
 *    SELECT id, user_id FROM pix_transactions WHERE status = 'pending' LIMIT 1;
 * 
 * 2. Colar os IDs nas variáveis acima
 * 
 * 3. Executar:
 *    node testar-webhook.js
 * 
 * 4. Verificar no Supabase se:
 *    - Transação mudou para 'completed'
 *    - Saldo foi creditado
 *    - Notificação foi criada
 */
