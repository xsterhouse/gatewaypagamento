import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('🔔 MERCADOPAGO WEBHOOK - REQUEST RECEIVED')
  console.log('Method:', req.method)
  console.log('URL:', req.url)
  console.log('Headers:', Object.keys(req.headers))
  console.log('Body:', req.body)
  console.log('Timestamp:', new Date().toISOString())

  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS request - CORS preflight')
    return res.status(200).end()
  }

  // MercadoPago testa com GET
  if (req.method === 'GET') {
    console.log('✅ GET test from MercadoPago')
    return res.status(200).json({ 
      success: true,
      status: 'ok',
      message: 'MercadoPago webhook is working',
      timestamp: new Date().toISOString(),
      method: 'GET'
    })
  }

  // Apenas POST permitido além de GET
  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method)
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowed_methods: ['GET', 'POST', 'OPTIONS']
    })
  }

  try {
    console.log('📦 Processing POST request')
    
    const body = req.body
    console.log('Request body type:', typeof body)
    console.log('Request body keys:', body ? Object.keys(body) : 'undefined')

    // Retorna sucesso para qualquer POST do MercadoPago
    return res.status(200).json({ 
      success: true,
      message: 'Webhook received successfully',
      timestamp: new Date().toISOString(),
      received_data: {
        type: body?.type,
        action: body?.action,
        data_id: body?.data?.id
      }
    })

  } catch (error: any) {
    console.error('❌ Error processing webhook:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    })
  }
}
