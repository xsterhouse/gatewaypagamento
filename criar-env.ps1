# Script para criar arquivo .env automaticamente
# Execute: .\criar-env.ps1

Write-Host "🚀 Configurando arquivo .env..." -ForegroundColor Cyan

# Verificar se .env já existe
if (Test-Path ".env") {
    Write-Host "⚠️  Arquivo .env já existe!" -ForegroundColor Yellow
    $resposta = Read-Host "Deseja sobrescrever? (s/n)"
    if ($resposta -ne "s") {
        Write-Host "❌ Operação cancelada." -ForegroundColor Red
        exit
    }
}

# Copiar .env.example para .env
if (Test-Path ".env.example") {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Arquivo .env criado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Arquivo .env.example não encontrado!" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "📝 Agora você precisa editar o arquivo .env e adicionar:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. VITE_SUPABASE_ANON_KEY (do Supabase)" -ForegroundColor White
Write-Host "2. VITE_MERCADO_PAGO_ACCESS_TOKEN (do Mercado Pago)" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Links úteis:" -ForegroundColor Cyan
Write-Host "   Supabase: https://supabase.com/dashboard" -ForegroundColor Gray
Write-Host "   Mercado Pago: https://www.mercadopago.com.br/developers/panel/app" -ForegroundColor Gray
Write-Host ""
Write-Host "⚡ Após editar o .env, reinicie o servidor:" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""

# Perguntar se quer abrir o arquivo
$abrir = Read-Host "Deseja abrir o arquivo .env agora? (s/n)"
if ($abrir -eq "s") {
    code .env
    Write-Host "✅ Arquivo .env aberto no VS Code!" -ForegroundColor Green
}

Write-Host ""
Write-Host "✨ Pronto! Siga o guia: CONFIGURAR_ENV_AGORA.md" -ForegroundColor Cyan
