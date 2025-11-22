$urlRegistro = "https://plbcnvnsvytzqrhgybjd.supabase.co/functions/v1/banco-inter-register-webhook"
$webhookDestino = "https://plbcnvnsvytzqrhgybjd.supabase.co/functions/v1/banco-inter-webhook"

Write-Host "Testando URL: $urlRegistro"

try {
    $body = @{ webhookUrl = $webhookDestino } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri $urlRegistro -Method Post -Body $body -ContentType "application/json"
    Write-Host "SUCESSO!" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "ERRO!" -ForegroundColor Red
    Write-Host $_.Exception.Message
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "Detalhes: " $reader.ReadToEnd() -ForegroundColor Yellow
    }
}
