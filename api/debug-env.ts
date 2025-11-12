import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const envVars = {
      MERCADO_PAGO_ACCESS_TOKEN: process.env.MERCADO_PAGO_ACCESS_TOKEN ? 'CONFIGURED' : 'MISSING',
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? 'CONFIGURED' : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'CONFIGURED' : 'MISSING',
      NODE_ENV: process.env.NODE_ENV
    }
    
    return res.status(200).json({
      message: 'Environment variables check',
      environment: envVars,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    return res.status(500).json({ 
      error: error.message
    })
  }
}