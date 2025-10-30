import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface SendWalletModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  wallet: {
    id: string
    currency_code: string
    currency_type: string
    available_balance: number
  } | null
  onSendSuccess: () => void
}

export function SendWalletModal({ open, onOpenChange, wallet, onSendSuccess }: SendWalletModalProps) {
  const { effectiveUserId } = useAuth()
  const [amount, setAmount] = useState('')
  const [destination, setDestination] = useState('')
  const [loading, setLoading] = useState(false)

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

  const handleSend = async () => {
    if (!amount || Number(amount.replace(/\./g, '').replace(',', '.')) === 0) {
      toast.error('Por favor, insira um valor válido')
      return
    }

    if (!destination.trim()) {
      toast.error('Por favor, insira o destino')
      return
    }

    if (!effectiveUserId || !wallet) {
      toast.error('Erro ao processar envio')
      return
    }

    const amountValue = Number(amount.replace(/\./g, '').replace(',', '.'))
    
    if (amountValue > wallet.available_balance) {
      toast.error('Saldo insuficiente')
      return
    }

    setLoading(true)
    try {
      // Criar transação de saque/envio
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: effectiveUserId,
          type: 'withdrawal',
          amount: amountValue,
          status: 'pending',
          payment_method: wallet.currency_type === 'fiat' ? 'pix' : 'crypto',
          description: `Envio de ${wallet.currency_code}`,
          pix_key: wallet.currency_type === 'fiat' ? destination : null,
          crypto_address: wallet.currency_type === 'crypto' ? destination : null,
          currency_code: wallet.currency_code,
        })
        .select()
        .single()

      if (transactionError) throw transactionError

      toast.success(`Saque de ${wallet.currency_code} solicitado com sucesso!`)
      toast.info('Aguarde processamento do administrador')
      console.log('💸 Saque criado:', transaction.id, wallet.currency_code)

      setAmount('')
      setDestination('')
      onSendSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Erro ao solicitar saque:', error)
      toast.error(error.message || 'Erro ao processar saque')
    } finally {
      setLoading(false)
    }
  }

  if (!wallet) return null

  const formatBalance = (value: number) => {
    if (wallet.currency_type === 'fiat') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value)
    }
    return `${value.toFixed(8)} ${wallet.currency_code}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="text-primary" size={24} />
            Enviar {wallet.currency_code}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-accent/50 rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Saldo Disponível</p>
            <p className="text-xl font-bold text-foreground">
              {formatBalance(wallet.available_balance)}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Valor <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {wallet.currency_type === 'fiat' ? 'R$' : wallet.currency_code}
              </span>
              <Input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0,00"
                className="bg-background border-border text-foreground pl-16 text-lg"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              {wallet.currency_type === 'fiat' ? 'Chave PIX' : 'Endereço da Carteira'} <span className="text-red-400">*</span>
            </label>
            <Input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder={wallet.currency_type === 'fiat' ? 'CPF, email ou telefone' : 'Endereço da carteira'}
              className="bg-background border-border text-foreground"
            />
          </div>

          <div className="bg-accent/50 rounded-lg p-3 space-y-2">
            <p className="text-xs text-muted-foreground">
              <span className="text-foreground font-medium">⚠️ Atenção:</span>
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 ml-4">
              <li>• Verifique o destino com atenção</li>
              <li>• O saque será processado pelo administrador</li>
              <li>• Transações de cripto são irreversíveis</li>
            </ul>
          </div>

          <Button
            onClick={handleSend}
            disabled={loading || !amount || !destination}
            className="w-full bg-primary hover:bg-primary/90 text-black font-medium"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Send size={20} className="mr-2" />
                Solicitar Envio
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
