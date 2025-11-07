# Script para configurar o arquivo .env corretamente

$envContent = @"
VITE_SUPABASE_URL=https://plbcnvnsvytzqrhgybjd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYmNudm5zdnl0enFyaGd5YmpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1Nzg0OTEsImV4cCI6MjA3NzE1NDQ5MX0.gO6IR7J4GQ3-H-krweofIovj4rQyj_3XNPPsEpCy1jU
VITE_RESEND_API_KEY=re_HHGH2ofv_2ViU9tYRAgbDsz7UkGVBfiht
"@

# Salvar no arquivo .env
$envContent | Out-File -FilePath ".env" -Encoding UTF8 -NoNewline

Write-Host "✅ Arquivo .env configurado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "Conteúdo do .env:" -ForegroundColor Cyan
Get-Content .env
Write-Host ""
Write-Host "🔄 AGORA REINICIE O SERVIDOR:" -ForegroundColor Yellow
Write-Host "   1. Pressione Ctrl + C no terminal do servidor"
Write-Host "   2. Execute: npm run dev"
Write-Host ""
