import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { BancoInterAPI } from '../../src/lib/banco-inter.ts' // Vamos adaptar isso
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

    // Decodificar certificados
    const certPem = atob(cert)
    const keyPem = atob(key)

    // Obter Token OAuth
    const tokenUrl = acquirer.api_auth_url
    const clientId = acquirer.client_id
    const clientSecret = acquirer.client_secret

    const client = Deno.createHttpClient({
      certChain: certPem,
      privateKey: keyPem,
    })

    const params = new URLSearchParams()
    params.append('client_id', clientId)
    params.append('client_secret', clientSecret)
    params.append('grant_type', 'client_credentials')
    params.append('scope', 'pix.read pix.write boleto-cobranca.read boleto-cobranca.write webhook.read webhook.write')

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      body: params,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      client,
    })

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text()
      throw new Error(`Erro ao obter token: ${err}`)
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // 2. Registrar Webhook (PUT)
    // Chave PIX é necessária para registrar o webhook
    const pixKey = acquirer.pix_key
    const webhookEndpoint = `${acquirer.api_pix_url}/webhook/${pixKey}`

    console.log(`Registrando webhook para chave ${pixKey} na URL: ${webhookUrl}`)

    const registerResponse = await fetch(webhookEndpoint, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
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

  } catch (error) {
    console.error('Erro:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
