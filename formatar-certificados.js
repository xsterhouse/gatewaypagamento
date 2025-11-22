const fs = require('fs');
const path = require('path');

// Nomes dos arquivos que vamos procurar
const CERT_NAME = 'Inter API_Certificado.crt';
const KEY_NAME = 'Inter API_Chave.key';

console.log(`🔍 Procurando arquivos na pasta: ${process.cwd()}`);

// Função para formatar o conteúdo
function formatarConteudo(conteudo) {
    // Remove quebras de linha e substitui por \n literal para a Vercel
    return conteudo
        .replace(/\r\n/g, '\n') // Padroniza quebras de linha Windows
        .replace(/\n/g, '\\n'); // Substitui por \n literal
}

// Tenta ler o Certificado
try {
    const certPath = path.join(process.cwd(), CERT_NAME);
    if (fs.existsSync(certPath)) {
        const conteudo = fs.readFileSync(certPath, 'utf8');
        console.log('\n✅ CERTIFICADO ENCONTRADO! Copie a linha abaixo para BANCO_INTER_CERTIFICATE:\n');
        console.log(formatarConteudo(conteudo));
    } else {
        console.log(`\n❌ Arquivo "${CERT_NAME}" NÃO encontrado nesta pasta.`);
    }
} catch (error) {
    console.error('Erro ao ler certificado:', error.message);
}

// Tenta ler a Chave
try {
    const keyPath = path.join(process.cwd(), KEY_NAME);
    if (fs.existsSync(keyPath)) {
        const conteudo = fs.readFileSync(keyPath, 'utf8');
        console.log('\n✅ CHAVE ENCONTRADA! Copie a linha abaixo para BANCO_INTER_CERTIFICATE_KEY:\n');
        console.log(formatarConteudo(conteudo));
    } else {
        console.log(`\n❌ Arquivo "${KEY_NAME}" NÃO encontrado nesta pasta.`);
    }
} catch (error) {
    console.error('Erro ao ler chave:', error.message);
}

console.log('\n---------------------------------------------------');
console.log('DICA: Se os arquivos não foram encontrados:');
console.log('1. Verifique se eles estão nesta mesma pasta.');
console.log('2. Verifique se os nomes são EXATAMENTE:');
console.log(`   - ${CERT_NAME}`);
console.log(`   - ${KEY_NAME}`);
console.log('---------------------------------------------------');