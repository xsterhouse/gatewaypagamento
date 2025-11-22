# Script Simplificado para Converter PFX
# Requer OpenSSL instalado

Add-Type -AssemblyName System.Windows.Forms

Write-Host "=== Gerador de PFX para Banco Inter ===" -ForegroundColor Cyan
Write-Host ""

$openFileDialog = New-Object System.Windows.Forms.OpenFileDialog

# 1. Certificado
$openFileDialog.Title = "Selecione o CERTIFICADO (.crt)"
$openFileDialog.Filter = "Certificado|*.crt;*.pem|Todos|*.*"
Write-Host "1. Selecione o arquivo .crt..."
if ($openFileDialog.ShowDialog() -ne 'OK') { exit }
$certPath = $openFileDialog.FileName

# 2. Chave
$openFileDialog.Title = "Selecione a CHAVE (.key)"
$openFileDialog.Filter = "Chave|*.key|Todos|*.*"
Write-Host "2. Selecione o arquivo .key..."
if ($openFileDialog.ShowDialog() -ne 'OK') { exit }
$keyPath = $openFileDialog.FileName

# 3. Senha
$senha = Read-Host "3. Crie uma senha para o arquivo PFX (ex: 1234)"
if ($senha.Length -lt 4) {
    Write-Host "Senha muito curta!" -ForegroundColor Red
    exit
}

$output = "Inter_Certificado.pfx"

# 4. Executar OpenSSL
# Tenta encontrar openssl no path padrão ou em locais comuns
$openssl = "openssl"
if (Test-Path "C:\Program Files\OpenSSL-Win64\bin\openssl.exe") {
    $openssl = "C:\Program Files\OpenSSL-Win64\bin\openssl.exe"
}

try {
    Write-Host "Gerando arquivo..."
    & $openssl pkcs12 -export -out $output -inkey "$keyPath" -in "$certPath" -passout pass:$senha
    
    if (Test-Path $output) {
        Write-Host ""
        Write-Host "✅ SUCESSO! Arquivo criado: $output" -ForegroundColor Green
        Write-Host "Senha: $senha" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "AGORA:" -ForegroundColor Cyan
        Write-Host "1. Rode no terminal: [Convert]::ToBase64String([IO.File]::ReadAllBytes('Inter_Certificado.pfx')) | Set-Clipboard"
        Write-Host "2. Cole no Supabase Secret: BANCO_INTER_CERTIFICATE_PFX"
        Write-Host "3. Salve a senha no Secret: BANCO_INTER_CERTIFICATE_PASSWORD"
        
        Invoke-Item .
    } else {
        Write-Host "Erro: Arquivo não foi criado." -ForegroundColor Red
    }
} catch {
    Write-Host "Erro ao executar OpenSSL: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Pressione Enter para sair..."
Read-Host
