// Serviço de envio de emails
// NOTA: Para usar em produção, você precisa:
// 1. Criar conta no Resend (https://resend.com)
// 2. Obter API Key
// 3. Adicionar VITE_RESEND_API_KEY no .env
// 4. Verificar domínio no Resend

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const apiKey = import.meta.env.VITE_RESEND_API_KEY
  
  console.log('🔑 API Key status:', apiKey ? `Carregada (${apiKey.substring(0, 10)}...)` : 'NÃO CARREGADA')
  console.log('🌍 Ambiente:', import.meta.env.MODE)
  console.log('📦 Todas as variáveis:', Object.keys(import.meta.env))
  
  // Se não tem API key configurada, apenas loga no console
  if (!apiKey || apiKey === 'your_resend_api_key_here') {
    console.log('\n' + '='.repeat(60))
    console.log('📧 EMAIL (MODO DESENVOLVIMENTO - SEM API KEY)')
    console.log('='.repeat(60))
    console.log('Para:', to)
    console.log('Assunto:', subject)
    console.log('\n💡 VEJA O CÓDIGO OTP NO REGISTRO/LOGIN')
    console.log('⚠️ Configure VITE_RESEND_API_KEY no .env para enviar emails reais')
    console.log('⚠️ LEMBRE-SE: Reinicie o servidor após adicionar no .env!')
    console.log('='.repeat(60) + '\n')
    return { success: true, messageId: 'dev-mode' }
  }

  // Enviar email real (funciona em dev e produção quando API key está configurada)
  try {
    console.log('📧 Enviando email para:', to)

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'DiMPay Gateway <onboarding@resend.dev>',
        to: [to],
        subject,
        html,
      }),
    })

    // Verificar se a resposta tem conteúdo
    const responseText = await response.text()
    console.log('📥 Resposta da API:', responseText)
    
    let data
    try {
      data = responseText ? JSON.parse(responseText) : {}
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse da resposta:', parseError)
      console.error('Resposta recebida:', responseText)
      return { 
        success: false, 
        error: `Erro ao processar resposta da API: ${responseText.substring(0, 100)}` 
      }
    }

    if (!response.ok) {
      console.error('❌ Erro ao enviar email:', data)
      console.error('Status:', response.status)
      console.error('Detalhes:', JSON.stringify(data, null, 2))
      
      // Mensagens de erro mais específicas
      let errorMessage = data.message || `Erro HTTP ${response.status}`
      if (response.status === 401 || response.status === 403) {
        errorMessage = 'API Key inválida. Verifique VITE_RESEND_API_KEY no .env'
      } else if (response.status === 422) {
        errorMessage = 'Erro de validação. Verifique o email de destino e domínio remetente'
      } else if (response.status === 429) {
        errorMessage = 'Limite de envios excedido. Aguarde alguns minutos'
      }
      
      return { success: false, error: errorMessage }
    }

    console.log('✅ Email enviado com sucesso! ID:', data.id)
    return { success: true, messageId: data.id }
  } catch (error: any) {
    console.error('Erro ao enviar email:', error)
    return { success: false, error: error.message }
  }
}

// Template para código OTP
export function getOTPEmailTemplate(code: string, type: 'register' | 'reset') {
  const title = type === 'register' ? 'Código de Verificação' : 'Redefinir Senha'
  const message = type === 'register' 
    ? 'Use o código abaixo para confirmar seu cadastro:'
    : 'Use o código abaixo para redefinir sua senha:'

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0a0e13; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0e13; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1f2e; border-radius: 12px; border: 1px solid #374151;">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center;">
                  <div style="display: inline-flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                    <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%); border-radius: 8px; display: inline-flex; align-items: center; justify-content: center;">
                      <span style="color: #000; font-weight: bold; font-size: 20px;">PAY</span>
                    </div>
                    <span style="color: #fff; font-weight: bold; font-size: 24px;">Gateway</span>
                  </div>
                  <h1 style="color: #fff; font-size: 24px; margin: 0 0 8px;">${title}</h1>
                  <p style="color: #9ca3af; font-size: 14px; margin: 0;">${message}</p>
                </td>
              </tr>
              
              <!-- Code -->
              <tr>
                <td style="padding: 20px 40px;">
                  <div style="background: linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%); border-radius: 12px; padding: 32px; text-align: center;">
                    <p style="color: #000; font-size: 14px; margin: 0 0 12px; font-weight: 600;">SEU CÓDIGO</p>
                    <p style="color: #000; font-size: 48px; font-weight: bold; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${code}</p>
                  </div>
                </td>
              </tr>
              
              <!-- Info -->
              <tr>
                <td style="padding: 20px 40px 40px;">
                  <div style="background-color: #374151; border-radius: 8px; padding: 20px;">
                    <p style="color: #d1d5db; font-size: 14px; margin: 0 0 12px;">
                      ✓ Este código expira em <strong>15 minutos</strong>
                    </p>
                    <p style="color: #d1d5db; font-size: 14px; margin: 0 0 12px;">
                      ✓ Use-o apenas uma vez
                    </p>
                    <p style="color: #d1d5db; font-size: 14px; margin: 0;">
                      ✓ Não compartilhe com ninguém
                    </p>
                  </div>
                  
                  <p style="color: #6b7280; font-size: 12px; margin: 24px 0 0; text-align: center;">
                    Se você não solicitou este código, ignore este email.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 40px; border-top: 1px solid #374151;">
                  <p style="color: #6b7280; font-size: 12px; margin: 0; text-align: center;">
                    © 2025 Gateway Pagamento. Todos os direitos reservados.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

// Enviar código OTP
export async function sendOTPEmail(email: string, code: string, type: 'register' | 'reset' = 'register') {
  const subject = type === 'register' 
    ? 'Código de Verificação - Gateway Pagamento'
    : 'Redefinir Senha - Gateway Pagamento'

  const html = getOTPEmailTemplate(code, type)

  return await sendEmail({
    to: email,
    subject,
    html,
  })
}
