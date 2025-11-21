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
    const {
      user_id,
      amount,
      description,
      pix_key,
      pix_key_type,
      receiver_name,
      receiver_document
    } = await req.json()

    // Validações
    if (!amount || amount <= 0) {
      throw new Error('Valor inválido')
    }

    if (!user_id) {
      throw new Error('Usuário não informado')
    }

    if (!pix_key) {
      throw new Error('Chave PIX não informada')
    }

    // Verificar saldo do usuário
    const { data: wallet, error: walletError } = await supabaseClient
      .from('wallets')
      .select('balance')
      .eq('user_id', user_id)
      .eq('currency_code', 'BRL')
      .single()

    if (walletError || !wallet) {
      throw new Error('Carteira não encontrada')
    }

    if (wallet.balance < amount) {
      throw new Error('Saldo insuficiente')
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

    // Calcular taxas
    const feePercentage = acquirer.fee_percentage || 0
    const feeFixed = acquirer.fee_fixed || 0
    const feeAmount = (amount * feePercentage / 100) + feeFixed
    const netAmount = amount - feeAmount

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
    if (!config.clientId || !config.clientSecret) {
      throw new Error('Credenciais do Banco Inter não configuradas')
    }

    console.log('📨 Enviando PIX via Banco Inter...')

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
          scope: 'pix.read pix.write'
        })
      }
    )

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('❌ Erro ao obter token:', errorData)
      throw new Error('Falha na autenticação com Banco Inter')
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Preparar payload para envio de PIX
    const pixPayload: any = {
      valor: amount,
      chave: pix_key,
      descricao: description || 'Pagamento via PIX'
    }

    // Adicionar dados do favorecido se disponível
    if (receiver_document) {
      const cleanDocument = receiver_document.replace(/[^\d]/g, '')
      if (cleanDocument.length === 11) {
        pixPayload.favorecido = { cpf: cleanDocument }
      } else if (cleanDocument.length === 14) {
        pixPayload.favorecido = { cnpj: cleanDocument }
      }
    }

    // Enviar PIX
    const pixResponse = await fetch(
      `https://cdpj${config.environment === 'sandbox' ? '-sandbox' : ''}.partners.bancointer.com.br/banking/v2/pix`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pixPayload)
      }
    )

    if (!pixResponse.ok) {
      const errorData = await pixResponse.text()
      console.error('❌ Erro ao enviar PIX:', errorData)
      throw new Error('Erro ao enviar PIX pelo Banco Inter')
    }

    const pixData = await pixResponse.json()

    console.log('✅ PIX enviado via Banco Inter:', pixData)

    // Debitar saldo da carteira
    const { error: debitError } = await supabaseClient
      .from('wallets')
      .update({
        balance: wallet.balance - amount
      })
      .eq('user_id', user_id)
      .eq('currency_code', 'BRL')

    if (debitError) {
      console.error('❌ Erro ao debitar saldo:', debitError)
      throw new Error('Erro ao debitar saldo')
    }

    // Registrar transação no banco
    const { data: transaction, error: transactionError } = await supabaseClient
      .from('pix_transactions')
      .insert({
        user_id,
        acquirer_id: acquirer.id,
        transaction_type: 'withdrawal',
        amount,
        fee_amount: feeAmount,
        net_amount: netAmount,
        pix_key,
        pix_key_type,
        pix_e2e_id: pixData.endToEndId,
        pix_txid: pixData.txid,
        status: 'completed',
        description: description || 'Envio via PIX',
        receiver_name,
        receiver_document,
        metadata: {
          banco_inter: true,
          horario: pixData.horario,
          status_inter: pixData.status
        }
      })
      .select()
      .single()

    if (transactionError) {
      console.error('❌ Erro ao registrar transação:', transactionError)
      // Tentar reverter débito
      await supabaseClient
        .from('wallets')
        .update({
          balance: wallet.balance
        })
        .eq('user_id', user_id)
        .eq('currency_code', 'BRL')
      
      throw new Error('Erro ao registrar transação')
    }

    // Registrar transação de taxa
    if (feeAmount > 0) {
      await supabaseClient
        .from('transactions')
        .insert({
          user_id,
          wallet_id: wallet.id,
          type: 'fee',
          amount: -feeAmount,
          currency_code: 'BRL',
          description: `Taxa de envio PIX - ${description || 'Pagamento'}`,
          status: 'completed',
          metadata: {
            pix_transaction_id: transaction.id,
            fee_percentage: feePercentage,
            fee_fixed: feeFixed
          }
        })
    }

    // Criar notificação
    await supabaseClient
      .from('notifications')
      .insert({
        user_id,
        title: 'PIX Enviado',
        message: `PIX de R$ ${amount.toFixed(2)} enviado com sucesso`,
        type: 'pix_sent',
        is_read: false,
        metadata: {
          transaction_id: transaction.id,
          amount,
          pix_key
        }
      })

    // Retornar resposta
    return new Response(
      JSON.stringify({
        success: true,
        transaction_id: transaction.id,
        e2e_id: pixData.endToEndId,
        amount: amount,
        fee_amount: feeAmount,
        net_amount: netAmount
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
        error: error.message || 'Erro ao enviar PIX'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
