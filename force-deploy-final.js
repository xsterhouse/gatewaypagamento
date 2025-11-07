// Script para forçar deploy final na Vercel
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 FORÇANDO DEPLOY FINAL NA VERCEL');
console.log('='.repeat(50));

// 1. Verificar status atual
console.log('1️⃣ Verificando status do git...');
try {
  const status = execSync('git status', { encoding: 'utf8' });
  console.log(status);
} catch (error) {
  console.log('Erro ao verificar status:', error.message);
}

// 2. Fazer force push para garantir atualização
console.log('2️⃣ Forçando push para main...');
try {
  execSync('git push origin main --force', { encoding: 'utf8' });
  console.log('✅ Force push realizado com sucesso!');
} catch (error) {
  console.log('Erro no force push:', error.message);
}

// 3. Criar arquivo de versão para forçar rebuild
console.log('3️⃣ Criando arquivo de versão...');
const version = {
  deployTime: new Date().toISOString(),
  version: '1.0.0-final',
  changes: [
    'Email system production ready',
    'Modernized login UI',
    'Serverless functions for Vercel',
    'Environment variables configured'
  ]
};

fs.writeFileSync('public/version.json', JSON.stringify(version, null, 2));
console.log('✅ Arquivo version.json criado!');

// 4. Commit final
console.log('4️⃣ Fazendo commit final...');
execSync('git add public/version.json', { encoding: 'utf8' });
execSync('git commit -m "force: trigger final deploy with all changes"', { encoding: 'utf8' });

// 5. Push final
console.log('5️⃣ Push final...');
execSync('git push origin main', { encoding: 'utf8' });

console.log('🎉 DEPLOY FINAL FORÇADO COM SUCESSO!');
console.log('A Vercel vai fazer deploy automático agora.');
