import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

interface DeleteWalletModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  wallet: {
    id: string
    currency_code: string
    balance: number
  } | null
  onDeleteSuccess: () => void
}

export function DeleteWalletModal({ open, onOpenChange, wallet, onDeleteSuccess }: DeleteWalletModalProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!wallet) return

    // Verificar se tem saldo
    if (wallet.balance > 0) {
      toast.error('Não é possível excluir carteira com saldo. Faça um saque primeiro.')
      return
    }

    setLoading(true)
    try {
      // Soft delete - apenas marca como inativa
      const { error } = await supabase
        .from('wallets')
        .update({ is_active: false })
        .eq('id', wallet.id)

      if (error) throw error

      toast.success(`Carteira ${wallet.currency_code} excluída com sucesso!`)
      console.log('🗑️ Carteira desativada:', wallet.id, wallet.currency_code)

      onDeleteSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Erro ao excluir carteira:', error)
      toast.error(error.message || 'Erro ao excluir carteira')
    } finally {
      setLoading(false)
    }
  }

  if (!wallet) return null

  const canDelete = wallet.balance === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle size={24} />
            Excluir Carteira
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-foreground font-medium mb-2">
                  Tem certeza que deseja excluir esta carteira?
                </p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Moeda:</strong> {wallet.currency_code}</p>
                  <p><strong>Saldo:</strong> {wallet.balance.toFixed(8)}</p>
                </div>
              </div>
            </div>
          </div>

          {!canDelete && (
            <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-3">
              <p className="text-sm text-foreground">
                <strong>⚠️ Atenção:</strong> Esta carteira possui saldo. 
                Você precisa fazer um saque antes de excluí-la.
              </p>
            </div>
          )}

          {canDelete && (
            <div className="bg-accent/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                <strong>Nota:</strong> A carteira será desativada permanentemente. 
                Você poderá criar uma nova carteira desta moeda depois se desejar.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              disabled={loading || !canDelete}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 size={18} className="mr-2" />
                  Excluir Carteira
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
