import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  RefreshCw, 
  Download, 
  Edit, 
  Trash2, 
  Search,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Eye
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CreateInvoiceModal } from '@/components/CreateInvoiceModal'
import { EditInvoiceModal } from '@/components/EditInvoiceModal'
import { InvoiceDetailsModal } from '@/components/InvoiceDetailsModal'

interface Invoice {
  id: string
  user_id: string
  user_name?: string
  user_email?: string
  amount: number
  due_date: string
  paid_date: string | null
  status: string
  description: string
  invoice_number: string
  created_at: string
}

export function AdminInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  
  // Métricas
  const [totalAmount, setTotalAmount] = useState(0)
  const [totalPending, setTotalPending] = useState(0)
  const [totalOverdue, setTotalOverdue] = useState(0)

  useEffect(() => {
    loadInvoices()
  }, [])

  useEffect(() => {
    filterInvoices()
  }, [searchTerm, statusFilter, invoices])

  const loadInvoices = async () => {
    try {
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })

      if (invoicesError) throw invoicesError

      // Buscar informações dos usuários
      if (invoicesData && invoicesData.length > 0) {
        const userIds = [...new Set(invoicesData.map(inv => inv.user_id))]
        const { data: usersData } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', userIds)

        const usersMap = new Map(usersData?.map(u => [u.id, u]) || [])

        const enrichedInvoices = invoicesData.map(inv => ({
          ...inv,
          user_name: usersMap.get(inv.user_id)?.name || 'Desconhecido',
          user_email: usersMap.get(inv.user_id)?.email || ''
        }))

        setInvoices(enrichedInvoices)
        calculateMetrics(enrichedInvoices)
      } else {
        setInvoices([])
      }

      console.log('💰 Faturas admin carregadas:', invoicesData?.length || 0)
    } catch (error) {
      console.error('Erro ao carregar faturas:', error)
      toast.error('Erro ao carregar faturas')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const calculateMetrics = (data: Invoice[]) => {
    const total = data.reduce((sum, inv) => sum + Number(inv.amount), 0)
    const pending = data
      .filter(inv => inv.status === 'pending')
      .reduce((sum, inv) => sum + Number(inv.amount), 0)
    const overdue = data
      .filter(inv => inv.status === 'overdue')
      .reduce((sum, inv) => sum + Number(inv.amount), 0)

    setTotalAmount(total)
    setTotalPending(pending)
    setTotalOverdue(overdue)
  }

  const filterInvoices = () => {
    let filtered = [...invoices]

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(inv =>
        inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(inv => inv.status === statusFilter)
    }

    setFilteredInvoices(filtered)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadInvoices()
    toast.success('Faturas atualizadas!')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta fatura?')) return

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Fatura excluída com sucesso!')
      loadInvoices()
    } catch (error) {
      console.error('Erro ao excluir fatura:', error)
      toast.error('Erro ao excluir fatura')
    }
  }

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setIsEditModalOpen(true)
  }

  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setIsDetailsModalOpen(true)
  }

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false)
    setSelectedInvoice(null)
  }

  const handleExportPDF = async () => {
    toast.info('Gerando PDF...')
    // Implementação da exportação PDF será feita a seguir
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Pago</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">Pendente</Badge>
      case 'overdue':
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Vencido</Badge>
      case 'cancelled':
        return <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20">Cancelado</Badge>
      default:
        return <Badge>{status}</Badge>
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Gerenciar Faturas</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">Administre todas as faturas do sistema</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            size="sm"
            className="flex-1 sm:flex-none"
          >
            <RefreshCw className={`h-4 w-4 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExportPDF}
            size="sm"
            className="flex-1 sm:flex-none"
          >
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Exportar PDF</span>
          </Button>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            size="sm"
            className="flex-1 sm:flex-none"
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Nova Fatura</span>
          </Button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <Card className="bg-card border-border transition-all hover:shadow-lg hover:scale-105">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-xs sm:text-sm mb-1">Total Geral</p>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{formatCurrency(totalAmount)}</h3>
                <p className="text-xs text-muted-foreground mt-1">{invoices.length} faturas</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <DollarSign className="text-primary" size={18} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border transition-all hover:shadow-lg hover:scale-105">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-xs sm:text-sm mb-1">Pendente</p>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{formatCurrency(totalPending)}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {invoices.filter(i => i.status === 'pending').length} faturas
                </p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-yellow-400" size={18} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border transition-all hover:shadow-lg hover:scale-105">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-xs sm:text-sm mb-1">Vencido</p>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{formatCurrency(totalOverdue)}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {invoices.filter(i => i.status === 'overdue').length} faturas
                </p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                <AlertCircle className="text-red-400" size={18} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  placeholder="Buscar por número, cliente, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                size="sm"
              >
                Todos
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('pending')}
                size="sm"
              >
                Pendente
              </Button>
              <Button
                variant={statusFilter === 'paid' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('paid')}
                size="sm"
              >
                Pago
              </Button>
              <Button
                variant={statusFilter === 'overdue' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('overdue')}
                size="sm"
              >
                Vencido
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Faturas */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">
            Faturas ({filteredInvoices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm font-medium text-muted-foreground">Número</th>
                  <th className="text-left py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm font-medium text-muted-foreground">Cliente</th>
                  <th className="text-left py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm font-medium text-muted-foreground">Valor</th>
                  <th className="text-left py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm font-medium text-muted-foreground">Vencimento</th>
                  <th className="text-left py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm font-medium text-muted-foreground">Descrição</th>
                  <th className="text-right py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                      Nenhuma fatura encontrada
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-border hover:bg-accent/50 transition-all">
                      <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm text-foreground font-mono">{invoice.invoice_number}</td>
                      <td className="py-2 px-2 sm:py-3 sm:px-4">
                        <div className="text-xs sm:text-sm text-foreground">{invoice.user_name}</div>
                        <div className="text-xs text-muted-foreground">{invoice.user_email}</div>
                      </td>
                      <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm text-foreground font-medium">
                        {formatCurrency(invoice.amount)}
                      </td>
                      <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm text-muted-foreground">{formatDate(invoice.due_date)}</td>
                      <td className="py-2 px-2 sm:py-3 sm:px-4">{getStatusBadge(invoice.status)}</td>
                      <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm text-muted-foreground max-w-xs truncate">
                        {invoice.description || '-'}
                      </td>
                      <td className="py-2 px-2 sm:py-3 sm:px-4">
                        <div className="flex justify-end gap-1 sm:gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(invoice)}
                            title="Visualizar"
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                          >
                            <Eye size={14} className="sm:w-4 sm:h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(invoice)}
                            title="Editar"
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                          >
                            <Edit size={14} className="sm:w-4 sm:h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(invoice.id)}
                            className="text-red-400 hover:text-red-300 h-7 w-7 sm:h-8 sm:w-8 p-0"
                            title="Excluir"
                          >
                            <Trash2 size={14} className="sm:w-4 sm:h-4" />
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

      {/* Modals */}
      <CreateInvoiceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false)
          loadInvoices()
        }}
      />

      <EditInvoiceModal
        isOpen={isEditModalOpen}
        invoice={selectedInvoice}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedInvoice(null)
        }}
        onSuccess={() => {
          setIsEditModalOpen(false)
          setSelectedInvoice(null)
          loadInvoices()
        }}
      />

      <InvoiceDetailsModal
        isOpen={isDetailsModalOpen}
        invoice={selectedInvoice}
        onClose={handleCloseDetailsModal}
        onPaymentInitiated={() => {
          loadInvoices()
        }}
      />
    </div>
  )
}
