import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trash2, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface PixTransaction {
  id: string
  user_id: string
  amount: number
  pix_key: string
  pix_key_type: string
  description: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  created_at: string
  updated_at: string
  e2e_id?: string
  transaction_id?: string
  user?: {
    name: string
    email: string
  }
}

interface PixPendingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefresh?: () => void
}

export function PixPendingModal({ open, onOpenChange, onRefresh }: PixPendingModalProps) {
  const [pixTransactions, setPixTransactions] = useState<PixTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const loadPixPending = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('pix_transactions')
        .select(`
          *,
          user:users(name, email)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao carregar PIX pendentes:', error)
        toast.error('Erro ao carregar PIX pendentes')
        return
      }

      setPixTransactions(data || [])
    } catch (error) {
      console.error('Erro ao carregar PIX pendentes:', error)
      toast.error('Erro ao carregar PIX pendentes')
    } finally {
      setLoading(false)
    }
  }

  const deletePixTransaction = async (id: string) => {
    try {
      setDeleting(id)
      
      const { error } = await supabase
        .from('pix_transactions')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao deletar PIX:', error)
        toast.error('Erro ao deletar transação PIX')
        return
      }

      toast.success('Transação PIX deletada com sucesso')
      await loadPixPending()
      onRefresh?.()
    } catch (error) {
      console.error('Erro ao deletar PIX:', error)
      toast.error('Erro ao deletar transação PIX')
    } finally {
      setDeleting(null)
    }
  }

  const deleteAllPending = async () => {
    if (!confirm('Tem certeza que deseja deletar todas as transações PIX pendentes?')) {
      return
    }

    try {
      setDeleting('all')
      
      const { error } = await supabase
        .from('pix_transactions')
        .delete()
        .eq('status', 'pending')

      if (error) {
        console.error('Erro ao deletar todos os PIX pendentes:', error)
        toast.error('Erro ao deletar transações pendentes')
        return
      }

      toast.success('Todas as transações PIX pendentes foram deletadas')
      await loadPixPending()
      onRefresh?.()
    } catch (error) {
      console.error('Erro ao deletar todos os PIX pendentes:', error)
      toast.error('Erro ao deletar transações pendentes')
    } finally {
      setDeleting(null)
    }
  }

  useEffect(() => {
    if (open) {
      loadPixPending()
    }
  }, [open])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-orange-500" size={16} />
      case 'completed':
        return <CheckCircle className="text-green-500" size={16} />
      case 'failed':
        return <AlertCircle className="text-red-500" size={16} />
      default:
        return <Clock className="text-gray-500" size={16} />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      completed: 'default',
      failed: 'destructive',
      cancelled: 'outline'
    }
    
    const labels: Record<string, string> = {
      pending: 'Pendente',
      completed: 'Concluído',
      failed: 'Falhou',
      cancelled: 'Cancelado'
    }

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {labels[status] || status}
      </Badge>
    )
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="text-orange-500" size={24} />
            PIX Pendentes
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header com ações */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {pixTransactions.length} transação(ões) pendente(s)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadPixPending}
                disabled={loading}
              >
                <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              {pixTransactions.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={deleteAllPending}
                  disabled={deleting === 'all'}
                >
                  <Trash2 size={16} className="mr-2" />
                  {deleting === 'all' ? 'Deletando...' : 'Deletar Todos'}
                </Button>
              )}
            </div>
          </div>

          {/* Lista de transações */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="animate-spin mr-2" size={20} />
              Carregando...
            </div>
          ) : pixTransactions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Clock className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-500">Nenhuma transação PIX pendente encontrada</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pixTransactions.map((pix) => (
                <Card key={pix.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        {/* Cabeçalho */}
                        <div className="flex items-center gap-3">
                          {getStatusIcon(pix.status)}
                          {getStatusBadge(pix.status)}
                          <span className="font-semibold text-lg">
                            {formatAmount(pix.amount)}
                          </span>
                        </div>

                        {/* Detalhes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Chave PIX:</span>
                            <span className="ml-2 font-mono">{pix.pix_key}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Tipo:</span>
                            <span className="ml-2">{pix.pix_key_type}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Usuário:</span>
                            <span className="ml-2">{pix.user?.name || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Email:</span>
                            <span className="ml-2 text-xs">{pix.user?.email || 'N/A'}</span>
                          </div>
                          {pix.description && (
                            <div className="md:col-span-2">
                              <span className="text-muted-foreground">Descrição:</span>
                              <span className="ml-2">{pix.description}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">Criado em:</span>
                            <span className="ml-2">{formatDate(pix.created_at)}</span>
                          </div>
                          {pix.transaction_id && (
                            <div>
                              <span className="text-muted-foreground">ID Transação:</span>
                              <span className="ml-2 font-mono text-xs">{pix.transaction_id}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="ml-4">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deletePixTransaction(pix.id)}
                          disabled={deleting === pix.id}
                        >
                          <Trash2 size={16} className={deleting === pix.id ? 'animate-pulse' : ''} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
