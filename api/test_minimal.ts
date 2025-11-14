export default async function handler(_req: any, res: any) {
  console.log('🚀 Teste mínimo iniciado')
  
  try {
    return res.status(200).json({ 
      success: true, 
      message: 'Teste mínimo funcionando!',
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('❌ Erro no teste mínimo:', error)
    return res.status(500).json({ 
      error: error.message
    })
  }
}
