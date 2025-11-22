import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Webhook, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export function AdminInterSetup() {
  const [webhookUrl, setWebhookUrl] = useState('https://plbcnvnsvytzqrhgybjd.supabase.co/functions/v1/banco-inter-webhook')
  const [pixKey, setPixKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleRegister = async () => {
    if (!webhookUrl || !pixKey) {
      toast.error('Preencha a URL do Webhook e a Chave PIX')
      return
    }

    setLoading(true)
    setResult(null)
    try {
      const response = await fetch('/api/register-inter-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ webhookUrl, pixKey }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Erro desconhecido')
      }

      setResult({ success: true, message: 'Webhook registrado com sucesso no Banco Inter!' })
      toast.success('Webhook registrado com sucesso!')
    } catch (error: any) {
      setResult({ success: false, message: error.message })
      toast.error(`Erro ao registrar: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configuração Banco Inter</h1>
        <p className="text-muted-foreground mt-1">Registre seu webhook para receber notificações de PIX.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="text-primary" />
            Registrar Webhook PIX
          </CardTitle>
          <CardDescription>
            Esta ação registrará a URL do seu sistema no Banco Inter para receber notificações de pagamentos PIX.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pixKey">Sua Chave PIX (CNPJ/CPF/etc.)</Label>
            <Input
              id="pixKey"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="Digite a chave PIX da sua conta Inter"
            />
            <p className="text-xs text-muted-foreground">
              Esta é a chave PIX principal da conta que receberá os pagamentos.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhookUrl">URL do Webhook</Label>
            <Input
              id="webhookUrl"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="URL da sua função de webhook"
            />
            <p className="text-xs text-muted-foreground">
              Esta é a URL da sua Edge Function no Supabase que processará as notificações.
            </p>
          </div>

          <Button onClick={handleRegister} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              'Registrar Webhook'
            )}
          </Button>

          {result && (
            <div className={`mt-4 p-4 rounded-lg border ${result.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="text-green-500 mt-0.5" />
                ) : (
                  <AlertCircle className="text-red-500 mt-0.5" />
                )}
                <div>
                  <h4 className={`font-semibold ${result.success ? 'text-green-500' : 'text-red-500'}`}>
                    {result.success ? 'Sucesso!' : 'Falha no Registro'}
                  </h4>
                  <p className="text-sm text-muted-foreground">{result.message}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}