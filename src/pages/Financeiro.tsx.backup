import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Wallet, TrendingUp, TrendingDown, Calendar, RefreshCw, Download, Filter, Eye, CreditCard, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { formatCurrency, formatDate } from '@/lib/utils'
import { exportInvoicesToPDF } from '@/lib/pdfExportSimple'
import { InvoiceDetailsModal } from '@/components/InvoiceDetailsModal'

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

export function Financeiro() {
  const { effectiveUserId } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [totalPending, setTotalPending] = useState(0)
  const [totalPaid, setTotalPaid] = useState(0)
  const [totalOverdue, setTotalOverdue] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  useEffect(() => {
    if (effectiveUserId) {
      loadInvoices()
    }
  }, [effectiveUserId])

  useEffect(() => {
    filterInvoices()
  }, [statusFilter, invoices])

  const filterInvoices = () => {
    let filtered = [...invoices]
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(inv => inv.status === statusFilter)
    }
    
    setFilteredInvoices(filtered)
  }

  const loadInvoices = async () => {
    try {
      if (!effectiveUserId) {
        console.log('⚠️ effectiveUserId não definido')
        return
      }

      console.log('🔍 Buscando faturas para user_id:', effectiveUserId)

      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('due_date', { ascending: false })

      if (error) {
        console.error('❌ Erro ao carregar faturas:', error)
        toast.error('Erro ao carregar faturas')
        return
      }

      console.log('✅ Faturas encontradas:', data?.length || 0)
      if (data && data.length > 0) {
        console.log('📋 Primeira fatura:', data[0])
      }

      if (data) {
        setInvoices(data)
        
        const pending = data.filter(i => i.status === 'pending').reduce((sum, i) => sum + Number(i.amount), 0)
        const paid = data.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount), 0)
        const overdue = data.filter(i => i.status === 'overdue').reduce((sum, i) => sum + Number(i.amount), 0)
        
        setTotalPending(pending)
        setTotalPaid(paid)
        setTotalOverdue(overdue)
        
        console.log('💰 Faturas carregadas:', data.length)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar faturas:', error)
      toast.error('Erro ao carregar faturas')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadInvoices()
    toast.success('Faturas atualizadas!')
  }

  const handlePayInvoice = (invoice: Invoice) => {
    // Abrir modal de detalhes com foco em pagamento
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
      toast.info('Gerando PDF...')
      
      // Verificar se há faturas
      if (filteredInvoices.length === 0) {
        toast.error('Nenhuma fatura para exportar')
        return
      }
      
      await exportInvoicesToPDF(filteredInvoices)
      toast.success('PDF aberto em nova aba!')
    } catch (error: any) {
      console.error('Erro detalhado ao gerar PDF:', error)
      console.error('Stack:', error.stack)
      toast.error(`Erro ao gerar PDF: ${error.message || 'Erro desconhecido'}`)
    }
  }

  const handleInvoiceClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setIsDetailsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsDetailsModalOpen(false)
    setSelectedInvoice(null)
  }

  const handlePaymentInitiated = () => {
    // Recarregar faturas após iniciar pagamento
    loadInvoices()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Pago</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">Pendente</Badge>
      case 'overdue':
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Vencido</Badge>
      default:
        return <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20">Cancelado</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground">Carregando faturas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Financeiro</h1>
          <p className="text-muted-foreground">Gerencie suas faturas e pagamentos</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('all')}
              size="sm"
            >
              <Filter className="h-4 w-4 mr-2" />
              Todos ({invoices.length})
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('pending')}
              size="sm"
            >
              Pendente ({invoices.filter(i => i.status === 'pending').length})
            </Button>
            <Button
              variant={statusFilter === 'paid' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('paid')}
              size="sm"
            >
              Pago ({invoices.filter(i => i.status === 'paid').length})
            </Button>
            <Button
              variant={statusFilter === 'overdue' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('overdue')}
              size="sm"
            >
              Vencido ({invoices.filter(i => i.status === 'overdue').length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border transition-all hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Total Pago</p>
                <h3 className="text-2xl font-bold text-foreground">{formatCurrency(totalPaid)}</h3>
              </div>
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-green-400" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border transition-all hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Pendente</p>
                <h3 className="text-2xl font-bold text-foreground">{formatCurrency(totalPending)}</h3>
              </div>
              <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <Wallet className="text-yellow-400" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border transition-all hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Vencido</p>
                <h3 className="text-2xl font-bold text-foreground">{formatCurrency(totalOverdue)}</h3>
              </div>
              <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                <TrendingDown className="text-red-400" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Faturas */}
      <Card className="bg-card border-border transition-all hover:shadow-lg">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Calendar size={20} />
            Faturas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Valor</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Vencimento</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Criado em</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      {invoices.length === 0 ? 'Nenhuma fatura encontrada' : 'Nenhuma fatura com este filtro'}
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <tr 
                      key={invoice.id} 
                      className="border-b border-border hover:bg-accent/50 transition-all"
                    >
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {invoice.invoice_number || invoice.id.slice(0, 8)}
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground font-medium">{formatCurrency(invoice.amount)}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{formatDate(invoice.due_date)}</td>
                      <td className="py-3 px-4">{getStatusBadge(invoice.status)}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{formatDate(invoice.created_at)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* Botão Visualizar */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleInvoiceClick(invoice)}
                            className="h-8 w-8 p-0 hover:bg-blue-500/10 hover:text-blue-500"
                            title="Visualizar detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {/* Botão Pagar (apenas se pendente) */}
                          {invoice.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePayInvoice(invoice)}
                              className="h-8 w-8 p-0 hover:bg-green-500/10 hover:text-green-500"
                              title="Pagar fatura"
                            >
                              <CreditCard className="h-4 w-4" />
                            </Button>
                          )}

                          {/* Botão Baixar PDF */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadInvoice(invoice)}
                            className="h-8 w-8 p-0 hover:bg-purple-500/10 hover:text-purple-500"
                            title="Baixar PDF"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <InvoiceDetailsModal
        isOpen={isDetailsModalOpen}
        invoice={selectedInvoice}
        onClose={handleCloseModal}
        onPaymentInitiated={handlePaymentInitiated}
      />
    </div>
  )
}
