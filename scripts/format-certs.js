const fs = require('fs');
const path = require('path');

// Nomes dos seus arquivos de certificado (ajuste se necessário)
const CERT_FILE = 'Inter API_Certificado.crt';
const KEY_FILE = 'Inter API_Chave.key';

// Tenta encontrar na raiz ou pasta atual
const findFile = (filename) => {
    const paths = [
        path.join(process.cwd(), filename),
        path.join(process.cwd(), 'certs', filename),
        path.join(__dirname, '..', filename)
    ];
    
    for (const p of paths) {
        if (fs.existsSync(p)) return p;
    }
    return null;
};

function formatFile(filePath) {
    if (!filePath) return null;
    const content = fs.readFileSync(filePath, 'utf8');
    // Remove quebras de linha e substitui por \n literal
    return content.replace(/\r\n/g, '\n').replace(/\n/g, '\\n');
}

console.log('🔍 Procurando certificados...');

const certPath = findFile(CERT_FILE);
const keyPath = findFile(KEY_FILE);

console.log('\n---------------------------------------------------');
console.log('📋 VALORES PARA COLAR NA VERCEL (ENVIRONMENT VARIABLES)');
console.log('---------------------------------------------------\n');

if (certPath) {
    console.log('✅ BANCO_INTER_CERTIFICATE:');
    console.log(formatFile(certPath));
    console.log('\n');
} else {
    console.log(`❌ Arquivo ${CERT_FILE} não encontrado.`);
}

if (keyPath) {
    console.log('✅ BANCO_INTER_CERTIFICATE_KEY:');
    console.log(formatFile(keyPath));
    console.log('\n');
} else {
    console.log(`❌ Arquivo ${KEY_FILE} não encontrado.`);
}

console.log('---------------------------------------------------');
console.log('ℹ️  Copie o texto inteiro (incluindo BEGIN e END) e cole no campo Value na Vercel.');