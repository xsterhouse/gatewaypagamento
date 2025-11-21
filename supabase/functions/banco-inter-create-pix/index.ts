import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Inicializar Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Obter dados do request
    const { amount, description, user_id, expires_in_minutes = 30 } = await req.json()

    // Validações
    if (!amount || amount <= 0) {
      throw new Error('Valor inválido')
    }

    if (!user_id) {
      throw new Error('Usuário não informado')
    }

    // Buscar adquirente Banco Inter
    const { data: acquirer, error: acquirerError } = await supabaseClient
      .from('bank_acquirers')
      .select('*')
      .eq('bank_code', '077')
      .eq('is_active', true)
      .single()

    if (acquirerError || !acquirer) {
      throw new Error('Banco Inter não configurado')
    }

    // Preparar credenciais
    const config = {
      clientId: acquirer.client_id,
      clientSecret: acquirer.client_secret,
      certificate: Deno.env.get('BANCO_INTER_CERTIFICATE') || '',
      certificateKey: Deno.env.get('BANCO_INTER_CERTIFICATE_KEY') || '',
      accountNumber: acquirer.account_number || Deno.env.get('BANCO_INTER_ACCOUNT_NUMBER') || '',
      environment: acquirer.environment || 'production'
    }

    // Validar credenciais
    if (!config.clientId || !config.clientSecret || !config.certificate || !config.certificateKey) {
      throw new Error('Credenciais do Banco Inter não configuradas')
    }

    console.log('📨 Criando cobrança PIX via Banco Inter...')

    // Criar cliente HTTP com certificados (mTLS)
    // Decodificar certificados de Base64
    const certPem = atob(config.certificate)
    const keyPem = atob(config.certificateKey)

    const client = Deno.createHttpClient({
      certChain: certPem,
      privateKey: keyPem,
    })

    // Obter token de acesso
    const tokenResponse = await fetch(
      `https://cdpj${config.environment === 'sandbox' ? '-sandbox' : ''}.partners.bancointer.com.br/oauth/v2/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          grant_type: 'client_credentials',
          scope: 'cob.read cob.write pix.write pix.read'
        }),
        client // Usar o cliente com certificado
      }
    )

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('❌ Erro ao obter token:', errorData)
      throw new Error('Falha na autenticação com Banco Inter')
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Gerar txid único
    const txid = generateTxid()

    // Criar cobrança PIX
    const pixPayload = {
      calendario: {
        expiracao: expires_in_minutes * 60 // converter para segundos
      },
      valor: {
        original: amount.toFixed(2)
      },
      chave: acquirer.pix_key,
      solicitacaoPagador: description || 'Pagamento'
    }

    const pixResponse = await fetch(
      `https://cdpj${config.environment === 'sandbox' ? '-sandbox' : ''}.partners.bancointer.com.br/banking/v2/cob/${txid}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pixPayload),
        client // Usar o cliente com certificado
      }
    )

    if (!pixResponse.ok) {
      const errorData = await pixResponse.text()
      console.error('❌ Erro ao criar cobrança PIX:', errorData)
      throw new Error('Erro ao criar cobrança PIX no Banco Inter')
    }

    const pixData = await pixResponse.json()

    console.log('✅ Cobrança PIX criada:', pixData)

    // Calcular data de expiração
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + expires_in_minutes)

    // Registrar transação no banco
    const { data: transaction, error: transactionError } = await supabaseClient
      .from('pix_transactions')
      .insert({
        user_id,
        acquirer_id: acquirer.id,
        transaction_type: 'deposit',
        amount,
        fee_amount: 0,
        net_amount: amount,
        pix_code: pixData.pixCopiaECola,
        pix_qr_code: pixData.pixCopiaECola,
        pix_txid: txid,
        status: 'pending',
        description: description || 'Depósito via PIX',
        expires_at: expiresAt.toISOString(),
        metadata: {
          banco_inter: true,
          location: pixData.location,
          revisao: pixData.revisao
        }
      })
      .select()
      .single()

    if (transactionError) {
      console.error('❌ Erro ao registrar transação:', transactionError)
      throw new Error('Erro ao registrar transação')
    }

    // Retornar resposta
    return new Response(
      JSON.stringify({
        success: true,
        transaction_id: transaction.id,
        pix_code: pixData.pixCopiaECola,
        qr_code_base64: pixData.pixCopiaECola,
        txid: txid,
        expires_at: expiresAt.toISOString(),
        amount: amount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error: any) {
    console.error('❌ Erro na função:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro ao criar cobrança PIX'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

// Função auxiliar para gerar txid
function generateTxid(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let txid = ''
  for (let i = 0; i < 32; i++) {
    txid += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return txid
}
