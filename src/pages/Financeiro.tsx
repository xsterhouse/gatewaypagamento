import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  TrendingUp, TrendingDown, Calendar, RefreshCw, Download, 
  Eye, CreditCard, FileText, Activity, 
  ArrowUpRight, ArrowDownRight, Search, Clock, CheckCircle, Send
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { formatCurrency, formatDate } from '@/lib/utils'
import { exportInvoicesToPDF } from '@/lib/pdfExportSimple'
import { InvoiceDetailsModal } from '@/components/InvoiceDetailsModal'
import { EnviarPixModal } from '@/components/EnviarPixModal'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface Invoice {
  id: string
  invoice_number?: string
  amount: number
  due_date: string
  paid_date?: string | null
  status: string
  description?: string
  created_at: string
}

interface Transaction {
  id: string
  type: string
  amount: number
  description: string
  created_at: string
  status: string
  payment_method?: string
}

interface FinanceStats {
  totalPaid: number
  totalPending: number
  totalOverdue: number
  totalInvoices: number
  avgInvoiceValue: number
  thisMonthPaid: number
  lastMonthPaid: number
  transactionsCount: number
}

export function Financeiro() {
  const { effectiveUserId } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<FinanceStats>({
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0,
    totalInvoices: 0,
    avgInvoiceValue: 0,
    thisMonthPaid: 0,
    lastMonthPaid: 0,
    transactionsCount: 0
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState<'all' | 'month' | 'week'>('all')
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isEnviarPixModalOpen, setIsEnviarPixModalOpen] = useState(false)
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    if (effectiveUserId) {
      loadData()
    }
  }, [effectiveUserId])

  useEffect(() => {
    filterInvoices()
  }, [statusFilter, searchTerm, dateFilter, invoices])

  const filterInvoices = () => {
    let filtered = [...invoices]
    
    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(inv => inv.status === statusFilter)
    }
    
    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(inv => 
        inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por data
    if (dateFilter !== 'all') {
      const now = new Date()
      filtered = filtered.filter(inv => {
        const invDate = new Date(inv.created_at)
        if (dateFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return invDate >= weekAgo
        } else if (dateFilter === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          return invDate >= monthAgo
        }
        return true
      })
    }
    
    setFilteredInvoices(filtered)
  }

  const loadData = async () => {
    try {
      if (!effectiveUserId) return

      setLoading(true)

      // Carregar faturas
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('due_date', { ascending: false })

      if (invoicesError) throw invoicesError

      // Carregar transações
      const { data: transData, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (transError && !transError.message.includes('does not exist')) {
        console.error('Erro ao carregar transações:', transError)
      }

      // Carregar transações PIX
      const { data: pixData, error: pixError } = await supabase
        .from('pix_transactions')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (pixError) {
        console.error('Erro ao carregar PIX:', pixError)
      }

      // Combinar transações
      const allTransactions = [
        ...(transData || []).map(t => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          description: t.description || 'Transação',
          created_at: t.created_at,
          status: t.status,
          payment_method: t.payment_method
        })),
        ...(pixData || []).map(p => ({
          id: p.id,
          type: p.transaction_type === 'deposit' ? 'credit' : 'debit',
          amount: p.amount,
          description: p.description || 'PIX',
          created_at: p.created_at,
          status: p.status === 'completed' || p.status === 'paid' ? 'completed' : p.status,
          payment_method: 'PIX'
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setInvoices(invoicesData || [])
      setTransactions(allTransactions)

      // Calcular estatísticas
      if (invoicesData) {
        const now = new Date()
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

        const paid = invoicesData.filter(i => i.status === 'paid')
        const pending = invoicesData.filter(i => i.status === 'pending')
        const overdue = invoicesData.filter(i => i.status === 'overdue')

        const thisMonthPaid = paid
          .filter(i => i.paid_date && new Date(i.paid_date) >= thisMonthStart)
          .reduce((sum, i) => sum + Number(i.amount), 0)

        const lastMonthPaid = paid
          .filter(i => i.paid_date && new Date(i.paid_date) >= lastMonthStart && new Date(i.paid_date) <= lastMonthEnd)
          .reduce((sum, i) => sum + Number(i.amount), 0)

        setStats({
          totalPaid: paid.reduce((sum, i) => sum + Number(i.amount), 0),
          totalPending: pending.reduce((sum, i) => sum + Number(i.amount), 0),
          totalOverdue: overdue.reduce((sum, i) => sum + Number(i.amount), 0),
          totalInvoices: invoicesData.length,
          avgInvoiceValue: invoicesData.length > 0 
            ? invoicesData.reduce((sum, i) => sum + Number(i.amount), 0) / invoicesData.length 
            : 0,
          thisMonthPaid,
          lastMonthPaid,
          transactionsCount: allTransactions.length
        })

        // Gerar dados para gráfico (últimos 6 meses)
        const chartMonths = []
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
          const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

          const monthPaid = paid
            .filter(inv => {
              const paidDate = inv.paid_date ? new Date(inv.paid_date) : null
              return paidDate && paidDate >= monthStart && paidDate <= monthEnd
            })
            .reduce((sum, inv) => sum + Number(inv.amount), 0)

          const monthInvoices = invoicesData
            .filter(inv => {
              const invDate = new Date(inv.created_at)
              return invDate >= monthStart && invDate <= monthEnd
            })
            .reduce((sum, inv) => sum + Number(inv.amount), 0)

          chartMonths.push({
            month: date.toLocaleDateString('pt-BR', { month: 'short' }),
            pago: monthPaid,
            faturado: monthInvoices
          })
        }
        setChartData(chartMonths)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados financeiros')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    toast.success('Dados atualizados!')
  }

  const handlePayInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setIsDetailsModalOpen(true)
    toast.info('Selecione a forma de pagamento')
  }

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      toast.info('Gerando PDF da fatura...')
      await exportInvoicesToPDF([invoice])
      toast.success('PDF baixado com sucesso!')
    } catch (error) {
      console.error('Erro ao baixar PDF:', error)
      toast.error('Erro ao gerar PDF')
    }
  }

  const handleExportPDF = async () => {
    try {
      if (filteredInvoices.length === 0) {
        toast.error('Nenhuma fatura para exportar')
        return
      }
      
      toast.info('Gerando PDF...')
      await exportInvoicesToPDF(filteredInvoices)
      toast.success('PDF gerado com sucesso!')
    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error)
      toast.error('Erro ao gerar PDF')
    }
  }

  const handleInvoiceClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setIsDetailsModalOpen(true)
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      paid: { icon: CheckCircle, label: 'Pago', class: 'bg-green-500/10 text-green-500 border-green-500/30' },
      pending: { icon: Clock, label: 'Pendente', class: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' },
      overdue: { icon: TrendingDown, label: 'Vencido', class: 'bg-red-500/10 text-red-500 border-red-500/30' },
      cancelled: { icon: TrendingDown, label: 'Cancelado', class: 'bg-gray-500/10 text-gray-500 border-gray-500/30' }
    }
    const badge = badges[status as keyof typeof badges] || badges.cancelled
    const Icon = badge.icon
    return (
      <Badge className={`${badge.class} border`}>
        <Icon size={12} className="mr-1" />
        {badge.label}
      </Badge>
    )
  }

  const growthPercentage = stats.lastMonthPaid > 0 
    ? ((stats.thisMonthPaid - stats.lastMonthPaid) / stats.lastMonthPaid) * 100 
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4 text-primary" size={48} />
          <p className="text-muted-foreground">Carregando dados financeiros...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Financeiro
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie suas faturas, pagamentos e histórico financeiro</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="default"
            onClick={() => setIsEnviarPixModalOpen(true)}
            size="sm"
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Send size={16} />
            Enviar PIX
          </Button>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            size="sm"
            className="gap-2"
          >
            <RefreshCw className={refreshing ? 'animate-spin' : ''} size={16} />
            Atualizar
          </Button>
          <Button onClick={handleExportPDF} size="sm" className="gap-2">
            <Download size={16} />
            Exportar
          </Button>
        </div>
      </div>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/30 hover:shadow-lg transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Pago</p>
                <p className="text-2xl font-bold text-green-500">{formatCurrency(stats.totalPaid)}</p>
                <p className="text-xs text-muted-foreground mt-1">{invoices.filter(i => i.status === 'paid').length} faturas</p>
              </div>
              <CheckCircle className="text-green-500" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/30 hover:shadow-lg transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pendente</p>
                <p className="text-2xl font-bold text-yellow-500">{formatCurrency(stats.totalPending)}</p>
                <p className="text-xs text-muted-foreground mt-1">{invoices.filter(i => i.status === 'pending').length} faturas</p>
              </div>
              <Clock className="text-yellow-500" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/30 hover:shadow-lg transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Vencido</p>
                <p className="text-2xl font-bold text-red-500">{formatCurrency(stats.totalOverdue)}</p>
                <p className="text-xs text-muted-foreground mt-1">{invoices.filter(i => i.status === 'overdue').length} faturas</p>
              </div>
              <TrendingDown className="text-red-500" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/30 hover:shadow-lg transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Este Mês</p>
                <p className="text-2xl font-bold text-blue-500">{formatCurrency(stats.thisMonthPaid)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {growthPercentage >= 0 ? (
                    <ArrowUpRight className="text-green-500" size={14} />
                  ) : (
                    <ArrowDownRight className="text-red-500" size={14} />
                  )}
                  <span className={`text-xs ${growthPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.abs(growthPercentage).toFixed(1)}%
                  </span>
                </div>
              </div>
              <Calendar className="text-blue-500" size={32} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Faturamento */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity size={20} />
            Histórico Financeiro (Últimos 6 Meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Bar dataKey="faturado" fill="#3b82f6" name="Faturado" radius={[8, 8, 0, 0]} />
              <Bar dataKey="pago" fill="#10b981" name="Pago" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Buscar por número, ID ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtros em linha */}
            <div className="flex flex-wrap gap-2">
              {/* Status */}
              <div className="flex gap-1">
                <Button
                  onClick={() => setStatusFilter('all')}
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                >
                  Todas ({invoices.length})
                </Button>
                <Button
                  onClick={() => setStatusFilter('pending')}
                  variant={statusFilter === 'pending' ? 'default' : 'outline'}
                  size="sm"
                  className={statusFilter === 'pending' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                >
                  <Clock size={14} className="mr-1" />
                  Pendentes ({invoices.filter(i => i.status === 'pending').length})
                </Button>
                <Button
                  onClick={() => setStatusFilter('paid')}
                  variant={statusFilter === 'paid' ? 'default' : 'outline'}
                  size="sm"
                  className={statusFilter === 'paid' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  <CheckCircle size={14} className="mr-1" />
                  Pagas ({invoices.filter(i => i.status === 'paid').length})
                </Button>
                <Button
                  onClick={() => setStatusFilter('overdue')}
                  variant={statusFilter === 'overdue' ? 'default' : 'outline'}
                  size="sm"
                  className={statusFilter === 'overdue' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  <TrendingDown size={14} className="mr-1" />
                  Vencidas ({invoices.filter(i => i.status === 'overdue').length})
                </Button>
              </div>

              {/* Data */}
              <div className="flex gap-1">
                <Button
                  onClick={() => setDateFilter('all')}
                  variant={dateFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                >
                  Todo Período
                </Button>
                <Button
                  onClick={() => setDateFilter('month')}
                  variant={dateFilter === 'month' ? 'default' : 'outline'}
                  size="sm"
                >
                  30 dias
                </Button>
                <Button
                  onClick={() => setDateFilter('week')}
                  variant={dateFilter === 'week' ? 'default' : 'outline'}
                  size="sm"
                >
                  7 dias
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Faturas */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText size={20} />
              Faturas ({filteredInvoices.length})
            </span>
            {filteredInvoices.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                Total: {formatCurrency(filteredInvoices.reduce((sum, i) => sum + i.amount, 0))}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto text-muted-foreground mb-4" size={48} />
              <p className="text-muted-foreground">Nenhuma fatura encontrada</p>
              <p className="text-xs text-muted-foreground mt-2">Tente ajustar os filtros</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="pb-3 font-medium">Número</th>
                    <th className="pb-3 font-medium">Valor</th>
                    <th className="pb-3 font-medium">Vencimento</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Criado em</th>
                    <th className="pb-3 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-3 text-sm font-mono">
                        {invoice.invoice_number || invoice.id.slice(0, 8)}
                      </td>
                      <td className="py-3 text-sm font-bold">
                        {formatCurrency(invoice.amount)}
                      </td>
                      <td className="py-3 text-sm text-muted-foreground">
                        {formatDate(invoice.due_date)}
                      </td>
                      <td className="py-3">
                        {getStatusBadge(invoice.status)}
                      </td>
                      <td className="py-3 text-sm text-muted-foreground">
                        {formatDate(invoice.created_at)}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleInvoiceClick(invoice)}
                            className="h-8 w-8 p-0"
                            title="Visualizar"
                          >
                            <Eye size={16} />
                          </Button>
                          {invoice.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePayInvoice(invoice)}
                              className="h-8 w-8 p-0 text-green-500 hover:text-green-600"
                              title="Pagar"
                            >
                              <CreditCard size={16} />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadInvoice(invoice)}
                            className="h-8 w-8 p-0"
                            title="Baixar PDF"
                          >
                            <Download size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Transações */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity size={20} />
            Histórico de Transações ({transactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="mx-auto mb-4" size={48} />
              <p>Nenhuma transação encontrada</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {transactions.slice(0, 20).map((trans) => (
                <div
                  key={trans.id}
                  className="flex items-center justify-between p-3 bg-accent/50 rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      trans.type === 'credit' ? 'bg-green-500/10' : 'bg-red-500/10'
                    }`}>
                      {trans.type === 'credit' ? (
                        <TrendingUp className="text-green-500" size={20} />
                      ) : (
                        <TrendingDown className="text-red-500" size={20} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{trans.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{new Date(trans.created_at).toLocaleDateString('pt-BR')}</span>
                        {trans.payment_method && (
                          <>
                            <span>•</span>
                            <span>{trans.payment_method}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      trans.type === 'credit' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {trans.type === 'credit' ? '+' : '-'} {formatCurrency(trans.amount)}
                    </p>
                    {getStatusBadge(trans.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <InvoiceDetailsModal
        isOpen={isDetailsModalOpen}
        invoice={selectedInvoice}
        onClose={() => {
          setIsDetailsModalOpen(false)
          setSelectedInvoice(null)
        }}
        onPaymentInitiated={loadData}
      />
      
      {/* Modal de Enviar PIX */}
      <EnviarPixModal 
        open={isEnviarPixModalOpen} 
        onClose={() => setIsEnviarPixModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  )
}
