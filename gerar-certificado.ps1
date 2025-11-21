# Script para Gerar Certificado em Base64 para Banco Inter
# Salve como gerar-certificado.ps1 e execute com PowerShell

Write-Host "🔐 Gerador de Certificado Banco Inter para Supabase" -ForegroundColor Cyan
Write-Host "=================================================="

# Função para converter arquivo para Base64
function Convert-ToBase64 {
    param([string]$filePath)
    if (Test-Path $filePath) {
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        return [Convert]::ToBase64String($bytes)
    }
    return $null
}

# Procurar arquivos
$pfxPath = ".\certificado.pfx"
$certPath = ".\Inter API_Certificado"     # Nome específico do usuário
$certCrtPath = ".\Inter API_Certificado.crt" # Caso tenha extensão oculta
$keyPath = ".\Inter API_Chave.key"        # Nome específico do usuário

# Verificar PFX (Certificado A1)
if (Test-Path $pfxPath) {
    Write-Host "⚠️  Arquivo .pfx detectado." -ForegroundColor Yellow
    Write-Host "Para arquivos .pfx, você precisa extrair o certificado e a chave privada primeiro."
    Write-Host "Você precisará do OpenSSL instalado para isso."
    Write-Host ""
    Write-Host "Comandos para extrair (execute no terminal):"
    Write-Host "openssl pkcs12 -in certificado.pfx -clcerts -nokeys -out certificado.pem" -ForegroundColor Green
    Write-Host "openssl pkcs12 -in certificado.pfx -nocerts -nodes -out chave.key" -ForegroundColor Green
    exit
}

# Verificar PEM/KEY
$certFile = if (Test-Path $certPath) { $certPath } elseif (Test-Path $certCrtPath) { $certCrtPath } else { $null }
$keyFile = if (Test-Path $keyPath) { $keyPath } else { $null }

if ($certFile -and $keyFile) {
    Write-Host "✅ Arquivos encontrados:" -ForegroundColor Green
    Write-Host "Certificado: $certFile"
    Write-Host "Chave Privada: $keyFile"
    Write-Host ""

    $certBase64 = Convert-ToBase64 $certFile
    $keyBase64 = Convert-ToBase64 $keyFile

    Write-Host "📋 Copie e cole estes comandos no Terminal do VSCode:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "supabase secrets set BANCO_INTER_CERTIFICATE=""$certBase64""" -ForegroundColor White
    Write-Host ""
    Write-Host "supabase secrets set BANCO_INTER_CERTIFICATE_KEY=""$keyBase64""" -ForegroundColor White
    Write-Host ""
    Write-Host "supabase secrets set BANCO_INTER_ACCOUNT_NUMBER=""12345678""" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  DICA: Substitua '12345678' pelo número da sua conta sem dígito." -ForegroundColor Yellow
    
    # Salvar em arquivo para facilitar
    $output = "BANCO_INTER_CERTIFICATE=""$certBase64""`nBANCO_INTER_CERTIFICATE_KEY=""$keyBase64"""
    $output | Out-File "credenciais-base64.txt"
    Write-Host "✅ As credenciais também foram salvas no arquivo 'credenciais-base64.txt'" -ForegroundColor Green
}
else {
    Write-Host "❌ Arquivos de certificado não encontrados." -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor, coloque os arquivos na pasta raiz:"
    Write-Host "1. certificado.pem (ou certificado.crt)"
    Write-Host "2. chave.key"
    Write-Host ""
    Write-Host "Ou se tiver um .pfx, renomeie para 'certificado.pfx' e execute este script novamente."
}
