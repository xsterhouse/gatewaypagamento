export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const envVars: any = {
      EFI_CLIENT_ID: process.env.EFI_CLIENT_ID ? '✅ Configurado' : '❌ Não configurado',
      EFI_CLIENT_SECRET: process.env.EFI_CLIENT_SECRET ? '✅ Configurado' : '❌ Não configurado',
      EFI_CERTIFICATE_BASE64: process.env.EFI_CERTIFICATE_BASE64 ? '✅ Configurado' : '❌ Não configurado',
      EFI_PIX_KEY: process.env.EFI_PIX_KEY ? '✅ Configurado' : '❌ Não configurado',
      EFI_SANDBOX: process.env.EFI_SANDBOX || '❌ Não configurado',
      NODE_ENV: process.env.NODE_ENV || '❌ Não configurado',
      SUPABASE_URL: process.env.SUPABASE_URL ? '✅ Configurado' : '❌ Não configurado',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? '✅ Configurado' : '❌ Não configurado'
    }

    // Verificar comprimento do certificado
    if (process.env.EFI_CERTIFICATE_BASE64) {
      envVars.EFI_CERTIFICATE_LENGTH = process.env.EFI_CERTIFICATE_BASE64.length
    }

    console.log('🔍 Debug Environment Variables:', envVars)

    return res.status(200).json({
      success: true,
      environment: envVars,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Erro no debug:', error)
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
}
