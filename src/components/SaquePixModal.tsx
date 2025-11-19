import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Send, Loader2, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface SaquePixModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface WalletInfo {
  id: string
  balance: number
  available_balance: number
}

export function SaquePixModal({ open, onOpenChange, onSuccess }: SaquePixModalProps) {
  const { effectiveUserId } = useAuth()
  const [amount, setAmount] = useState('')
  const [pixKey, setPixKey] = useState('')
  const [pixKeyType, setPixKeyType] = useState<'CPF' | 'EMAIL' | 'PHONE' | 'EVP'>('CPF')
  const [loading, setLoading] = useState(false)
  const [wallet, setWallet] = useState<WalletInfo | null>(null)
  const [loadingWallet, setLoadingWallet] = useState(true)

  const TAXA_MINIMA = 1.70 // Taxa mínima que deve permanecer na conta
  const VALOR_MINIMO_SAQUE = 1.00 // Valor mínimo para saque

  useEffect(() => {
    if (open && effectiveUserId) {
      loadWallet()
    }
  }, [open, effectiveUserId])

  const loadWallet = async () => {
    try {
      setLoadingWallet(true)
      const { data, error } = await supabase
        .from('wallets')
        .select('id, balance, available_balance')
        .eq('user_id', effectiveUserId)
        .eq('currency_code', 'BRL')
        .eq('is_active', true)
        .single()

      if (error) throw error
      setWallet(data)
    } catch (error) {
      console.error('Erro ao carregar carteira:', error)
      toast.error('Erro ao carregar saldo')
    } finally {
      setLoadingWallet(false)
    }
  }

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    const amount = Number(numbers) / 100
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value)
    setAmount(formatted)
  }

  const detectPixKeyType = (key: string): 'CPF' | 'EMAIL' | 'PHONE' | 'EVP' => {
    // Remove espaços e caracteres especiais para validação
    const cleanKey = key.replace(/\s/g, '')
    
    // CPF: 11 dígitos
    if (/^\d{11}$/.test(cleanKey.replace(/\D/g, ''))) {
      return 'CPF'
    }
    
    // Email
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanKey)) {
      return 'EMAIL'
    }
    
    // Telefone: +55 ou 55 seguido de 10-11 dígitos
    if (/^(\+?55)?[1-9]\d{9,10}$/.test(cleanKey.replace(/\D/g, ''))) {
      return 'PHONE'
    }
    
    // EVP (chave aleatória): UUID format
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanKey)) {
      return 'EVP'
    }
    
    return 'CPF' // Default
  }

  const handlePixKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPixKey(value)
    
    if (value.length > 3) {
      const detectedType = detectPixKeyType(value)
      setPixKeyType(detectedType)
    }
  }

  const validatePixKey = (key: string, type: string): boolean => {
    const cleanKey = key.replace(/\s/g, '')
    
    switch (type) {
      case 'CPF':
        const cpf = cleanKey.replace(/\D/g, '')
        return cpf.length === 11
      case 'EMAIL':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanKey)
      case 'PHONE':
        const phone = cleanKey.replace(/\D/g, '')
        return phone.length >= 10 && phone.length <= 13
      case 'EVP':
        return cleanKey.length >= 32
      default:
        return false
    }
  }

  const handleSend = async () => {
    if (!wallet || !effectiveUserId) {
      toast.error('Erro ao processar saque')
      return
    }

    // Validações
    const amountValue = Number(amount.replace(/\./g, '').replace(',', '.'))
    
    if (!amountValue || amountValue < VALOR_MINIMO_SAQUE) {
      toast.error(`Valor mínimo para saque é R$ ${VALOR_MINIMO_SAQUE.toFixed(2)}`)
      return
    }

    if (!pixKey.trim()) {
      toast.error('Por favor, insira a chave PIX')
      return
    }

    if (!validatePixKey(pixKey, pixKeyType)) {
      toast.error('Chave PIX inválida')
      return
    }

    // Validar saldo disponível considerando a taxa mínima
    const saldoDisponivel = wallet.available_balance - TAXA_MINIMA
    
    if (saldoDisponivel < VALOR_MINIMO_SAQUE) {
      toast.error(`Você precisa manter R$ ${TAXA_MINIMA.toFixed(2)} na conta. Saldo disponível para saque: R$ ${Math.max(0, saldoDisponivel).toFixed(2)}`)
      return
    }

    if (amountValue > saldoDisponivel) {
      toast.error(`Saldo insuficiente. Disponível para saque: R$ ${saldoDisponivel.toFixed(2)}`)
      return
    }

    setLoading(true)
    try {
      // Chamar Edge Function para processar saque via Mercado Pago
      const { data, error } = await supabase.functions.invoke('mercadopago-send-pix', {
        body: {
          user_id: effectiveUserId,
          amount: amountValue,
          pix_key: pixKey.trim(),
          pix_key_type: pixKeyType
        }
      })

      if (error) {
        console.error('Erro na chamada da função:', error)
        throw error
      }

      console.log('Resposta da função:', data)

      if (data?.error) {
        console.error('Erro retornado pela função:', data)
        throw new Error(data.error + (data.details ? ` - ${data.details}` : ''))
      }

      toast.success('Saque PIX solicitado com sucesso!')
      toast.info('Processando pagamento via Mercado Pago...')
      
      setAmount('')
      setPixKey('')
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Erro ao processar saque:', error)
      const errorMessage = error.message || error.toString() || 'Erro ao processar saque'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const formatBalance = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const saldoDisponivel = wallet ? wallet.available_balance - TAXA_MINIMA : 0
  const amountValue = Number(amount.replace(/\./g, '').replace(',', '.')) || 0
  const saldoAposSaque = wallet ? wallet.available_balance - amountValue : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Send className="text-primary" size={24} />
            Solicitar Saque PIX
          </DialogTitle>
        </DialogHeader>

        {loadingWallet ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Informações de Saldo */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Saldo Total</p>
                <p className="text-lg font-bold text-blue-500">
                  {formatBalance(wallet?.available_balance || 0)}
                </p>
              </div>
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Disponível para Saque</p>
                <p className="text-lg font-bold text-green-500">
                  {formatBalance(Math.max(0, saldoDisponivel))}
                </p>
              </div>
            </div>

            {/* Alerta Taxa Mínima */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-2">
              <Info className="text-yellow-500 flex-shrink-0 mt-0.5" size={16} />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-yellow-600 dark:text-yellow-400 mb-1">Taxa Mínima de Transferência</p>
                <p>Você deve manter <strong>R$ {TAXA_MINIMA.toFixed(2)}</strong> na conta para cobrir taxas de transferência.</p>
              </div>
            </div>

            {/* Valor do Saque */}
            <div>
              <Label htmlFor="amount" className="text-sm font-medium mb-2 block">
                Valor do Saque <span className="text-red-400">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  R$
                </span>
                <Input
                  id="amount"
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0,00"
                  className="pl-12 text-lg font-medium"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Mínimo: R$ {VALOR_MINIMO_SAQUE.toFixed(2)} • Máximo: {formatBalance(Math.max(0, saldoDisponivel))}
              </p>
            </div>

            {/* Chave PIX */}
            <div>
              <Label htmlFor="pixKey" className="text-sm font-medium mb-2 block">
                Chave PIX de Destino <span className="text-red-400">*</span>
              </Label>
              <Input
                id="pixKey"
                type="text"
                value={pixKey}
                onChange={handlePixKeyChange}
                placeholder="CPF, email, telefone ou chave aleatória"
                className="font-mono"
              />
              {pixKey && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    Tipo detectado: {pixKeyType}
                  </div>
                  {validatePixKey(pixKey, pixKeyType) ? (
                    <div className="flex items-center gap-1 text-xs text-green-500">
                      <CheckCircle size={14} />
                      Válida
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle size={14} />
                      Inválida
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Preview do Saque */}
            {amountValue > 0 && (
              <div className="bg-accent/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-foreground">Resumo do Saque</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor solicitado:</span>
                    <span className="font-medium">{formatBalance(amountValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Saldo após saque:</span>
                    <span className={`font-medium ${saldoAposSaque < TAXA_MINIMA ? 'text-red-500' : 'text-green-500'}`}>
                      {formatBalance(saldoAposSaque)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="text-muted-foreground">Taxa reservada:</span>
                    <span className="font-medium text-yellow-500">{formatBalance(TAXA_MINIMA)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Avisos */}
            <div className="bg-accent/50 rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-foreground flex items-center gap-1">
                <AlertCircle size={14} className="text-yellow-500" />
                Importante:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 ml-5">
                <li>• Verifique a chave PIX com atenção</li>
                <li>• O pagamento será processado via Mercado Pago</li>
                <li>• A transferência é instantânea após aprovação</li>
                <li>• Transações PIX são irreversíveis</li>
              </ul>
            </div>

            {/* Botão de Envio */}
            <Button
              onClick={handleSend}
              disabled={
                loading || 
                !amount || 
                !pixKey || 
                amountValue < VALOR_MINIMO_SAQUE ||
                amountValue > saldoDisponivel ||
                !validatePixKey(pixKey, pixKeyType) ||
                saldoAposSaque < TAXA_MINIMA
              }
              className="w-full bg-primary hover:bg-primary/90 text-black font-medium"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processando Saque...
                </>
              ) : (
                <>
                  <Send size={20} className="mr-2" />
                  Enviar PIX Agora
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
