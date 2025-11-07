// Script para verificar status de email no Resend
// Execute: node check-email-status.js

const RESEND_API_KEY = 're_HHGH2ofv_2ViU9tYRAgbDsz7UkGVBfiht'
const EMAIL_ID = '130a857f-477a-4b66-92d8-76c0c81f8765' // ID do último email enviado

async function checkEmailStatus() {
  console.log('\n' + '='.repeat(60))
  console.log('🔍 VERIFICANDO STATUS DO EMAIL')
  console.log('='.repeat(60))
  console.log('\nEmail ID:', EMAIL_ID)
  console.log('Consultando Resend API...\n')

  try {
    const response = await fetch(`https://api.resend.com/emails/${EMAIL_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Erro ao consultar status:', data)
      return
    }

    console.log('✅ STATUS DO EMAIL:')
    console.log('='.repeat(60))
    console.log('ID:', data.id)
    console.log('Para:', data.to)
    console.log('De:', data.from)
    console.log('Assunto:', data.subject)
    console.log('Status:', data.last_event || 'Enviado')
    console.log('Criado em:', new Date(data.created_at).toLocaleString('pt-BR'))
    
    if (data.last_event === 'delivered') {
      console.log('\n✅ EMAIL FOI ENTREGUE!')
      console.log('O email chegou na caixa de entrada do Gmail.')
      console.log('Verifique:')
      console.log('1. Pasta de SPAM')
      console.log('2. Aba "Promoções" ou "Social"')
      console.log('3. Pesquise: from:resend.dev')
    } else if (data.last_event === 'bounced') {
      console.log('\n❌ EMAIL FOI REJEITADO (Bounced)')
      console.log('Possíveis causas:')
      console.log('- Email não existe')
      console.log('- Caixa de entrada cheia')
      console.log('- Servidor rejeitou')
    } else if (data.last_event === 'complained') {
      console.log('\n⚠️ EMAIL MARCADO COMO SPAM')
    } else {
      console.log('\n📧 Email enviado, aguardando entrega...')
    }

    console.log('\n📊 Detalhes completos:')
    console.log(JSON.stringify(data, null, 2))
    console.log('\n' + '='.repeat(60))

  } catch (error) {
    console.error('\n❌ ERRO:', error.message)
  }
}

checkEmailStatus()
