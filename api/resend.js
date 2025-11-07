// Serverless Function para Resend API - Vercel
// Resolve CORS e protege API Key

export default async function handler(req, res) {
  // Apenas permite POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Apenas método POST é permitido'
    })
  }

  try {
    // Log para debug
    console.log('📧 Serverless: Recebendo requisição para email')
    console.log('📧 Serverless: Body:', JSON.stringify(req.body, null, 2))

    // Fazer requisição para Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify(req.body),
    })

    const data = await response.json()
    
    // Log da resposta
    console.log('📧 Serverless: Resposta da Resend:', {
      status: response.status,
      data: data
    })
    
    // Se deu erro, retorna o erro
    if (!response.ok) {
      console.error('❌ Serverless: Erro na Resend:', data)
      return res.status(response.status).json(data)
    }

    // Sucesso
    console.log('✅ Serverless: Email enviado com sucesso!')
    return res.status(200).json(data)
    
  } catch (error) {
    console.error('❌ Serverless: Erro interno:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
}
