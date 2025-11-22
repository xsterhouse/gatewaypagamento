// @ts-ignore: Deno types
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore: Deno types
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Precisamos reimplementar parte da classe aqui ou importar se fosse um modulo compartilhado
// Para simplificar, vou fazer a chamada direta aqui usando a estrutura que já conhecemos

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { webhookUrl } = await req.json()
    
    if (!webhookUrl) {
      throw new Error('URL do webhook é obrigatória')
    }

    // 1. Configurar cliente do Banco Inter (mesma lógica das outras functions)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: acquirer, error: acquirerError } = await supabaseClient
      .from('bank_acquirers')
      .select('*')
      .eq('bank_code', '077') // Banco Inter
      .single()

    if (acquirerError || !acquirer) throw new Error('Configuração do Banco Inter não encontrada')

    const cert = Deno.env.get('BANCO_INTER_CERTIFICATE')
    const key = Deno.env.get('BANCO_INTER_CERTIFICATE_KEY')

    if (!cert || !key) throw new Error('Certificados não configurados nos Secrets')

    console.log(`🔐 Certificado carregado (Tamanho: ${cert.length})`)
    console.log(`🔐 Chave carregada (Tamanho: ${key.length})`)

    // Função helper para formatar PEM
    const formatPem = (pem: string, type: string) => {
      // Remove cabeçalhos existentes e espaços/quebras
      const clean = pem
        .replace(/-----BEGIN [^-]+-----/, '')
        .replace(/-----END [^-]+-----/, '')
        .replace(/\s/g, '')
      
      // Adiciona quebras de linha a cada 64 caracteres
      const chunks = clean.match(/.{1,64}/g) || []
      return `-----BEGIN ${type}-----\n${chunks.join('\n')}\n-----END ${type}-----`
    }

    // Decodificar e formatar certificados
    const certRaw = atob(cert)
    const keyRaw = atob(key)
    
    const certPem = formatPem(certRaw, 'CERTIFICATE')
    const keyPem = keyRaw.includes('RSA') || keyRaw.includes('PRIVATE KEY') 
      ? keyRaw // Se já tiver cabeçalho, tenta usar direto (mas formatado seria melhor)
      : formatPem(keyRaw, 'PRIVATE KEY') // Assume PRIVATE KEY se não tiver cabeçalho

    // Log para debug (apenas início e fim)
    console.log('Cert Formatado:', certPem.substring(0, 30) + '...')
    
    // Obter Token OAuth
    const tokenUrl = acquirer.api_auth_url
    const clientId = acquirer.client_id
    const clientSecret = acquirer.client_secret
    
    console.log(`🔑 Client ID: ${clientId}`)
    console.log(`🌐 Auth URL: ${tokenUrl}`)

    const client = Deno.createHttpClient({
      certChain: certPem,
      privateKey: keyPem,
    })

    const params = new URLSearchParams()
    params.append('client_id', clientId)
    params.append('client_secret', clientSecret)
    params.append('grant_type', 'client_credentials')
    // TENTATIVA 3: Apenas escopos básicos do PIX
    params.append('scope', 'pix.read pix.write')

    // Cabeçalhos da conta (podem ser necessários também no OAuth)
    const contaCorrente = acquirer.account_number || '35476991-0'
    const cnpj = '22535683000114'

    let tokenResponse
    try {
      console.log('⏳ Iniciando handshake TLS com Banco Inter...')
      // @ts-ignore: Deno fetch with client
      tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        body: params,
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-inter-conta-corrente': contaCorrente,
          'x-inter-cpf-cnpj': cnpj
        },
        client,
      })
    } catch (fetchError: any) {
      console.error('❌ Erro fatal na conexão (Possível erro SSL/Certificado):', fetchError)
      throw new Error(`Falha na conexão com Banco Inter: ${fetchError.message}`)
    }

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text()
      console.error('❌ Erro HTTP do Banco Inter:', tokenResponse.status, err)
      throw new Error(`Erro ao obter token (${tokenResponse.status}): ${err}`)
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // 2. Registrar Webhook (PUT)
    // Chave PIX é necessária para registrar o webhook
    const pixKey = acquirer.pix_key
    
    // URL base correta para API Pix V2
    const baseUrl = acquirer.environment === 'sandbox' 
      ? 'https://cdpj-sandbox.partners.bancointer.com.br/pix/v2'
      : 'https://cdpj.partners.bancointer.com.br/pix/v2'
      
    const webhookEndpoint = `${baseUrl}/webhook/${pixKey}`

    console.log(`Registrando webhook para chave ${pixKey} na URL: ${webhookUrl}`)
    console.log(`Endpoint do Banco Inter: ${webhookEndpoint}`)

    // @ts-ignore: Deno fetch with client
    const registerResponse = await fetch(webhookEndpoint, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-inter-conta-corrente': contaCorrente,
        'x-inter-cpf-cnpj': cnpj
      },
      body: JSON.stringify({
        webhookUrl: webhookUrl
      }),
      client
    })

    if (!registerResponse.ok) {
      const err = await registerResponse.text()
      throw new Error(`Erro ao registrar webhook: ${err}`)
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Webhook registrado com sucesso!',
      registeredUrl: webhookUrl
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('Erro:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
