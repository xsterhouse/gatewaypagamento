# Script para consultar configuração do Banco Inter via API (REST)
# Usa a anon_key para fazer uma query na tabela bank_acquirers via PostgREST

$envFile = "c:\Users\XSTER\gatewaypagamento\.env"
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

$url = "$supabaseUrl/rest/v1/bank_acquirers?bank_code=eq.077&select=name,client_id,environment,api_auth_url,pix_key,is_active,api_pix_url"

try {
    $response = Invoke-RestMethod -Uri $url -Method Get -Headers @{
        "apikey" = $anonKey
        "Authorization" = "Bearer $anonKey"
    }
    
    Write-Host "Configuração encontrada:" -ForegroundColor Green
    $response | Format-List
} catch {
    Write-Host "Erro ao consultar: $_" -ForegroundColor Red
}
