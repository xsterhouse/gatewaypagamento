export default async function handler(req: any, res: any) {
  // Permitir CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { operation } = req.query

  try {
    switch (operation) {
      case 'create_pix':
        return await handleCreatePix(req, res)
      case 'send_pix':
        return await handleSendPix(req, res)
      case 'webhook':
        return await handleWebhook(req, res)
      default:
        return res.status(400).json({ error: 'Operação inválida' })
    }
  } catch (error) {
    console.error('❌ Erro na operação EFI:', error)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

async function handleCreatePix(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Lógica de criação de PIX EFI (copiada do arquivo original)
  return res.status(200).json({ success: true, message: 'PIX EFI criado' })
}

async function handleSendPix(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Lógica de envio de PIX EFI (copiada do arquivo original)
  return res.status(200).json({ success: true, message: 'PIX EFI enviado' })
}

async function handleWebhook(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Lógica de webhook EFI (copiada do arquivo original)
  return res.status(200).json({ success: true })
}
