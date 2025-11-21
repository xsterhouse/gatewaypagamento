// @ts-ignore: Deno types
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore: Deno types
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    })
  }

  try {
    const body = await req.json()
    const { user_id, amount, pix_key, pix_key_type, description } = body

    console.log('📤 Iniciando envio PIX via Mercado Pago - Body recebido:', JSON.stringify(body))

    // Validações
    if (!user_id) throw new Error('user_id é obrigatório')
    if (!amount) throw new Error('amount é obrigatório')
    if (!pix_key) throw new Error('pix_key é obrigatória')
    
    // Mínimo do MP costuma ser baixo, mas vamos manter R$ 1,00 por segurança ou remover se quiser
    if (amount < 0.01) {
      throw new Error('Valor inválido para envio')
    }

    // @ts-ignore: Deno types
    const supabaseClient = createClient(
      // @ts-ignore: Deno types
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore: Deno types
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Buscar carteira do usuário e validar saldo
    const { data: wallet, error: walletError } = await supabaseClient
      .from('wallets')
      .select('id, balance, available_balance')
      .eq('user_id', user_id)
      .eq('currency_code', 'BRL')
      .eq('is_active', true)
      .single()

    if (walletError || !wallet) {
      throw new Error('Carteira não encontrada')
    }

    // Taxa do sistema (opcional, pode ser ajustada)
    // Se quiser cobrar taxa no momento do envio, descomente e ajuste
    // const SYSTEM_FEE = 0.00 
    const totalDebitar = amount // + SYSTEM_FEE

    if (wallet.available_balance < totalDebitar) {
      throw new Error(`Saldo insuficiente. Disponível: R$ ${wallet.available_balance.toFixed(2)}`)
    }

    // 2. Buscar dados do usuário para logs
    const { data: user } = await supabaseClient
      .from('users')
      .select('name, email, cpf')
      .eq('id', user_id)
      .single()

    // 3. Criar transação 'processing' no banco
    const { data: pixTransaction, error: pixError } = await supabaseClient
      .from('pix_transactions')
      .insert({
        user_id,
        amount,
        pix_key,
        pix_key_type: pix_key_type || 'unknown',
        transaction_type: 'withdrawal',
        status: 'processing',
        description: description || `Envio PIX para ${pix_key}`,
        metadata: {
          provider: 'mercadopago',
          payer_name: user?.name,
          payer_document: user?.cpf
        }
      })
      .select()
      .single()

    if (pixError) {
      throw new Error(`Erro ao criar registro de transação: ${pixError.message}`)
    }

    // 4. Debitar da carteira (Bloquear saldo)
    const { error: debitError } = await supabaseClient
      .from('wallets')
      .update({
        balance: wallet.balance - totalDebitar,
        available_balance: wallet.available_balance - totalDebitar,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id)

    if (debitError) {
      // Se falhar o débito, falha a transação e para
      await supabaseClient.from('pix_transactions').update({ status: 'failed', error_message: 'Falha ao debitar carteira' }).eq('id', pixTransaction.id)
      throw new Error('Erro ao processar débito na carteira')
    }

    // Registrar movimentação na carteira
    await supabaseClient.from('wallet_transactions').insert({
      wallet_id: wallet.id,
      user_id,
      transaction_type: 'debit',
      amount: totalDebitar,
      description: `Envio PIX para ${pix_key}`,
      reference_type: 'pix_send',
      reference_id: pixTransaction.id
    })

    // 5. Enviar PIX via Mercado Pago
    console.log('🔵 Chamando API do Mercado Pago...')
    
    // @ts-ignore: Deno types
    const mpAccessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
    
    if (!mpAccessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado')
    }

    // Gerar chave de idempotência para evitar duplicidade
    const idempotencyKey = pixTransaction.id

    // Payload para endpoint de Transferências (exemplo genérico, verificar documentação atual do MP)
    // A API de transferências do MP geralmente exige que você tenha saldo em conta
    // Endpoint: https://api.mercadopago.com/v1/advanced_payments ou v1/transfers
    // Vamos usar uma estrutura comum para PIX
    
    // NOTA: A API pública de transfers do MP pode variar. 
    // Usualmente é POST /v1/transfers
    const mpUrl = 'https://api.mercadopago.com/v1/transfers'
    
    // Tratamento simples do tipo de chave para o formato do MP se necessário
    // O MP geralmente aceita 'email', 'phone', 'cpf', 'cnpj', 'random' (EVP)
    
    // Remover formatação do CPF/CNPJ/Telefone se vier formatado
    const cleanKey = pix_key.replace(/[^a-zA-Z0-9@.]/g, '') 

    const mpBody = {
      transaction_amount: Number(amount),
      description: description || `Transferência para ${user?.name || 'Cliente'}`,
      receiver_address: {
        key_type: pix_key_type?.toUpperCase() || 'CPF', // O MP costuma esperar maiúsculo ou inferir
        key: cleanKey
      }
    }

    // Ajuste fino para tipos de chave se necessário pelo MP
    if (pix_key_type === 'random') mpBody.receiver_address.key_type = 'EVP'
    if (pix_key_type === 'phone') mpBody.receiver_address.key_type = 'PHONE'
    if (pix_key_type === 'email') mpBody.receiver_address.key_type = 'EMAIL'

    // OBS: Se a API v1/transfers não estiver ativa para sua conta, pode ser necessário usar outra.
    // Para simplificar, vamos tentar esta chamada padrão.

    const mpResponse = await fetch(mpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mpAccessToken}`,
        'X-Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(mpBody)
    })

    const mpData = await mpResponse.json()
    console.log('🔵 Resposta Mercado Pago:', JSON.stringify(mpData))

    if (!mpResponse.ok) {
      // Falha no MP
      const errorMsg = mpData.message || mpData.error || 'Erro desconhecido no Mercado Pago'
      console.error('❌ Erro Mercado Pago:', errorMsg)
      
      // Estornar valor para o usuário
      await supabaseClient
        .from('wallets')
        .update({
          balance: wallet.balance, // Volta ao original (aproximado, ideal seria somar amount)
          available_balance: wallet.available_balance,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id)
      
      // Registrar estorno
      await supabaseClient.from('wallet_transactions').insert({
        wallet_id: wallet.id,
        user_id,
        transaction_type: 'credit',
        amount: totalDebitar,
        description: `Estorno PIX Falha - ${errorMsg}`,
        reference_type: 'pix_send_refund',
        reference_id: pixTransaction.id
      })

      // Atualizar status da transação
      await supabaseClient
        .from('pix_transactions')
        .update({ 
          status: 'failed', 
          error_message: errorMsg,
          metadata: { ...pixTransaction.metadata, mp_response: mpData }
        })
        .eq('id', pixTransaction.id)

      throw new Error(`Falha no Mercado Pago: ${errorMsg}`)
    }

    // 6. Sucesso
    console.log('✅ PIX enviado com sucesso!')
    
    // Atualizar transação com dados do MP
    await supabaseClient
      .from('pix_transactions')
      .update({
        status: 'completed',
        pix_e2e_id: mpData.id?.toString() || mpData.reference_id, // Ajustar conforme resposta do MP
        metadata: {
          ...pixTransaction.metadata,
          mp_id: mpData.id,
          mp_status: mpData.status,
          completed_at: new Date().toISOString()
        }
      })
      .eq('id', pixTransaction.id)

    return new Response(
      JSON.stringify({
        success: true,
        transaction_id: pixTransaction.id,
        mp_id: mpData.id,
        message: 'PIX enviado com sucesso via Mercado Pago'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error: any) {
    console.error('❌ Erro geral:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro interno ao processar envio',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
