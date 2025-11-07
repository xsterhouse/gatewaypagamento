// Script de teste para validar envio de email via Resend
// Execute: node test-email.js

// ⚠️ COLE SUA API KEY AQUI (substitua o valor abaixo)
const RESEND_API_KEY = 're_HHGH2ofv_2ViU9tYRAgbDsz7UkGVBfiht'
const TEST_EMAIL = 'xsterhouse@gmail.com' // Email da conta Resend (modo teste)

async function testResendEmail() {
  console.log('\n' + '='.repeat(60))
  console.log('🧪 TESTE DE ENVIO DE EMAIL - RESEND')
  console.log('='.repeat(60))
  
  // Validar API Key
  if (!RESEND_API_KEY || RESEND_API_KEY === 'cole_sua_api_key_aqui') {
    console.error('\n❌ ERRO: API Key não configurada!')
    console.log('\n📝 Como configurar:')
    console.log('1. Abra este arquivo: test-email.js')
    console.log('2. Na linha 5, cole sua API Key do Resend')
    console.log('3. Salve o arquivo')
    console.log('4. Execute novamente: node test-email.js\n')
    return
  }

  console.log('\n✅ API Key encontrada:', RESEND_API_KEY.substring(0, 10) + '...')
  
  // Validar email de teste
  if (TEST_EMAIL === 'seu_email@gmail.com') {
    console.error('\n❌ ERRO: Altere TEST_EMAIL no script para seu email real!')
    return
  }

  console.log('✅ Email de teste:', TEST_EMAIL)
  console.log('\n📧 Enviando email de teste...\n')

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'DiMPay <onboarding@resend.dev>', // Domínio de teste do Resend
        to: [TEST_EMAIL],
        subject: '🧪 Teste de Email - DiMPay Gateway',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Teste de Email</title>
          </head>
          <body style="margin: 0; padding: 40px; background-color: #0a0e13; font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #1a1f2e; border-radius: 12px; padding: 40px; border: 1px solid #374151;">
              <h1 style="color: #22d3ee; margin: 0 0 20px;">✅ Teste Bem-Sucedido!</h1>
              <p style="color: #fff; font-size: 16px; line-height: 1.6;">
                Parabéns! Seu sistema de envio de emails está funcionando corretamente.
              </p>
              <div style="background: linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%); border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="color: #000; font-size: 32px; font-weight: bold; margin: 0; text-align: center; letter-spacing: 4px;">
                  123456
                </p>
                <p style="color: #000; font-size: 12px; margin: 8px 0 0; text-align: center;">
                  Código de exemplo
                </p>
              </div>
              <p style="color: #9ca3af; font-size: 14px; margin: 20px 0 0;">
                ✓ API Key configurada corretamente<br>
                ✓ Resend funcionando<br>
                ✓ Emails sendo entregues
              </p>
              <hr style="border: none; border-top: 1px solid #374151; margin: 20px 0;">
              <p style="color: #6b7280; font-size: 12px; margin: 0; text-align: center;">
                © 2025 DiMPay - Sistema de Pagamentos
              </p>
            </div>
          </body>
          </html>
        `,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ ERRO ao enviar email:')
      console.error('Status:', response.status)
      console.error('Resposta:', JSON.stringify(data, null, 2))
      
      console.log('\n🔍 Possíveis causas:')
      if (response.status === 401 || response.status === 403) {
        console.log('- API Key inválida ou expirada')
        console.log('- Verifique em: https://resend.com/api-keys')
      } else if (response.status === 422) {
        console.log('- Email de destino inválido')
        console.log('- Domínio remetente não verificado')
      } else if (response.status === 429) {
        console.log('- Limite de envios excedido (100/dia para onboarding@resend.dev)')
      }
      return
    }

    console.log('✅ EMAIL ENVIADO COM SUCESSO!')
    console.log('\n📊 Detalhes:')
    console.log('- ID:', data.id)
    console.log('- Para:', TEST_EMAIL)
    console.log('- De: onboarding@resend.dev')
    
    console.log('\n📧 Verifique seu email:')
    console.log('1. Abra sua caixa de entrada')
    console.log('2. Procure por "Teste de Email - DiMPay Gateway"')
    console.log('3. Verifique também a pasta de SPAM')
    console.log('4. Aguarde até 1 minuto para o email chegar')
    
    console.log('\n🎯 Dashboard do Resend:')
    console.log('https://resend.com/emails/' + data.id)
    
    console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!')
    console.log('='.repeat(60) + '\n')

  } catch (error) {
    console.error('\n❌ ERRO DE REDE:', error.message)
    console.log('\n🔍 Verifique:')
    console.log('- Conexão com internet')
    console.log('- Firewall/Antivírus bloqueando')
    console.log('- Proxy configurado\n')
  }
}

// Executar teste
testResendEmail()
