import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Permitir apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Pegar API Key das variáveis de ambiente
  const apiKey = process.env.VITE_RESEND_API_KEY

  if (!apiKey || apiKey === 'your_resend_api_key_here') {
    return res.status(500).json({ 
      error: 'API Key não configurada no Vercel' 
    })
  }

  try {
    const { from, to, subject, html } = req.body

    // Validar dados
    if (!from || !to || !subject || !html) {
      return res.status(400).json({ 
        error: 'Dados incompletos. Necessário: from, to, subject, html' 
      })
    }

    // Fazer requisição para Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Erro Resend:', data)
      return res.status(response.status).json(data)
    }

    return res.status(200).json(data)
  } catch (error: any) {
    console.error('Erro no handler:', error)
    return res.status(500).json({ 
      error: error.message || 'Erro interno do servidor' 
    })
  }
}
