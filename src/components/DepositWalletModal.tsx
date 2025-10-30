import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Download, Loader2, QrCode } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface DepositWalletModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  wallet: {
    id: string
    currency_code: string
    currency_type: string
  } | null
  onDepositSuccess: () => void
}

export function DepositWalletModal({ open, onOpenChange, wallet, onDepositSuccess }: DepositWalletModalProps) {
  const { effectiveUserId } = useAuth()
  const [amount, setAmount] = useState('')
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

  const handleDeposit = async () => {
    if (!amount || Number(amount.replace(/\./g, '').replace(',', '.')) === 0) {
      toast.error('Por favor, insira um valor válido')
      return
    }

    if (!effectiveUserId || !wallet) {
      toast.error('Erro ao processar depósito')
      return
    }

    setLoading(true)
    try {
      const amountValue = Number(amount.replace(/\./g, '').replace(',', '.'))

      // Criar registro de depósito
      const { data: deposit, error: depositError } = await supabase
        .from('deposits')
        .insert({
          user_id: effectiveUserId,
          amount: amountValue,
          method: wallet.currency_type === 'fiat' ? 'pix' : 'crypto',
          status: 'pending',
          currency_code: wallet.currency_code,
          description: `Depósito em ${wallet.currency_code}`,
        })
        .select()
        .single()

      if (depositError) throw depositError

      toast.success(`Depósito de ${wallet.currency_code} solicitado com sucesso!`)
      toast.info('Aguarde aprovação do administrador')
      console.log('💰 Depósito criado:', deposit.id, wallet.currency_code)

      setAmount('')
      onDepositSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Erro ao solicitar depósito:', error)
      toast.error(error.message || 'Erro ao processar depósito')
    } finally {
      setLoading(false)
    }
  }

  if (!wallet) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="text-primary" size={24} />
            Depositar {wallet.currency_code}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-accent/50 rounded-lg p-4 text-center">
            <div className="text-4xl mb-2">
              {wallet.currency_type === 'fiat' ? '💵' : '₿'}
            </div>
            <p className="text-sm text-muted-foreground">
              {wallet.currency_type === 'fiat' ? 'Depósito via PIX' : 'Depósito de Criptomoeda'}
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

          <div className="bg-accent/50 rounded-lg p-3 space-y-2">
            <p className="text-xs text-muted-foreground">
              <span className="text-foreground font-medium">⚠️ Importante:</span>
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 ml-4">
              <li>• O depósito será criado com status pendente</li>
              <li>• Aguarde aprovação do administrador</li>
              <li>• O saldo será creditado após aprovação</li>
            </ul>
          </div>

          <Button
            onClick={handleDeposit}
            disabled={loading || !amount}
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
                {wallet.currency_type === 'fiat' ? (
                  <QrCode size={20} className="mr-2" />
                ) : (
                  <Download size={20} className="mr-2" />
                )}
                Solicitar Depósito
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
