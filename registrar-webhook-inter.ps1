# Script para registrar Webhook do Banco Inter
# Lê as configurações do arquivo .env e chama a função de registro

$envFile = "c:\Users\XSTER\gatewaypagamento\.env"

if (-not (Test-Path $envFile)) {
    Write-Error "Arquivo .env não encontrado em $envFile"
    exit 1
}

# Ler variáveis do .env
$env = @{}
Get-Content $envFile | ForEach-Object {
    if ($_ -match "^([^#=]+)=(.*)") {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        $env[$key] = $value
    }
}

$supabaseUrl = $env["VITE_SUPABASE_URL"]
$anonKey = $env["VITE_SUPABASE_ANON_KEY"]

if (-not $supabaseUrl -or -not $anonKey) {
    Write-Error "VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontrados no .env"
    exit 1
}

$registerUrl = "$supabaseUrl/functions/v1/banco-inter-register-webhook"
$targetWebhookUrl = "$supabaseUrl/functions/v1/banco-inter-webhook"

Write-Host "============================================"
Write-Host "Registrando Webhook do Banco Inter"
Write-Host "============================================"
Write-Host "URL de Registro: $registerUrl"
Write-Host "URL do Webhook (Destino): $targetWebhookUrl"
Write-Host ""

$body = @{
    webhookUrl = $targetWebhookUrl
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $registerUrl -Method Post -Headers @{
        "Authorization" = "Bearer $anonKey"
        "Content-Type" = "application/json"
    } -Body $body -ErrorAction Stop

    Write-Host "✅ SUCESSO!" -ForegroundColor Green
    Write-Host "Resposta: "
    Write-Host ($response | ConvertTo-Json -Depth 5)
}
catch {
    Write-Host "❌ ERRO AO REGISTRAR WEBHOOK" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)"
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Detalhes: $responseBody" -ForegroundColor Yellow
    }
}

Write-Host ""
# Removida pausa para execução automática

