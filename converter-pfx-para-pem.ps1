# Script para converter PFX para PEM e configurar Supabase
# Tenta localizar OpenSSL automaticamente

$pfxFile = "Inter_Certificado.pfx"
$pass = "1234" # Senha do PFX

Write-Host "=== Conversor PFX -> PEM ===" -ForegroundColor Cyan

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
    # Tenta verificar se está no PATH
    if (Get-Command $path -ErrorAction SilentlyContinue) {
        $openssl = $path
        break
    }
}

if (-not $openssl) {
    Write-Host "❌ OpenSSL não encontrado! Reinicie o terminal ou instale o OpenSSL." -ForegroundColor Red
    exit
}

Write-Host "✅ OpenSSL encontrado em: $openssl" -ForegroundColor Green

# 2. Converter PFX para KEY (com senha temporária depois remove)
Write-Host "1/3 Extraindo Key..."
& $openssl pkcs12 -in $pfxFile -nocerts -out inter_key_encrypted.pem -passin pass:$pass -passout pass:$pass
& $openssl rsa -in inter_key_encrypted.pem -out inter_key.pem -passin pass:$pass

# 3. Converter PFX para CERT
Write-Host "2/3 Extraindo Certificado..."
& $openssl pkcs12 -in $pfxFile -clcerts -nokeys -out inter_cert.pem -passin pass:$pass

# 4. Ler arquivos e atualizar Supabase
if ((Test-Path "inter_key.pem") -and (Test-Path "inter_cert.pem")) {
    Write-Host "3/3 Configurando Secrets no Supabase..."
    
    $certContent = [IO.File]::ReadAllText("inter_cert.pem")
    $keyContent = [IO.File]::ReadAllText("inter_key.pem")
    
    # Converter para Base64 para evitar problemas de quebra de linha no transporte
    $certB64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($certContent))
    $keyB64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($keyContent))

    # Enviar para Supabase
    supabase secrets set BANCO_INTER_CERTIFICATE=$certB64 BANCO_INTER_CERTIFICATE_KEY=$keyB64

    Write-Host "✅ SUCESSO! Certificados convertidos e enviados." -ForegroundColor Green
    
    # Limpeza
    Remove-Item inter_key_encrypted.pem -ErrorAction SilentlyContinue
} else {
    Write-Host "❌ Falha na conversão dos arquivos." -ForegroundColor Red
}
