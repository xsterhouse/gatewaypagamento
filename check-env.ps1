# Verificar configuracao do .env
Write-Host "Verificando .env..." -ForegroundColor Cyan

if (-not (Test-Path ".env")) {
    Write-Host "ERRO: Arquivo .env nao encontrado!" -ForegroundColor Red
    exit
}

Write-Host "OK: Arquivo .env encontrado" -ForegroundColor Green
Write-Host ""

$env = Get-Content ".env"

Write-Host "Variaveis configuradas:" -ForegroundColor Cyan
Write-Host ""

foreach ($line in $env) {
    if ($line -match "^VITE_MERCADO_PAGO_ACCESS_TOKEN=(.+)") {
        $token = $matches[1].Trim()
        $tamanho = $token.Length
        $preview = $token.Substring(0, [Math]::Min(20, $tamanho))
        
        Write-Host "VITE_MERCADO_PAGO_ACCESS_TOKEN:" -ForegroundColor Yellow
        Write-Host "  Valor: $preview..." -ForegroundColor White
        Write-Host "  Tamanho: $tamanho caracteres" -ForegroundColor White
        
        if ($token -match "^APP_USR-") {
            Write-Host "  Formato: OK - PRODUCAO" -ForegroundColor Green
        } elseif ($token -match "^TEST-") {
            Write-Host "  Formato: TESTE - nao funciona para PIX real!" -ForegroundColor Red
        } elseif ($token -match "your_|here") {
            Write-Host "  Formato: PLACEHOLDER - configure o token real!" -ForegroundColor Red
        } else {
            Write-Host "  Formato: INVALIDO" -ForegroundColor Red
        }
    }
    
    if ($line -match "^VITE_SUPABASE_") {
        Write-Host $line -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "IMPORTANTE: Reinicie o servidor apos editar .env!" -ForegroundColor Yellow
Write-Host "  1. Ctrl+C para parar" -ForegroundColor White
Write-Host "  2. npm run dev para iniciar" -ForegroundColor White
