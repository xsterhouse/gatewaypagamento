# Script para converter arquivos de certificado para Base64
# Isso vai facilitar para você copiar e colar no Supabase

Add-Type -AssemblyName System.Windows.Forms

$openFileDialog = New-Object System.Windows.Forms.OpenFileDialog
$openFileDialog.Title = "Selecione o arquivo do CERTIFICADO (.crt ou .pem)"
$openFileDialog.Filter = "Arquivos de Certificado|*.crt;*.pem;*.cer|Todos os arquivos|*.*"

Write-Host "1. Selecione o arquivo do CERTIFICADO na janela que abrir..." -ForegroundColor Cyan
if ($openFileDialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
    $certPath = $openFileDialog.FileName
    try {
        $base64Cert = [Convert]::ToBase64String([IO.File]::ReadAllBytes($certPath))
        
        # Salvar em arquivo temporário para o usuário abrir e copiar
        $outFile = "CERTIFICADO_BASE64.txt"
        $base64Cert | Out-File $outFile -Encoding ascii
        
        Write-Host "✅ Certificado convertido com sucesso!" -ForegroundColor Green
        Write-Host "Conteúdo salvo em: $outFile"
        Invoke-Item $outFile
    }
    catch {
        Write-Host "❌ Erro ao ler certificado: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "---------------------------------------------------"
Write-Host ""

$openFileDialog.Title = "Selecione o arquivo da CHAVE (.key)"
$openFileDialog.Filter = "Arquivos de Chave|*.key|Todos os arquivos|*.*"

Write-Host "2. Selecione o arquivo da CHAVE PRIVADA na janela que abrir..." -ForegroundColor Cyan
if ($openFileDialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
    $keyPath = $openFileDialog.FileName
    try {
        $base64Key = [Convert]::ToBase64String([IO.File]::ReadAllBytes($keyPath))
        
        # Salvar em arquivo temporário
        $outFileKey = "CHAVE_BASE64.txt"
        $base64Key | Out-File $outFileKey -Encoding ascii
        
        Write-Host "✅ Chave convertida com sucesso!" -ForegroundColor Green
        Write-Host "Conteúdo salvo em: $outFileKey"
        Invoke-Item $outFileKey
    }
    catch {
        Write-Host "❌ Erro ao ler chave: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "AGORA SIGA ESTES PASSOS:" -ForegroundColor Yellow
Write-Host "1. Copie todo o conteúdo do arquivo CERTIFICADO_BASE64.txt"
Write-Host "2. Cole no Secret 'BANCO_INTER_CERTIFICATE' no Supabase"
Write-Host "3. Copie todo o conteúdo do arquivo CHAVE_BASE64.txt"
Write-Host "4. Cole no Secret 'BANCO_INTER_CERTIFICATE_KEY' no Supabase"
