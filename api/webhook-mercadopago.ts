export default async function handler(req: any, res: any) {
  console.log('🔔 Webhook MercadoPago accessed:', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  })

  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Mercado Pago testa com GET
  if (req.method === 'GET') {
    console.log('✅ GET test received from MercadoPago')
    return res.status(200).json({ 
      status: 'ok',
      message: 'Webhook ready',
      timestamp: new Date().toISOString()
    })
  }

  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method)
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('📦 Webhook body:', req.body)
    
    const { type, action, data } = req.body
    
    if (type === 'payment' && action === 'payment.updated') {
      console.log('💳 Payment updated:', data?.id)
      // Aqui você processa a atualização do pagamento
      return res.status(200).json({ success: true })
    }

    return res.status(200).json({ success: true })
  } catch (error: any) {
    console.error('❌ Webhook error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
}
