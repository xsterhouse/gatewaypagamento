const https = require('https');
const fs = require('fs');
const path = require('path');

// --- CONFIGURAÇÃO ---
const CLIENT_ID = '4d6bc9a6-2ace-4c02-9081-325562b0bdc0';
const CLIENT_SECRET = '8e25bb66-b1e3-40e4-9673-d4997b8db8cd';
const CERT_FILE = 'Inter API_Certificado.crt';
const KEY_FILE = 'Inter API_Chave.key';

// URL do seu Webhook no Supabase
const WEBHOOK_URL = 'https://plbcnvnsvytzqrhgybjd.supabase.co/functions/v1/banco-inter-webhook';

// Chave Pix (obrigatório para registrar o webhook Pix)
// Se não tiver, tente registrar primeiro o webhook de Cobrança/Banking que não exige chave pix na URL base
const PIX_KEY = '78101281'; // Do seu log anterior "Operador 78101281"? Ou CPF/CNPJ?
// SE FOR PIX, PRECISA DA CHAVE PIX VÁLIDA.
// SE FOR BANKING/COBRANCA, A URL É DIFERENTE.

// Vamos tentar primeiro obter o TOKEN
async function main() {
    try {
        console.log('🔍 Lendo certificados...');
        const cert = fs.readFileSync(path.join(__dirname, CERT_FILE));
        const key = fs.readFileSync(path.join(__dirname, KEY_FILE));

        console.log('🔄 Obtendo Token OAuth...');
        const token = await getAccessToken(cert, key);
        console.log('✅ Token obtido com sucesso!');
        // console.log('Token:', token);

        console.log('🚀 Registrando Webhook...');
        await registrarWebhook(token, cert, key);
        console.log('✅ Webhook registrado com sucesso!');

    } catch (error) {
        console.error('❌ Erro:', error.message);
        if (error.responseBody) {
            console.error('Detalhes:', error.responseBody);
        }
    }
}

function getAccessToken(cert, key) {
    return new Promise((resolve, reject) => {
        const data = new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'client_credentials',
            scope: 'pix.read pix.write boleto-cobranca.read boleto-cobranca.write banking.read banking.write'
        }).toString();

        const options = {
            hostname: 'cdpj.partners.bancointer.com.br',
            port: 443,
            path: '/oauth/v2/token',
            method: 'POST',
            key: key,
            cert: cert,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const parsed = JSON.parse(body);
                        resolve(parsed.access_token);
                    } catch (e) {
                        reject(new Error('Erro ao fazer parse do token'));
                    }
                } else {
                    const err = new Error(`Erro HTTP ${res.statusCode}`);
                    err.responseBody = body;
                    reject(err);
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(data);
        req.end();
    });
}

function registrarWebhook(token, cert, key) {
    return new Promise((resolve, reject) => {
        // ATENÇÃO: Escolha o endpoint correto. 
        // Para PIX: /pix/v2/webhook/{chave}
        // Para Cobrança: /cobranca/v3/webhook (não precisa chave na URL)
        
        // Vamos tentar PIX primeiro, pois é o mais comum.
        // Substitua PIX_KEY pela sua chave PIX real se '78101281' não for ela.
        const path = `/pix/v2/webhook/${PIX_KEY}`; 
        
        const data = JSON.stringify({
            webhookUrl: WEBHOOK_URL
        });

        const options = {
            hostname: 'cdpj.partners.bancointer.com.br',
            port: 443,
            path: path,
            method: 'PUT',
            key: key,
            cert: cert,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(body);
                } else {
                    const err = new Error(`Erro HTTP ${res.statusCode}`);
                    err.responseBody = body;
                    reject(err);
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(data);
        req.end();
    });
}

main();
