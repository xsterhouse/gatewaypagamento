export default async function handler(req: any, res: any) {
  try {
    // Permitir CORS
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
      return res.status(200).end()
    }

    console.log('🧪 Test endpoint chamado')

    return res.status(200).json({
      success: true,
      message: 'Endpoint funcionando!',
      timestamp: new Date().toISOString(),
      method: req.method,
      env_test: {
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        MERCADO_PAGO_ACCESS_TOKEN: !!process.env.MERCADO_PAGO_ACCESS_TOKEN
      }
    })

  } catch (error) {
    console.error('❌ Erro no test endpoint:', error)
    return res.status(500).json({
      success: false,
      error: 'Erro interno',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    })
  }
}
