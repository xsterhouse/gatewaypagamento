# --------------------------------------
# registrar-webhook-final.ps1
# Script para registrar webhook no Banco Inter via Supabase (COM AUTENTICAÇÃO)
# --------------------------------------

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Registrando Webhook do Banco Inter" -ForegroundColor Cyan
Write-Host "============================================`n"

# URLs
$urlRegistro = "https://plbcnvnsvytzqrhgybjd.supabase.co/functions/v1/banco-inter-register-webhook"
$urlWebhookDestino = "https://plbcnvnsvytzqrhgybjd.supabase.co/functions/v1/banco-inter-webhook"

# -----------------------------------------------------------
# IMPORTANTE: Cole sua SUPABASE_ANON_KEY aqui abaixo
# Você encontra ela em: Settings > API > Project API keys > anon public
# -----------------------------------------------------------
$supabaseKey = "SUA_CHAVE_ANON_AQUI" 

# Se a chave não estiver configurada, tenta ler de variável de ambiente ou pede input
if ($supabaseKey -eq "SUA_CHAVE_ANON_AQUI") {
    Write-Host "⚠️ Chave do Supabase não configurada no script." -ForegroundColor Yellow
    $supabaseKey = Read-Host "Por favor, cole sua SUPABASE_ANON_KEY (public)"
}

$headers = @{
    "Authorization" = "Bearer $supabaseKey"
    "Content-Type" = "application/json"
}

$body = @{
    webhookUrl = $urlWebhookDestino
} | ConvertTo-Json

try {
    Write-Host "`n⏳ Enviando requisição..." -ForegroundColor Gray
    
    $response = Invoke-RestMethod -Uri $urlRegistro -Method Post -Body $body -Headers $headers -ErrorAction Stop

    Write-Host ""
    Write-Host "✅ SUCESSO!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 5) -ForegroundColor Green

} catch {
    Write-Host ""
    Write-Host "❌ ERRO AO REGISTRAR WEBHOOK" -ForegroundColor Red
    Write-Host "Erro HTTP: $($_.Exception.Message)" -ForegroundColor Red
    
    try {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $errorBody = $reader.ReadToEnd()
        
        Write-Host ""
        Write-Host "--- Detalhes do Erro (JSON) ---" -ForegroundColor Yellow
        Write-Host $errorBody -ForegroundColor Yellow
        Write-Host "-------------------------------"
    } catch {
        Write-Host "Não foi possível ler os detalhes do erro."
    }
}

Write-Host ""
Write-Host "Pressione Enter para sair..."
$null = Read-Host
