# Script para extrair cadeia completa do certificado e atualizar Supabase
# Corrige problemas de mTLS incompletos

$pfxFile = "Inter_Certificado.pfx"
$pass = "1234" # Senha do PFX

Write-Host "=== Extrair Cadeia Completa (Full Chain) ===" -ForegroundColor Cyan

# 1. Localizar OpenSSL
$opensslPaths = @(
    "C:\Program Files\OpenSSL-Win64\bin\openssl.exe",
    "C:\Program Files (x86)\OpenSSL-Win64\bin\openssl.exe",
    "C:\Program Files\OpenSSL\bin\openssl.exe",
    "openssl.exe"
)

$openssl = $null
foreach ($path in $opensslPaths) {
    if (Test-Path $path) {
        $openssl = $path
        break
    }
}

if (-not $openssl) {
    Write-Host "❌ OpenSSL não encontrado!" -ForegroundColor Red
    exit
}

Write-Host "✅ OpenSSL encontrado: $openssl" -ForegroundColor Green

# 2. Extrair Certificado COMPLETO (nokeys = apenas certificados, sem chave privada)
Write-Host "1/2 Extraindo Cadeia Completa..."
& $openssl pkcs12 -in $pfxFile -nokeys -out inter_cert_full.pem -passin pass:$pass

# 3. Atualizar Supabase
if (Test-Path "inter_cert_full.pem") {
    Write-Host "2/2 Atualizando Secret no Supabase..."
    
    $certContent = [IO.File]::ReadAllText("inter_cert_full.pem")
    $certB64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($certContent))

    # Atualiza apenas o certificado (a chave privada continua a mesma)
    supabase secrets set BANCO_INTER_CERTIFICATE=$certB64

    Write-Host "✅ SUCESSO! Cadeia completa configurada." -ForegroundColor Green
    
    # Limpeza opcional
    # Remove-Item inter_cert_full.pem
} else {
    Write-Host "❌ Falha na extração do certificado." -ForegroundColor Red
}
