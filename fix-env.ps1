# Script para corrigir codificação do arquivo .env
$envFile = ".\.env"

if (Test-Path $envFile) {
    # Ler o conteúdo original
    $content = Get-Content $envFile -Raw

    # Salvar novamente forçando UTF8 sem BOM
    [System.IO.File]::WriteAllText($envFile, $content)
    
    Write-Host "✅ Arquivo .env corrigido com sucesso (UTF-8 No BOM)!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Arquivo .env não encontrado. Criando um novo vazio..." -ForegroundColor Yellow
    New-Item -Path $envFile -ItemType File
}
