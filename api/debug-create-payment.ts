import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('🔧 Debug create-payment called')
    console.log('Method:', req.method)
    console.log('Body:', req.body)
    console.log('Headers:', req.headers)
    
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }
    
    const { transactionId, amount, description } = req.body
    
    return res.status(200).json({
      success: true,
      debug: true,
      message: 'Debug endpoint working',
      received: {
        transactionId,
        amount,
        description
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Debug error:', error)
    return res.status(500).json({ 
      error: error.message,
      debug: true
    })
  }
}
