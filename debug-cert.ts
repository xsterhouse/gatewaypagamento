import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔍 [DEBUG] Iniciando debug de certificado');

    // Carregar secrets
    const certBase64 = Deno.env.get('BANCO_INTER_CERTIFICATE');
    const keyBase64 = Deno.env.get('BANCO_INTER_CERTIFICATE_KEY');

    console.log(`🔍 [DEBUG] Cert secret exists: ${!!certBase64}`);
    console.log(`🔍 [DEBUG] Key secret exists: ${!!keyBase64}`);
    console.log(`🔍 [DEBUG] Cert length: ${certBase64?.length}`);
    console.log(`🔍 [DEBUG] Key length: ${keyBase64?.length}`);

    if (!certBase64 || !keyBase64) {
      throw new Error('Secrets não encontrados');
    }

    // Decodificar Base64
    const certRaw = atob(certBase64);
    const keyRaw = atob(keyBase64);

    console.log(`🔍 [DEBUG] Cert decoded length: ${certRaw.length}`);
    console.log(`🔍 [DEBUG] Key decoded length: ${keyRaw.length}`);
    console.log(`🔍 [DEBUG] Cert starts with: ${certRaw.substring(0, 50)}`);
    console.log(`🔍 [DEBUG] Key starts with: ${keyRaw.substring(0, 50)}`);

    // Verificar se já está em formato PEM
    const isCertPem = certRaw.includes('-----BEGIN CERTIFICATE-----');
    const isKeyPem = keyRaw.includes('-----BEGIN');

    console.log(`🔍 [DEBUG] Cert is PEM: ${isCertPem}`);
    console.log(`🔍 [DEBUG] Key is PEM: ${isKeyPem}`);

    // Tentar criar cliente HTTP
    try {
      const client = Deno.createHttpClient({
        certChain: certRaw,
        privateKey: keyRaw,
      });
      console.log('✅ [DEBUG] Cliente HTTP criado com sucesso');
    } catch (e: any) {
      console.error(`❌ [DEBUG] Erro ao criar cliente HTTP: ${e.message}`);
      throw e;
    }

    // Testar conexão simples
    try {
      const testResponse = await fetch('https://httpbin.org/get', {
        client: Deno.createHttpClient({
          certChain: certRaw,
          privateKey: keyRaw,
        })
      });
      console.log(`🔍 [DEBUG] Test connection status: ${testResponse.status}`);
    } catch (e: any) {
      console.error(`❌ [DEBUG] Erro na conexão de teste: ${e.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      certLength: certRaw.length,
      keyLength: keyRaw.length,
      certIsPem: isCertPem,
      keyIsPem: isKeyPem,
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
