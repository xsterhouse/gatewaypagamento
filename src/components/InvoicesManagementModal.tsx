import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trash2, RefreshCw, AlertCircle, CheckCircle, Clock, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface Invoice {
  id: string
  user_id: string
  customer_id: string
  description: string
  amount: number
  due_date: string
  has_interest: boolean
  interest_rate: number
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  barcode: string
  qr_code_data: string
  pdf_url?: string
  loc_id?: string
  transaction_id?: string
  linha_digitavel?: string
  nosso_numero?: string
  url_pdf?: string
  created_at: string
  updated_at: string
  customer?: {
    name: string
    email: string
    cpf: string
  }
  user?: {
    name: string
    email: string
  }
}

interface InvoicesManagementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefresh?: () => void
}

export function InvoicesManagementModal({ open, onOpenChange, onRefresh }: InvoicesManagementModalProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'overdue' | 'cancelled'>('all')

  const loadInvoices = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('invoices')
        .select(`
          *,
          customer:customers(name, email, cpf),
          user:users(name, email)
        `)
        .order('created_at', { ascending: false })

      // Aplicar filtro se não for 'all'
      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao carregar faturas:', error)
        toast.error('Erro ao carregar faturas')
        return
      }

      setInvoices(data || [])
    } catch (error) {
      console.error('Erro ao carregar faturas:', error)
      toast.error('Erro ao carregar faturas')
    } finally {
      setLoading(false)
    }
  }

  const deleteInvoice = async (id: string) => {
    try {
      setDeleting(id)
      
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao deletar fatura:', error)
        toast.error('Erro ao deletar fatura')
        return
      }

      toast.success('Fatura deletada com sucesso')
      await loadInvoices()
      onRefresh?.()
    } catch (error) {
      console.error('Erro ao deletar fatura:', error)
      toast.error('Erro ao deletar fatura')
    } finally {
      setDeleting(null)
    }
  }

  const deleteByFilter = async () => {
    const statusText = {
      all: 'todas as faturas',
      pending: 'todas as faturas pendentes',
      paid: 'todas as faturas pagas',
      overdue: 'todas as faturas vencidas',
      cancelled: 'todas as faturas canceladas'
    }

    if (!confirm(`Tem certeza que deseja deletar ${statusText[filter]}?`)) {
      return
    }

    try {
      setDeleting('all')
      
      let query = supabase.from('invoices').delete()
      
      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { error } = await query

      if (error) {
        console.error('Erro ao deletar faturas:', error)
        toast.error('Erro ao deletar faturas')
        return
      }

      toast.success(`${statusText[filter]} foram deletadas`)
      await loadInvoices()
      onRefresh?.()
    } catch (error) {
      console.error('Erro ao deletar faturas:', error)
      toast.error('Erro ao deletar faturas')
    } finally {
      setDeleting(null)
    }
  }

  useEffect(() => {
    if (open) {
      loadInvoices()
    }
  }, [open, filter])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-orange-500" size={16} />
      case 'paid':
        return <CheckCircle className="text-green-500" size={16} />
      case 'overdue':
        return <AlertCircle className="text-red-500" size={16} />
      case 'cancelled':
        return <AlertCircle className="text-gray-500" size={16} />
      default:
        return <FileText className="text-gray-500" size={16} />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      paid: 'default',
      overdue: 'destructive',
      cancelled: 'outline'
    }
    
    const labels: Record<string, string> = {
      pending: 'Pendente',
      paid: 'Paga',
      overdue: 'Vencida',
      cancelled: 'Cancelada'
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

  const formatDueDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getFilteredCount = () => {
    if (filter === 'all') return invoices.length
    return invoices.filter(inv => inv.status === filter).length
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="text-blue-500" size={24} />
            Gerenciar Faturas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filtros e ações */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filtrar:</span>
              <div className="flex gap-1">
                {[
                  { value: 'all', label: 'Todas' },
                  { value: 'pending', label: 'Pendentes' },
                  { value: 'paid', label: 'Pagas' },
                  { value: 'overdue', label: 'Vencidas' },
                  { value: 'cancelled', label: 'Canceladas' }
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={filter === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(option.value as any)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                ({getFilteredCount()} encontradas)
              </span>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadInvoices}
                disabled={loading}
              >
                <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              {invoices.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={deleteByFilter}
                  disabled={deleting === 'all'}
                >
                  <Trash2 size={16} className="mr-2" />
                  {deleting === 'all' ? 'Deletando...' : `Deletar ${filter === 'all' ? 'Todas' : 'Selecionadas'}`}
                </Button>
              )}
            </div>
          </div>

          {/* Lista de faturas */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="animate-spin mr-2" size={20} />
              Carregando...
            </div>
          ) : invoices.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-500">Nenhuma fatura encontrada</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {invoices
                .filter(inv => filter === 'all' || inv.status === filter)
                .map((invoice) => (
                <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        {/* Cabeçalho */}
                        <div className="flex items-center gap-3">
                          {getStatusIcon(invoice.status)}
                          {getStatusBadge(invoice.status)}
                          <span className="font-semibold text-lg">
                            {formatAmount(invoice.amount)}
                          </span>
                        </div>

                        {/* Detalhes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Descrição:</span>
                            <span className="ml-2">{invoice.description}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Vencimento:</span>
                            <span className="ml-2">{formatDueDate(invoice.due_date)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Cliente:</span>
                            <span className="ml-2">{invoice.customer?.name || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">CPF Cliente:</span>
                            <span className="ml-2">{invoice.customer?.cpf || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Usuário:</span>
                            <span className="ml-2">{invoice.user?.name || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Email Usuário:</span>
                            <span className="ml-2 text-xs">{invoice.user?.email || 'N/A'}</span>
                          </div>
                          {invoice.nosso_numero && (
                            <div>
                              <span className="text-muted-foreground">Nosso Número:</span>
                              <span className="ml-2 font-mono text-xs">{invoice.nosso_numero}</span>
                            </div>
                          )}
                          {invoice.transaction_id && (
                            <div>
                              <span className="text-muted-foreground">ID Transação:</span>
                              <span className="ml-2 font-mono text-xs">{invoice.transaction_id}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">Criado em:</span>
                            <span className="ml-2">{formatDate(invoice.created_at)}</span>
                          </div>
                          {invoice.has_interest && (
                            <div>
                              <span className="text-muted-foreground">Juros:</span>
                              <span className="ml-2">{invoice.interest_rate}%</span>
                            </div>
                          )}
                        </div>

                        {/* Código de barras e linha digitável */}
                        {invoice.barcode && (
                          <div className="space-y-1 text-xs">
                            <div>
                              <span className="text-muted-foreground">Código Barras:</span>
                              <span className="ml-2 font-mono">{invoice.barcode}</span>
                            </div>
                            {invoice.linha_digitavel && (
                              <div>
                                <span className="text-muted-foreground">Linha Digitável:</span>
                                <span className="ml-2 font-mono">{invoice.linha_digitavel}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Ações */}
                      <div className="ml-4">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteInvoice(invoice.id)}
                          disabled={deleting === invoice.id}
                        >
                          <Trash2 size={16} className={deleting === invoice.id ? 'animate-pulse' : ''} />
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
