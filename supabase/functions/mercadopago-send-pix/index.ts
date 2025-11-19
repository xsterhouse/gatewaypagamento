// @ts-ignore: Deno types
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore: Deno types
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { BancoInterService } from '../_shared/bancoInter.ts'

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
    const { user_id, amount, pix_key, pix_key_type } = body

    console.log('📤 Iniciando saque PIX - Body recebido:', JSON.stringify(body))
    console.log('📤 Dados extraídos:', { user_id, amount, pix_key_type, pix_key_length: pix_key?.length })

    // Validações
    if (!user_id) {
      throw new Error('user_id é obrigatório')
    }
    if (!amount) {
      throw new Error('amount é obrigatório')
    }
    if (!pix_key) {
      throw new Error('pix_key é obrigatória')
    }
    if (!pix_key_type) {
      throw new Error('pix_key_type é obrigatório')
    }

    if (amount < 1.00) {
      throw new Error('Valor mínimo para saque é R$ 1,00')
    }

    // @ts-ignore: Deno types
    const supabaseClient = createClient(
      // @ts-ignore: Deno types
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore: Deno types
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Buscar carteira do usuário
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

    // Validar saldo (considerando taxa mínima de R$ 1,70)
    const TAXA_MINIMA = 1.70
    const saldoDisponivel = wallet.available_balance - TAXA_MINIMA

    if (amount > saldoDisponivel) {
      throw new Error(`Saldo insuficiente. Disponível: R$ ${saldoDisponivel.toFixed(2)}`)
    }

    // Buscar dados do usuário
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('name, email, cpf')
      .eq('id', user_id)
      .single()

    if (userError || !user) {
      throw new Error('Usuário não encontrado')
    }

    // Criar transação PIX de saque
    console.log('📝 Criando transação PIX com dados:', {
      user_id,
      amount,
      transaction_type: 'withdrawal',
      status: 'pending',
      user_name: user.name,
      user_cpf: user.cpf
    })

    const { data: pixTransaction, error: pixError } = await supabaseClient
      .from('pix_transactions')
      .insert({
        user_id,
        amount,
        pix_key,
        pix_key_type,
        transaction_type: 'withdrawal',
        status: 'pending',
        description: `Saque PIX para ${pix_key_type}`,
        metadata: {
          payer_name: user.name,
          payer_document: user.cpf,
          withdrawal: true
        }
      })
      .select()
      .single()

    if (pixError) {
      console.error('Erro ao criar transação PIX:', pixError)
      console.error('Detalhes do erro:', JSON.stringify(pixError))
      throw new Error(`Erro ao criar transação: ${pixError.message || pixError.code || JSON.stringify(pixError)}`)
    }

    console.log('✅ Transação PIX criada:', pixTransaction.id)

    // Debitar da carteira do usuário ANTES de enviar o PIX
    const { error: debitError } = await supabaseClient
      .from('wallets')
      .update({
        balance: wallet.balance - amount,
        available_balance: wallet.available_balance - amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id)

    if (debitError) {
      console.error('Erro ao debitar carteira:', debitError)
      throw new Error('Erro ao processar débito')
    }

    // Registrar transação na carteira
    await supabaseClient
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        user_id,
        transaction_type: 'debit',
        amount,
        balance_before: wallet.balance,
        balance_after: wallet.balance - amount,
        description: `Saque PIX para ${pix_key_type}: ${pix_key}`,
        reference_type: 'pix_transaction',
        reference_id: pixTransaction.id,
        created_at: new Date().toISOString()
      })

    // Configurar Banco Inter
    // @ts-ignore: Deno types
    const bancoInterConfig = {
      clientId: Deno.env.get('BANCO_INTER_CLIENT_ID') ?? '',
      clientSecret: Deno.env.get('BANCO_INTER_CLIENT_SECRET') ?? '',
      certificate: Deno.env.get('BANCO_INTER_CERTIFICATE') ?? '',
      certificateKey: Deno.env.get('BANCO_INTER_CERTIFICATE_KEY') ?? '',
      accountNumber: Deno.env.get('BANCO_INTER_ACCOUNT_NUMBER') ?? ''
    }

    console.log('📨 Enviando PIX via Banco Inter...')

    try {
      const bancoInter = new BancoInterService(bancoInterConfig)
      
      // Enviar PIX via Banco Inter
      const pixResult = await bancoInter.sendPixPayment({
        valor: amount,
        chave: pix_key,
        tipoChave: pix_key_type as 'CPF' | 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'EVP',
        descricao: `Saque PIX - ${user.name}`
      })

      console.log('✅ PIX enviado via Banco Inter:', pixResult)

      // Atualizar transação com sucesso
      const { error: updateError } = await supabaseClient
        .from('pix_transactions')
        .update({
          status: 'completed',
          pix_e2e_id: pixResult.endToEndId,
          pix_txid: pixResult.txid,
          metadata: {
            ...pixTransaction.metadata,
            banco_inter_response: pixResult,
            completed_at: new Date().toISOString()
          }
        })
        .eq('id', pixTransaction.id)

      if (updateError) {
        console.error('Erro ao atualizar transação:', updateError)
      }
    } catch (pixError: any) {
      console.error('❌ Erro ao enviar PIX via Banco Inter:', pixError)
      
      // Atualizar transação como falha
      await supabaseClient
        .from('pix_transactions')
        .update({
          status: 'failed',
          metadata: {
            ...pixTransaction.metadata,
            error: pixError.message,
            failed_at: new Date().toISOString()
          }
        })
        .eq('id', pixTransaction.id)

      // Reverter débito da carteira
      await supabaseClient
        .from('wallets')
        .update({
          balance: wallet.balance,
          available_balance: wallet.available_balance,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id)

      throw new Error(`Falha ao enviar PIX: ${pixError.message}`)
    }

    console.log('✅ Saque processado com sucesso!')

    return new Response(
      JSON.stringify({
        success: true,
        transaction_id: pixTransaction.id,
        amount,
        status: 'completed',
        message: 'Saque PIX realizado com sucesso! O valor foi enviado para a chave informada.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error: any) {
    console.error('❌ Erro ao processar saque:', error)
    console.error('❌ Stack trace:', error.stack)
    console.error('❌ Error details:', JSON.stringify(error))
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro ao processar saque',
        details: error.toString(),
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
