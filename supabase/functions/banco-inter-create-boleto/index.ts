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
      due_date,
      payer_name,
      payer_email,
      payer_document,
      payer_address
    } = await req.json()

    // Validações
    if (!amount || amount <= 0) {
      throw new Error('Valor inválido')
    }

    if (!user_id) {
      throw new Error('Usuário não informado')
    }

    if (!payer_name || !payer_document) {
      throw new Error('Dados do pagador incompletos')
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
      environment: acquirer.environment || 'production'
    }

    // Validar credenciais
    if (!config.clientId || !config.clientSecret) {
      throw new Error('Credenciais do Banco Inter não configuradas')
    }

    console.log('📄 Criando boleto via Banco Inter...')

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
          scope: 'boleto-cobranca.read boleto-cobranca.write'
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

    // Preparar data de vencimento
    const dueDate = due_date ? new Date(due_date) : new Date()
    if (!due_date) {
      dueDate.setDate(dueDate.getDate() + 3) // Padrão: 3 dias
    }

    // Limpar documento
    const cleanDocument = payer_document.replace(/[^\d]/g, '')
    const tipoPessoa = cleanDocument.length === 11 ? 'FISICA' : 'JURIDICA'

    // Gerar número único para o boleto
    const seuNumero = `BOL${Date.now()}${Math.floor(Math.random() * 1000)}`

    // Preparar payload do boleto
    const boletoPayload = {
      seuNumero,
      valorNominal: amount,
      dataVencimento: dueDate.toISOString().split('T')[0],
      numDiasAgenda: 60, // Dias para baixa automática após vencimento
      pagador: {
        cpfCnpj: cleanDocument,
        tipoPessoa,
        nome: payer_name,
        endereco: payer_address?.street || 'Não informado',
        numero: payer_address?.number || 'S/N',
        complemento: payer_address?.complement || '',
        bairro: payer_address?.neighborhood || 'Centro',
        cidade: payer_address?.city || 'São Paulo',
        uf: payer_address?.state || 'SP',
        cep: payer_address?.zip_code?.replace(/[^\d]/g, '') || '00000000'
      },
      mensagem: {
        linha1: description || 'Pagamento de serviços'
      },
      desconto: {
        codigoDesconto: 'NAOTEMDESCONTO'
      },
      multa: {
        codigoMulta: 'PERCENTUAL',
        taxa: 2.00, // 2% de multa
        data: dueDate.toISOString().split('T')[0]
      },
      mora: {
        codigoMora: 'TAXAMENSAL',
        taxa: 1.00, // 1% ao mês
        data: dueDate.toISOString().split('T')[0]
      }
    }

    // Criar boleto
    const boletoResponse = await fetch(
      `https://cdpj${config.environment === 'sandbox' ? '-sandbox' : ''}.partners.bancointer.com.br/cobranca/v3/cobrancas`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(boletoPayload)
      }
    )

    if (!boletoResponse.ok) {
      const errorData = await boletoResponse.text()
      console.error('❌ Erro ao criar boleto:', errorData)
      throw new Error('Erro ao criar boleto no Banco Inter')
    }

    const boletoData = await boletoResponse.json()

    console.log('✅ Boleto criado via Banco Inter:', boletoData)

    // Obter PDF do boleto
    let pdfBase64 = null
    try {
      const pdfResponse = await fetch(
        `https://cdpj${config.environment === 'sandbox' ? '-sandbox' : ''}.partners.bancointer.com.br/cobranca/v3/cobrancas/${boletoData.nossoNumero}/pdf`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          }
        }
      )

      if (pdfResponse.ok) {
        const pdfBuffer = await pdfResponse.arrayBuffer()
        pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)))
      }
    } catch (pdfError) {
      console.error('⚠️ Erro ao obter PDF:', pdfError)
      // Continua mesmo sem o PDF
    }

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
        pix_code: boletoData.pixCopiaECola || null,
        pix_qr_code: boletoData.qrCode || null,
        status: 'pending',
        description: description || 'Boleto bancário',
        payer_name,
        payer_document,
        expires_at: dueDate.toISOString(),
        metadata: {
          banco_inter: true,
          boleto: true,
          nosso_numero: boletoData.nossoNumero,
          seu_numero: seuNumero,
          codigo_barras: boletoData.codigoBarras,
          linha_digitavel: boletoData.linhaDigitavel,
          data_vencimento: boletoData.dataVencimento,
          pdf_available: !!pdfBase64
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
        boleto: {
          nosso_numero: boletoData.nossoNumero,
          seu_numero: seuNumero,
          codigo_barras: boletoData.codigoBarras,
          linha_digitavel: boletoData.linhaDigitavel,
          data_vencimento: boletoData.dataVencimento,
          valor_nominal: amount,
          pix_copia_e_cola: boletoData.pixCopiaECola || null,
          qr_code: boletoData.qrCode || null,
          pdf_base64: pdfBase64
        }
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
        error: error.message || 'Erro ao criar boleto'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
