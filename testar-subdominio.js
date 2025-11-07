// Script para testar envio com subdomínio
const RESEND_API_KEY = 're_HHGH2ofv_2ViU9tYRAgbDsz7UkGVBfiht'

async function testSubdomain() {
  console.log('🧪 Testando envio com notificacao@dimpay.com.br')
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'DiMPay Gateway <notificacao@dimpay.com.br>',
        to: ['xsterhouse@gmail.com'],
        subject: 'Teste Subdomínio',
        html: '<h1>Teste de envio com subdomínio</h1>',
      }),
    })

    const data = await response.json()
    console.log('Status:', response.status)
    console.log('Resposta:', data)
    
    if (response.ok) {
      console.log('✅ Subdomínio funciona!')
    } else {
      console.log('❌ Erro:', data.message)
    }
  } catch (error) {
    console.error('Erro:', error)
  }
}

testSubdomain()
