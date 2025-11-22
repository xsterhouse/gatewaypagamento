import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🧪 [TEST] Iniciando teste de certificado Banco Inter');

    // Carregar secrets
    const certBase64 = Deno.env.get('BANCO_INTER_CERTIFICATE');
    const keyBase64 = Deno.env.get('BANCO_INTER_CERTIFICATE_KEY');

    if (!certBase64 || !keyBase64) {
      throw new Error('Secrets de certificado não encontrados');
    }

    // Decodificar Base64
    const certRaw = atob(certBase64);
    const keyRaw = atob(keyBase64);

    // Função helper para formatar PEM se necessário
    const formatPem = (pem: string, type: string) => {
      if (pem.includes('-----BEGIN')) return pem;
      const clean = pem.replace(/\s/g, '');
      const chunks = clean.match(/.{1,64}/g) || [];
      return `-----BEGIN ${type}-----\n${chunks.join('\n')}\n-----END ${type}-----`;
    };

    const certPem = formatPem(certRaw, 'CERTIFICATE');
    const keyPem = keyRaw.includes('PRIVATE KEY') ? keyRaw : formatPem(keyRaw, 'PRIVATE KEY');

    console.log('🧪 [TEST] Certificado formatado com sucesso');
    console.log(`🧪 [TEST] Certificado length: ${certPem.length}`);
    console.log(`🧪 [TEST] Chave length: ${keyPem.length}`);
    console.log(`🧪 [TEST] Certificado começa com: ${certPem.substring(0, 50)}...`);
    console.log(`🧪 [TEST] Chave começa com: ${keyPem.substring(0, 50)}...`);

    // Configurar Cliente HTTP com mTLS
    const client = Deno.createHttpClient({
      certChain: certPem,
      privateKey: keyPem,
    });

    console.log('🧪 [TEST] Cliente HTTP criado com sucesso');

    // Testar conexão com o endpoint do Banco Inter
    const testUrl = 'https://cdpj.partners.bancointer.com.br/oauth/v2/token';
    
    // Testar uma requisição simples sem autenticação para ver se o mTLS funciona
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials&client_id=test&client_secret=test',
      client: client,
    });

    console.log(`🧪 [TEST] Status da resposta: ${response.status}`);
    console.log(`🧪 [TEST] Headers:`, Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log(`🧪 [TEST] Corpo da resposta: ${responseText}`);

    return new Response(JSON.stringify({
      success: true,
      certLength: certPem.length,
      keyLength: keyPem.length,
      testStatus: response.status,
      testResponse: responseText,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error(`❌ [ERROR] ${error.message}`);
    console.error(`❌ [STACK] ${error.stack}`);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
