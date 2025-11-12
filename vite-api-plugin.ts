import type { Plugin } from 'vite'
import { loadEnv } from 'vite'

export function apiPlugin(): Plugin {
  return {
    name: 'api-plugin',
    configureServer(server) {
      // Carregar variáveis de ambiente
      const env = loadEnv(server.config.mode, process.cwd(), '')
      
      server.middlewares.use(async (req, res, next) => {
        // Verificar se é a rota correta
        if (req.url !== '/api/mercadopago_create_pix') {
          return next()
        }

        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        console.log('🎯 [DEV] Interceptando requisição para /api/mercadopago_create_pix')

        let body = ''
        req.on('data', chunk => {
          body += chunk.toString()
        })

        req.on('end', async () => {
          try {
            const { amount, description, transactionId } = JSON.parse(body)

            const token = env.VITE_MERCADO_PAGO_ACCESS_TOKEN
            
            console.log('🔑 [DEV] Token encontrado:', token ? `${token.substring(0, 20)}...` : 'NÃO CONFIGURADO')

            if (!token) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ 
                success: false, 
                error: 'Token não configurado' 
              }))
              return
            }

            const mpBody = {
              transaction_amount: amount,
              description: description,
              payment_method_id: 'pix',
              payer: {
                email: 'cliente@dimpay.com.br'
              },
              external_reference: transactionId,
              notification_url: `http://localhost:${server.config.server.port}/api/mercadopago/webhook`
            }

            console.log('🚀 [DEV] Criando PIX no Mercado Pago:', mpBody)

            const response = await fetch('https://api.mercadopago.com/v1/payments', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'X-Idempotency-Key': transactionId
              },
              body: JSON.stringify(mpBody)
            })

            const data = await response.json()

            console.log('📡 [DEV] Resposta Mercado Pago:', {
              status: response.status,
              id: data.id
            })

            if (!response.ok) {
              res.statusCode = response.status
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: false,
                error: data.message || 'Erro ao criar pagamento'
              }))
              return
            }

            const qrCode = data.point_of_interaction?.transaction_data?.qr_code
            const qrCodeBase64 = data.point_of_interaction?.transaction_data?.qr_code_base64
            const expiresAt = data.date_of_expiration

            if (!qrCode) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: false,
                error: 'QR Code não gerado'
              }))
              return
            }

            console.log('✅ [DEV] PIX criado com sucesso!')

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              success: true,
              qr_code: qrCode,
              qr_code_base64: qrCodeBase64,
              id: String(data.id),
              expires_at: expiresAt
            }))

          } catch (error: any) {
            console.error('❌ [DEV] Erro:', error)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              success: false,
              error: error.message || 'Erro interno'
            }))
          }
        })
      })
    }
  }
}
