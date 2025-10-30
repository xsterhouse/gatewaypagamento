import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Wallet, User, Calendar, DollarSign, Lock, Unlock } from 'lucide-react'

interface ViewWalletModalProps {
  isOpen: boolean
  onClose: () => void
  wallet: {
    id: string
    user_id: string
    currency_code: string
    currency_type: string
    wallet_name: string
    balance: number
    available_balance: number
    blocked_balance: number
    is_active: boolean
    user_name: string
    user_email: string
    created_at: string
  } | null
}

export function ViewWalletModal({ isOpen, onClose, wallet }: ViewWalletModalProps) {
  if (!wallet) return null

  const formatCurrency = (value: number, currencyCode: string) => {
    if (currencyCode === 'BRL') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value)
    }
    return `${value.toFixed(8)} ${currencyCode}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="text-primary" size={24} />
            Detalhes da Carteira
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status da Carteira */}
          <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">
            <div className="flex items-center gap-2">
              {wallet.is_active ? (
                <>
                  <Unlock className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-green-500">Carteira Ativa</span>
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5 text-red-500" />
                  <span className="font-medium text-red-500">Carteira Bloqueada</span>
                </>
              )}
            </div>
            <div className="text-3xl">
              {wallet.currency_type === 'fiat' ? '💵' : '₿'}
            </div>
          </div>

          {/* Informações da Carteira */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Nome da Carteira</label>
              <p className="font-semibold">{wallet.wallet_name || 'Sem nome'}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Moeda</label>
              <p className="font-semibold">{wallet.currency_code}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Tipo</label>
              <p className="font-semibold">
                {wallet.currency_type === 'fiat' ? 'Moeda Fiat' : 'Criptomoeda'}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">ID da Carteira</label>
              <p className="font-mono text-xs">{wallet.id.slice(0, 16)}...</p>
            </div>
          </div>

          {/* Saldos */}
          <div className="border-t border-border pt-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Saldos
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-accent/30 rounded-lg">
                <label className="text-sm text-muted-foreground block mb-1">Saldo Total</label>
                <p className="text-xl font-bold">
                  {formatCurrency(wallet.balance, wallet.currency_code)}
                </p>
              </div>

              <div className="p-4 bg-green-500/10 rounded-lg">
                <label className="text-sm text-muted-foreground block mb-1">Disponível</label>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(wallet.available_balance, wallet.currency_code)}
                </p>
              </div>

              <div className="p-4 bg-red-500/10 rounded-lg">
                <label className="text-sm text-muted-foreground block mb-1">Bloqueado</label>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(wallet.blocked_balance, wallet.currency_code)}
                </p>
              </div>
            </div>
          </div>

          {/* Informações do Usuário */}
          <div className="border-t border-border pt-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <User className="h-4 w-4" />
              Proprietário
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Nome</label>
                <p className="font-semibold">{wallet.user_name}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Email</label>
                <p className="font-semibold">{wallet.user_email}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">ID do Usuário</label>
                <p className="font-mono text-xs">{wallet.user_id.slice(0, 16)}...</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Criada em
                </label>
                <p className="text-sm">{formatDate(wallet.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Botão Fechar */}
          <div className="flex justify-end pt-4">
            <Button onClick={onClose} variant="outline">
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
