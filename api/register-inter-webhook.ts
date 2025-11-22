import type { VercelRequest, VercelResponse } from '@vercel/node';
import https from 'https';

// Função para obter o token de acesso do Banco Inter
function getAccessToken(cert: string, key: string, clientId: string, clientSecret: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const data = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'client_credentials',
            scope: 'pix.read pix.write webhook.read webhook.write'
        }).toString();

        const options = {
            hostname: 'cdpj.partners.bancointer.com.br',
            port: 443,
            path: '/oauth/v2/token',
            method: 'POST',
            key: key.replace(/\\n/g, '\n'),
            cert: cert.replace(/\\n/g, '\n'),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const parsed = JSON.parse(body);
                        resolve(parsed.access_token);
                    } catch (e) {
                        reject(new Error('Erro ao fazer parse do token'));
                    }
                } else {
                    const err = new Error(`Erro HTTP ${res.statusCode} ao obter token`);
                    (err as any).responseBody = body;
                    reject(err);
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(data);
        req.end();
    });
}

// Função para registrar o webhook
function registerWebhook(token: string, cert: string, key: string, pixKey: string, webhookUrl: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const path = `/pix/v2/webhook/${pixKey}`;
        const data = JSON.stringify({ webhookUrl });

        const options = {
            hostname: 'cdpj.partners.bancointer.com.br',
            port: 443,
            path: path,
            method: 'PUT',
            key: key.replace(/\\n/g, '\n'),
            cert: cert.replace(/\\n/g, '\n'),
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
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(body ? JSON.parse(body) : {});
                } else {
                    const err = new Error(`Erro HTTP ${res.statusCode} ao registrar webhook`);
                    (err as any).responseBody = body;
                    reject(err);
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(data);
        req.end();
    });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { webhookUrl, pixKey } = req.body;

        if (!webhookUrl || !pixKey) {
            return res.status(400).json({ error: 'webhookUrl e pixKey são obrigatórios' });
        }

        const {
            BANCO_INTER_CLIENT_ID,
            BANCO_INTER_CLIENT_SECRET,
            BANCO_INTER_CERTIFICATE,
            BANCO_INTER_CERTIFICATE_KEY,
        } = process.env;

        if (!BANCO_INTER_CLIENT_ID || !BANCO_INTER_CLIENT_SECRET || !BANCO_INTER_CERTIFICATE || !BANCO_INTER_CERTIFICATE_KEY) {
            return res.status(500).json({ error: 'Variáveis de ambiente do Banco Inter não configuradas' });
        }

        console.log('Obtendo token...');
        const token = await getAccessToken(
            BANCO_INTER_CERTIFICATE,
            BANCO_INTER_CERTIFICATE_KEY,
            BANCO_INTER_CLIENT_ID,
            BANCO_INTER_CLIENT_SECRET
        );
        console.log('Token obtido com sucesso.');

        console.log('Registrando webhook...');
        await registerWebhook(
            token,
            BANCO_INTER_CERTIFICATE,
            BANCO_INTER_CERTIFICATE_KEY,
            pixKey,
            webhookUrl
        );
        console.log('Webhook registrado com sucesso.');

        return res.status(200).json({ success: true, message: 'Webhook registrado com sucesso!' });

    } catch (error: any) {
        console.error('Erro na serverless function:', error);
        return res.status(500).json({ 
            error: 'Falha ao registrar webhook', 
            details: error.message,
            responseBody: error.responseBody 
        });
    }
}