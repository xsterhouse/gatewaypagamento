import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 [START] Iniciando registro de webhook Banco Inter')

    // 1. Validar corpo da requisição
    const { webhookUrl } = await req.json()
    if (!webhookUrl) {
      throw new Error('❌ [BAD REQUEST] webhookUrl é obrigatório')
    }
    console.log(`📍 [INPUT] Webhook URL: ${webhookUrl}`)

    // 2. Carregar Configuração e Certificados
    const env = await loadEnvironment()
    console.log('🔐 [CONFIG] Credenciais e Certificados carregados')

    // 3. Obter Token OAuth
    const accessToken = await getAccessToken(env)
    console.log('🔑 [AUTH] Token obtido com sucesso')

    // 4. Registrar Webhook
    await registerWebhook(env, accessToken, webhookUrl)
    console.log('✅ [SUCCESS] Webhook registrado com sucesso!')

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Webhook registrado no Banco Inter',
      url: webhookUrl 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error(`❌ [ERROR] ${error.message}`)
    
    // Retorna erro formatado
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.cause || 'Sem detalhes adicionais'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400, // Retornar 400 para erros de lógica/negócio para facilitar debug
    })
  }
})

// --- FUNÇÕES AUXILIARES ---

async function loadEnvironment() {
  // Carregar do banco de dados para pegar ClientID atualizado
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data: acquirer } = await supabase
    .from('bank_acquirers')
    .select('*')
    .eq('bank_code', '077')
    .single()

  if (!acquirer) throw new Error('Configuração do banco (077) não encontrada no DB')

  // Usar PEM (CRT e KEY) que é mais compatível
  const certBase64 = Deno.env.get('BANCO_INTER_CERTIFICATE')
  const keyBase64 = Deno.env.get('BANCO_INTER_CERTIFICATE_KEY')

  if (!certBase64 || !keyBase64) throw new Error('Secrets BANCO_INTER_CERTIFICATE e KEY não configurados')

  // Decodificar Base64
  const certRaw = atob(certBase64)
  const keyRaw = atob(keyBase64)

  // Função helper para formatar PEM se necessário
  const formatPem = (pem: string, type: string) => {
    if (pem.includes('-----BEGIN')) return pem
    const clean = pem.replace(/\s/g, '')
    const chunks = clean.match(/.{1,64}/g) || []
    return `-----BEGIN ${type}-----\n${chunks.join('\n')}\n-----END ${type}-----`
  }

  const certPem = formatPem(certRaw, 'CERTIFICATE')
  const keyPem = keyRaw.includes('PRIVATE KEY') ? keyRaw : formatPem(keyRaw, 'PRIVATE KEY')

  console.log('🔐 [CONFIG] Usando certificados PEM')

  // Configurar Cliente HTTP com mTLS
  const client = Deno.createHttpClient({
    certChain: certPem,
    privateKey: keyPem
  })

  return {
    clientId: acquirer.client_id,
    clientSecret: acquirer.client_secret,
    baseUrl: acquirer.environment === 'sandbox' 
      ? 'https://cdpj-sandbox.partners.bancointer.com.br' 
      : 'https://cdpj.partners.bancointer.com.br',
    client,
    pixKey: acquirer.pix_key,
    contaCorrente: acquirer.account_number || '35476991', 
    cnpj: '22535683000114'
  }
}

async function getAccessToken(env: any) {
  const tokenUrl = `${env.baseUrl}/oauth/v2/token`
  
  const params = new URLSearchParams()
  params.append('client_id', env.clientId)
  params.append('client_secret', env.clientSecret)
  params.append('grant_type', 'client_credentials')
  // Testar com escopo mínimo primeiro
  params.append('scope', 'pix.read')

  console.log(`🔄 [AUTH] Solicitando token para ClientID: ${env.clientId}`)
  console.log(`🔄 [AUTH] URL: ${tokenUrl}`)
  console.log(`🔄 [AUTH] Escopo mínimo: pix.read`)
  
  // Log do corpo da requisição
  console.log(`🔄 [AUTH] Corpo da requisição: ${params.toString()}`)

  // @ts-ignore
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params,
    client: env.client // Cliente com mTLS
  })

  console.log(`🔄 [AUTH] Status da resposta: ${response.status}`)
  console.log(`🔄 [AUTH] Headers da resposta:`, Object.fromEntries(response.headers.entries()))

  if (!response.ok) {
    const text = await response.text()
    console.error(`❌ [AUTH ERROR] Corpo da resposta do Inter: ${text}`)
    
    // Tentar sem escopo como fallback
    if (response.status === 400 && text.includes('scope')) {
      console.log(`🔄 [AUTH] Tentando novamente sem escopo...`)
      const paramsNoScope = new URLSearchParams()
      paramsNoScope.append('client_id', env.clientId)
      paramsNoScope.append('client_secret', env.clientSecret)
      paramsNoScope.append('grant_type', 'client_credentials')
      
      const responseNoScope = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: paramsNoScope,
        client: env.client
      })
      
      if (!responseNoScope.ok) {
        const textNoScope = await responseNoScope.text()
        console.error(`❌ [AUTH ERROR] Sem escopo também falhou: ${textNoScope}`)
        throw new Error(`Falha ao obter token: HTTP ${responseNoScope.status} - ${textNoScope}`)
      }
      
      const dataNoScope = await responseNoScope.json()
      console.log(`✅ [AUTH] Token obtido sem escopo`)
      return dataNoScope.access_token
    }
    
    throw new Error(`Falha ao obter token: HTTP ${response.status} - ${text}`)
  }

  const data = await response.json()
  console.log(`✅ [AUTH] Token obtido com sucesso`)
  return data.access_token
}

async function registerWebhook(env: any, token: string, webhookUrl: string) {
  const endpoint = `${env.baseUrl}/pix/v2/webhook/${env.pixKey}`
  
  console.log(`🔄 [REGISTER] Enviando PUT para: ${endpoint}`)

  // @ts-ignore
  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'x-inter-conta-corrente': env.contaCorrente,
      'x-inter-cpf-cnpj': env.cnpj
    },
    body: JSON.stringify({ webhookUrl }),
    client: env.client // Cliente com mTLS
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Falha ao registrar webhook: HTTP ${response.status} - ${text}`)
  }
}