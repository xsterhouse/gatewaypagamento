export default async function handler(req: any, res: any) {
  try {
    console.log('🚀 Webhook EFI DEBUG iniciado')
    
    // Headers básicos
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
      return res.status(200).end()
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    // Verificar environment variables
    console.log('🔍 ENV CHECK:', {
      hasUrl: !!process.env.VITE_SUPABASE_URL,
      hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      url: process.env.VITE_SUPABASE_URL?.substring(0, 20) + '...'
    })

    // Testar require do Supabase
    console.log('📦 Tentando carregar Supabase...')
    const { createClient } = require('@supabase/supabase-js')
    console.log('✅ Supabase carregado com sucesso')

    // Testar criação do cliente
    console.log('🔧 Criando cliente Supabase...')
    createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    console.log('✅ Cliente Supabase criado')

    console.log('🪝 Webhook EFI recebido:', req.body)
    
    return res.status(200).json({ 
      success: true, 
      message: 'Webhook EFI debug funcionando!',
      received: req.body 
    })

  } catch (error: any) {
    console.error('❌ Erro no webhook DEBUG:', error)
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    })
  }
}
