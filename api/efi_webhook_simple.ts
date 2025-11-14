export default async function handler(req: any, res: any) {
  try {
    console.log('🚀 Webhook Simple Test Iniciado')
    
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') return res.status(200).end()
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    // Teste básico - sem Supabase, sem require, sem nada
    console.log('✅ Webhook Simple funcionando!')
    
    return res.status(200).json({ 
      success: true,
      message: 'Webhook EFI configurado com sucesso!',
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Erro:', error)
    return res.status(500).json({ error: error.message })
  }
}
