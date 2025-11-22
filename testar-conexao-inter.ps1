# Script de Teste de Conexão com Banco Inter (Diagnóstico)
# Tenta obter um token OAuth usando certificados locais

Add-Type -AssemblyName System.Windows.Forms

# 1. Selecionar Certificado
$openFileDialog = New-Object System.Windows.Forms.OpenFileDialog
$openFileDialog.Title = "Selecione o arquivo do CERTIFICADO (.crt ou .pem)"
$openFileDialog.Filter = "Arquivos de Certificado|*.crt;*.pem;*.cer|Todos os arquivos|*.*"

Write-Host "1. Selecione o arquivo do CERTIFICADO..." -ForegroundColor Cyan
if ($openFileDialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { exit }
$certPath = $openFileDialog.FileName

# 2. Selecionar Chave
$openFileDialog.Title = "Selecione o arquivo da CHAVE (.key)"
$openFileDialog.Filter = "Arquivos de Chave|*.key|Todos os arquivos|*.*"

Write-Host "2. Selecione o arquivo da CHAVE PRIVADA..." -ForegroundColor Cyan
if ($openFileDialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { exit }
$keyPath = $openFileDialog.FileName

# 3. Pedir Credenciais
$clientId = Read-Host "Digite o Client ID"
$clientSecret = Read-Host "Digite o Client Secret"

Write-Host ""
Write-Host "Testando conexão..." -ForegroundColor Yellow

# Configurar TLS com Certificado Mútuo
try {
    # Tentar carregar certificado e chave. Nota: No Windows, carregar .key separado é chato.
    # Vamos tentar usar openssl se disponível, ou curl.
    
    if (Get-Command "curl" -ErrorAction SilentlyContinue) {
        Write-Host "Usando CURL para teste..." -ForegroundColor Green
        
        # Comando CURL
        $url = "https://cdpj.partners.bancointer.com.br/oauth/v2/token"
        $body = "client_id=$clientId&client_secret=$clientSecret&grant_type=client_credentials&scope=pix.read pix.write webhook.read webhook.write"
        
        # Executar CURL
        # Nota: curl no PowerShell é alias para Invoke-WebRequest. Precisamos chamar o executável curl.exe
        & curl.exe -v --cert "$certPath" --key "$keyPath" --data "$body" "$url"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n✅ SUCESSO! Conexão estabelecida." -ForegroundColor Green
        } else {
            Write-Host "`n❌ FALHA. Veja o erro acima." -ForegroundColor Red
        }
    }
    else {
        Write-Error "CURL não encontrado. Por favor instale o CURL ou Git Bash para testar."
    }
}
catch {
    Write-Error "Erro ao executar teste: $_"
}

Write-Host ""
Write-Host "Pressione qualquer tecla para sair..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
