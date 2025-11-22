# Script para Gerar Certificado em Base64 para Banco Inter
# COMPATÍVEL COM WINDOWS POWERSHELL 5.1

Write-Host "🔐 Gerador de Certificado Banco Inter" -ForegroundColor Cyan
Write-Host "======================================="

# Caminhos dos arquivos
$pfxPath = ".\certificado.pfx"
$certPath = ".\Inter API_Certificado"     
$certCrtPath = ".\Inter API_Certificado.crt" 
$keyPath = ".\Inter API_Chave.key"        

# Verificar PFX
if (Test-Path $pfxPath) {
    Write-Host "⚠️  Arquivo .pfx detectado." -ForegroundColor Yellow
    exit
}

# Verificar qual arquivo de certificado existe
$certFile = $null
if (Test-Path $certPath) {
    $certFile = $certPath
}
elseif (Test-Path $certCrtPath) {
    $certFile = $certCrtPath
}

# Verificar arquivo de chave
$keyFile = $null
if (Test-Path $keyPath) {
    $keyFile = $keyPath
}

if ($certFile -ne $null -and $keyFile -ne $null) {
    Write-Host "✅ Arquivos encontrados:" -ForegroundColor Green
    Write-Host "   Cert: $certFile"
    Write-Host "   Key:  $keyFile"
    Write-Host ""

    # Ler bytes e converter para Base64
    $certBytes = [System.IO.File]::ReadAllBytes($certFile)
    $certBase64 = [Convert]::ToBase64String($certBytes)

    $keyBytes = [System.IO.File]::ReadAllBytes($keyFile)
    $keyBase64 = [Convert]::ToBase64String($keyBytes)

    Write-Host "📋 COPIE E COLE OS COMANDOS ABAIXO NO SEU TERMINAL:" -ForegroundColor Cyan
    Write-Host "---------------------------------------------------" -ForegroundColor Gray
    
    # Usando aspas simples para evitar confusão
    Write-Host "supabase secrets set BANCO_INTER_CERTIFICATE='$certBase64'"
    Write-Host ""
    Write-Host "supabase secrets set BANCO_INTER_CERTIFICATE_KEY='$keyBase64'"
    Write-Host ""
    Write-Host "supabase secrets set BANCO_INTER_ACCOUNT_NUMBER='12345678'"
    
    Write-Host "---------------------------------------------------" -ForegroundColor Gray
    Write-Host "⚠️  IMPORTANTE: Substitua '12345678' pelo número da sua conta!" -ForegroundColor Yellow
    
    # Salvar em arquivo txt
    $conteudoArquivo = "BANCO_INTER_CERTIFICATE='$certBase64'" + [Environment]::NewLine + "BANCO_INTER_CERTIFICATE_KEY='$keyBase64'"
    [System.IO.File]::WriteAllText("credenciais-base64.txt", $conteudoArquivo)
    
    Write-Host ""
    Write-Host "✅ Salvo também em 'credenciais-base64.txt'" -ForegroundColor Green
}
else {
    Write-Host "❌ Arquivos não encontrados." -ForegroundColor Red
    Write-Host "Verificou:"
    Write-Host " - $certPath (ou .crt)"
    Write-Host " - $keyPath"
}
