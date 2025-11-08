import { webhookService } from '../../src/services/webhookService'

/**
 * Endpoint de Webhook para receber confirmações de PIX
 * URL: /api/webhooks/pix
 * Método: POST
 * 
 * Este endpoint recebe notificações do banco quando:
 * - PIX é criado
 * - PIX é pago (completed)
 * - PIX falha
 * - PIX é estornado
 */

export default async function handler(req: Request) {
  // Apenas aceitar POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { 
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  try {
    console.log('🪝 Webhook recebido:', new Date().toISOString())

    // Extrair headers
    const signature = req.headers.get('x-signature') || 
                     req.headers.get('x-hub-signature') || 
                     req.headers.get('authorization') || ''
    
    const acquirerId = req.headers.get('x-acquirer-id') || 
                      req.headers.get('x-bank-id') || ''

    // Extrair payload
    const payload = await req.json()
    
    console.log('📦 Payload recebido:', {
      acquirerId,
      eventType: payload.type || payload.event,
      hasSignature: !!signature
    })

    // Validar se tem acquirer_id
    if (!acquirerId && !payload.acquirer_id) {
      console.error('❌ Acquirer ID não fornecido')
      return new Response(
        JSON.stringify({ 
          error: 'Acquirer ID required',
          hint: 'Send x-acquirer-id header or acquirer_id in payload'
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Processar webhook
    const result = await webhookService.processPixWebhook(
      acquirerId || payload.acquirer_id,
      signature,
      payload
    )

    if (!result.success) {
      console.error('❌ Erro ao processar webhook:', result.error)
      return new Response(
        JSON.stringify({ error: result.error }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ Webhook processado com sucesso')

    // Retornar sucesso
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Webhook processed successfully'
      }), 
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('❌ Erro fatal no webhook:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Configuração para Vercel/Netlify
export const config = {
  runtime: 'edge', // Usar Edge Runtime para melhor performance
}
