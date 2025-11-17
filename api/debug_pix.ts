import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Permitir CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🔍 Verificando configuração do Mercado Pago')
    
    // Verificar token
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
    console.log('🔑 Token configurado:', !!accessToken)
    
    if (!accessToken) {
      return res.status(500).json({ 
        success: false,
        error: 'Token do Mercado Pago não configurado',
        debug: {
          MERCADO_PAGO_ACCESS_TOKEN: false,
          env_keys: Object.keys(process.env).filter(k => k.includes('MERCADO'))
        }
      })
    }

    // Testar conexão com API do Mercado Pago
    const testResponse = await fetch('https://api.mercadopago.com/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    const userData = await testResponse.json()
    
    console.log('👤 Usuário MP:', {
      status: testResponse.status,
      id: userData.id,
      email: userData.email
    })

    if (!testResponse.ok) {
      return res.status(400).json({
        success: false,
        error: 'Token inválido ou expirado',
        debug: {
          status: testResponse.status,
          mercado_pago_response: userData
        }
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Configuração OK',
      debug: {
        token_configured: true,
        api_status: 'connected',
        user_data: {
          id: userData.id,
          email: userData.email,
          site_id: userData.site_id
        }
      }
    })

  } catch (error) {
    console.error('❌ Erro no debug:', error)
    return res.status(500).json({
      success: false,
      error: 'Erro ao verificar configuração',
      debug: {
        error_message: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    })
  }
}
