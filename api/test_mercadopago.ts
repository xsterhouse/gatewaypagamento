import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN

    if (!accessToken) {
      return res.status(500).json({ 
        success: false,
        error: 'Token do Mercado Pago não configurado',
        env_vars: {
          MERCADO_PAGO_ACCESS_TOKEN: !!accessToken,
          NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL
        }
      })
    }

    // Testar API do MercadoPago
    const response = await fetch('https://api.mercadopago.com/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    const data = await response.json()

    return res.status(200).json({
      success: true,
      token_valid: response.ok,
      user_data: response.ok ? data : null,
      error: response.ok ? null : data,
      status: response.status,
      statusText: response.statusText
    })

  } catch (error: any) {
    return res.status(500).json({ 
      success: false,
      error: error.message 
    })
  }
}
