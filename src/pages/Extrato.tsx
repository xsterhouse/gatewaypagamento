import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  DollarSign, 
  Receipt, 
  TrendingUp,
  Filter,
  Loader2,
  Search
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Pagination } from '@/components/ui/pagination'
import { usePagination } from '@/hooks/usePagination'
import { FiltrosExtratoModal } from '@/components/FiltrosExtratoModal'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'

interface Transaction {
  id: string
  amount: number
  status: string
  payment_method: string
  description: string | null
  created_at: string
  end_to_end_id?: string
  tax?: number
  previous_balance?: number
  new_balance?: number
  transaction_type?: 'pix' | 'boleto' | 'wallet' | 'deposit' | 'withdrawal'
  pix_key?: string
  due_date?: string
  paid_at?: string
}

interface ExtratoMetrics {
  totalTransactions: number
  totalProcessed: number
  totalTaxes: number
  averageTicket: number
}

export function Extrato() {
  const { effectiveUserId } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<ExtratoMetrics>({
    totalTransactions: 0,
    totalProcessed: 0,
    totalTaxes: 0,
    averageTicket: 0,
  })
  
  const [filters, setFilters] = useState({
    status: 'all',
    dateFrom: '',
    dateTo: '',
    minValue: '',
    maxValue: '',
  })
  
  const [searchTerm, setSearchTerm] = useState('')
  const [isFiltrosModalOpen, setIsFiltrosModalOpen] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const { currentPage, pageSize, offset, goToPage, getTotalPages } = usePagination(1, 10)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (effectiveUserId) {
      loadTransactions()
    }
  }, [currentPage, filters, searchTerm, effectiveUserId])

  const loadTransactions = async () => {
    try {
      setLoading(true)

      if (!effectiveUserId) {
        setLoading(false)
        return
      }

      // Buscar transações PIX
      const pixQuery = supabase
        .from('pix_transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: false })

      // Buscar transações de Boleto
      const boletoQuery = supabase
        .from('boleto_transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: false })

      // Buscar transações de Carteira
      const walletQuery = supabase
        .from('wallet_transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: false })

      // Executar todas as queries
      const [pixResult, boletoResult, walletResult] = await Promise.all([
        pixQuery,
        boletoQuery,
        walletQuery
      ])

      if (pixResult.error) throw pixResult.error
      if (boletoResult.error) throw boletoResult.error
      if (walletResult.error) throw walletResult.error

      // Combinar e formatar todas as transações
      const allTransactions: Transaction[] = []

      // Adicionar transações PIX
      if (pixResult.data) {
        pixResult.data.forEach((tx: any) => {
          allTransactions.push({
            id: tx.id,
            amount: tx.amount,
            status: tx.status,
            payment_method: 'PIX',
            description: tx.description || 'Transação PIX',
            created_at: tx.created_at,
            end_to_end_id: tx.e2e_id,
            transaction_type: 'pix',
            pix_key: tx.pix_key,
            paid_at: tx.paid_at
          })
        })
      }

      // Adicionar transações de Boleto
      if (boletoResult.data) {
        boletoResult.data.forEach((tx: any) => {
          allTransactions.push({
            id: tx.id,
            amount: tx.amount,
            status: tx.status,
            payment_method: 'Boleto',
            description: tx.description || 'Pagamento de Boleto',
            created_at: tx.created_at,
            transaction_type: 'boleto',
            due_date: tx.due_date,
            paid_at: tx.paid_at
          })
        })
      }

      // Adicionar transações de Carteira
      if (walletResult.data) {
        walletResult.data.forEach((tx: any) => {
          allTransactions.push({
            id: tx.id,
            amount: tx.amount,
            status: tx.status,
            payment_method: 'Carteira',
            description: tx.description || 'Movimentação de Carteira',
            created_at: tx.created_at,
            transaction_type: 'wallet',
            previous_balance: tx.previous_balance,
            new_balance: tx.new_balance
          })
        })
      }

      // Ordenar por data (mais recente primeiro)
      allTransactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      // Aplicar filtros
      let filteredTransactions = allTransactions

      if (filters.status !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.status === filters.status)
      }

      if (filters.dateFrom) {
        filteredTransactions = filteredTransactions.filter(t => t.created_at >= filters.dateFrom)
      }

      if (filters.dateTo) {
        filteredTransactions = filteredTransactions.filter(t => t.created_at <= filters.dateTo)
      }

      if (filters.minValue) {
        filteredTransactions = filteredTransactions.filter(t => t.amount >= Number(filters.minValue))
      }

      if (filters.maxValue) {
        filteredTransactions = filteredTransactions.filter(t => t.amount <= Number(filters.maxValue))
      }

      // Aplicar pesquisa
      if (searchTerm) {
        filteredTransactions = filteredTransactions.filter(t => 
          t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.payment_method.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.id.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      // Paginação
      const totalCount = filteredTransactions.length
      const paginatedTransactions = filteredTransactions.slice(offset, offset + pageSize)

      setTransactions(paginatedTransactions)
      setTotal(totalCount)

      // Calcular métricas
      if (filteredTransactions.length > 0) {
        const totalProcessed = filteredTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
        const totalTaxes = filteredTransactions.reduce((sum, t) => sum + (Number(t.amount) * 0.035), 0)
        
        setMetrics({
          totalTransactions: totalCount,
          totalProcessed,
          totalTaxes,
          averageTicket: totalProcessed / filteredTransactions.length
        })
      } else {
        setMetrics({
          totalTransactions: 0,
          totalProcessed: 0,
          totalTaxes: 0,
          averageTicket: 0
        })
      }
    } catch (error) {
      console.error('Erro ao carregar transações:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Aprovado</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">Pendente</Badge>
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Rejeitado</Badge>
      case 'refunded':
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Reembolsado</Badge>
      default:
        return <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20">{status}</Badge>
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      pix: 'PIX',
      credit_card: 'Cartão de Crédito',
      debit_card: 'Cartão de Débito',
      boleto: 'Boleto',
    }
    return labels[method] || method
  }

  const applyFilters = (newFilters: typeof filters) => {
    setFilters(newFilters)
    goToPage(1) // Voltar para primeira página ao filtrar
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Extrato de Transações</h1>
          <p className="text-gray-400">Visualize e gerencie todas as suas transações</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsStatusModalOpen(true)}
            variant="outline"
            className="gap-2"
          >
            <Filter size={16} />
            Status
          </Button>
          <Button 
            onClick={() => setIsFiltrosModalOpen(true)}
            variant="outline"
            className="gap-2"
          >
            <Filter size={16} />
            Filtros
          </Button>
        </div>
      </div>

      {/* Barra de Pesquisa */}
      <Card className="bg-[#1a1f2e] border-gray-800">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por descrição, método de pagamento ou código..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </CardContent>
      </Card>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-[#1a1f2e] border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total de Transações</p>
                <h3 className="text-2xl font-bold text-white">{metrics.totalTransactions}</h3>
                <p className="text-xs text-gray-500 mt-1">Todas as transações</p>
              </div>
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <FileText className="text-emerald-400" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f2e] border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Processado</p>
                <h3 className="text-2xl font-bold text-white">{formatCurrency(metrics.totalProcessed)}</h3>
                <p className="text-xs text-gray-500 mt-1">Valor total movimentado</p>
              </div>
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <DollarSign className="text-emerald-400" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f2e] border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total de Taxas</p>
                <h3 className="text-2xl font-bold text-white">{formatCurrency(metrics.totalTaxes)}</h3>
                <p className="text-xs text-gray-500 mt-1">Taxas cobradas</p>
              </div>
              <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <Receipt className="text-yellow-400" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f2e] border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Ticket Médio</p>
                <h3 className="text-2xl font-bold text-white">{formatCurrency(metrics.averageTicket)}</h3>
                <p className="text-xs text-gray-500 mt-1">Valor médio por transação</p>
              </div>
              <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-cyan-400" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Transações */}
      <Card className="bg-[#1a1f2e] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText size={20} />
            Histórico de Transações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Tipo</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Valor</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Taxa</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Método</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Código END2END</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Descrição</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Última Atualização</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Saldo Anterior</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Novo Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-8 text-gray-400">
                          Nenhuma transação encontrada
                        </td>
                      </tr>
                    ) : (
                      transactions.map((transaction) => {
                        const tax = Number(transaction.amount) * 0.035
                        const previousBalance = transaction.previous_balance || 0
                        const newBalance = previousBalance + Number(transaction.amount) - tax
                        
                        return (
                          <tr key={transaction.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                            <td className="py-3 px-4 text-sm text-gray-300">
                              {transaction.amount > 0 ? 'Entrada' : 'Saída'}
                            </td>
                            <td className="py-3 px-4 text-sm text-white font-medium">
                              {formatCurrency(transaction.amount)}
                            </td>
                            <td className="py-3 px-4 text-sm text-yellow-400">
                              {formatCurrency(tax)}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-300">
                              <div className="flex flex-col">
                                <span>{getPaymentMethodLabel(transaction.payment_method)}</span>
                                {transaction.transaction_type && (
                                  <span className="text-xs text-gray-400 capitalize">
                                    {transaction.transaction_type}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-300 font-mono">
                              <div className="flex flex-col">
                                <span>{transaction.end_to_end_id || transaction.id.slice(0, 8)}</span>
                                {transaction.pix_key && (
                                  <span className="text-xs text-gray-400 truncate max-w-[120px]">
                                    {transaction.pix_key}
                                  </span>
                                )}
                                {transaction.due_date && (
                                  <span className="text-xs text-yellow-400">
                                    Venc: {new Date(transaction.due_date).toLocaleDateString('pt-BR')}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">{getStatusBadge(transaction.status)}</td>
                            <td className="py-3 px-4 text-sm text-gray-300">
                              {transaction.description || '-'}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-300">
                              {formatDateTime(transaction.created_at)}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-300">
                              {formatCurrency(previousBalance)}
                            </td>
                            <td className="py-3 px-4 text-sm text-emerald-400 font-medium">
                              {formatCurrency(newBalance)}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {total > pageSize && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={getTotalPages(total)}
                  onPageChange={goToPage}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de Status */}
      <StatusModal
        open={isStatusModalOpen}
        onOpenChange={setIsStatusModalOpen}
        currentStatus={filters.status}
        onSelectStatus={(status) => {
          applyFilters({ ...filters, status })
          setIsStatusModalOpen(false)
        }}
      />

      {/* Modal de Filtros */}
      <FiltrosExtratoModal
        open={isFiltrosModalOpen}
        onOpenChange={setIsFiltrosModalOpen}
        filters={filters}
        onApplyFilters={applyFilters}
      />
    </div>
  )
}

// Modal de Status
interface StatusModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentStatus: string
  onSelectStatus: (status: string) => void
}

function StatusModal({ open, onOpenChange, currentStatus, onSelectStatus }: StatusModalProps) {
  const statusOptions = [
    { value: 'all', label: 'Todos', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
    { value: 'approved', label: 'Pago', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
    { value: 'pending', label: 'Pendente', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    { value: 'refunded', label: 'Estornado', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="text-primary" size={24} />
            Filtrar por Status
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onSelectStatus(option.value)}
              className={`w-full p-4 rounded-lg border transition-all hover:scale-[1.02] ${
                currentStatus === option.value
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">{option.label}</span>
                <Badge className={option.color}>{option.label}</Badge>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
