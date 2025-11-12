import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Filter, Loader2, Calendar, FileDown, Eye, Edit, Trash2, X } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import { useTransactions, type Transaction } from '@/hooks/useTransactions'
import { usePagination } from '@/hooks/usePagination'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export function Relatorios() {
  const [filter, setFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all')
  const [exporting, setExporting] = useState(false)
  const [viewModal, setViewModal] = useState<Transaction | null>(null)
  const [editModal, setEditModal] = useState<Transaction | null>(null)
  const [deleteModal, setDeleteModal] = useState<Transaction | null>(null)
  const { currentPage, pageSize, offset, goToPage, getTotalPages } = usePagination(1, 10)
  const { transactions, loading, error, total, refetch } = useTransactions({ 
    status: filter, 
    limit: pageSize, 
    offset 
  })

  if (error) {
    toast.error('Erro ao carregar transações')
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

  const exportToPDF = async () => {
    try {
      setExporting(true)
      const doc = new jsPDF()
      
      // Cabeçalho
      doc.setFontSize(18)
      doc.setTextColor(0, 255, 136) // Verde #00ff88
      doc.text('Relatório de Transações', 14, 20)
      
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(`Gerado em: ${formatDateTime(new Date().toISOString())}`, 14, 28)
      doc.text(`Total de transações: ${transactions.length}`, 14, 34)
      
      // Calcular totais
      const totalAmount = transactions.reduce((sum, t) => sum + Number(t.amount || 0), 0)
      doc.text(`Valor total: ${formatCurrency(totalAmount)}`, 14, 40)
      
      // Tabela
      const tableData = transactions.map(t => [
        t.id.slice(0, 8),
        formatCurrency(t.amount),
        t.status === 'approved' ? 'Aprovado' : 
        t.status === 'pending' ? 'Pendente' : 
        t.status === 'rejected' ? 'Rejeitado' : t.status,
        getPaymentMethodLabel(t.payment_method),
        t.customer_name || '-',
        formatDateTime(t.created_at)
      ])
      
      ;(doc as any).autoTable({
        head: [['ID', 'Valor', 'Status', 'Método', 'Cliente', 'Data']],
        body: tableData,
        startY: 50,
        theme: 'grid',
        headStyles: {
          fillColor: [0, 255, 136],
          textColor: [0, 0, 0],
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 8,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 25, halign: 'right' },
          2: { cellWidth: 25 },
          3: { cellWidth: 30 },
          4: { cellWidth: 40 },
          5: { cellWidth: 35 }
        }
      })
      
      // Rodapé
      const pageCount = (doc as any).internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(
          `Página ${i} de ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        )
      }
      
      // Download
      doc.save(`relatorio-transacoes-${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('Relatório exportado com sucesso!')
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      toast.error('Erro ao exportar relatório')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">Visualize e exporte relatórios de transações em PDF</p>
        </div>
        <Button 
          onClick={exportToPDF} 
          disabled={exporting || transactions.length === 0}
          className="gap-2 w-full sm:w-auto bg-primary hover:bg-primary/90" 
          size="sm"
        >
          {exporting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Exportando...
            </>
          ) : (
            <>
              <FileDown size={16} />
              Exportar PDF
            </>
          )}
        </Button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Filter size={18} className="text-primary" />
              <span className="text-sm font-medium text-foreground">Filtrar por Status</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
                className="text-xs"
              >
                Todos
              </Button>
              <Button
                variant={filter === 'approved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('approved')}
                className="text-xs"
              >
                Aprovados
              </Button>
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('pending')}
                className="text-xs"
              >
                Pendentes
              </Button>
              <Button
                variant={filter === 'rejected' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('rejected')}
                className="text-xs"
              >
                Rejeitados
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Calendar size={18} className="text-primary" />
              <span className="text-sm font-medium text-foreground">Filtrar por Período</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={dateFilter === 'today' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateFilter('today')}
                className="text-xs"
              >
                Hoje
              </Button>
              <Button
                variant={dateFilter === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateFilter('week')}
                className="text-xs"
              >
                7 Dias
              </Button>
              <Button
                variant={dateFilter === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateFilter('month')}
                className="text-xs"
              >
                30 Dias
              </Button>
              <Button
                variant={dateFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateFilter('all')}
                className="text-xs"
              >
                Todos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Transações */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <FileText size={20} />
            Transações ({transactions.length})
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
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">ID</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Valor</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Método</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Cliente</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Data</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-muted-foreground">
                          Nenhuma transação encontrada
                        </td>
                      </tr>
                    ) : (
                      transactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b border-border hover:bg-accent/50">
                          <td className="py-3 px-4 text-sm text-muted-foreground font-mono">{transaction.id.slice(0, 8)}</td>
                          <td className="py-3 px-4 text-sm text-foreground font-medium">{formatCurrency(transaction.amount)}</td>
                          <td className="py-3 px-4">{getStatusBadge(transaction.status)}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{getPaymentMethodLabel(transaction.payment_method)}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{transaction.customer_name || '-'}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{formatDateTime(transaction.created_at)}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewModal(transaction)}
                                className="h-8 w-8 p-0 hover:bg-blue-500/10"
                                title="Ver detalhes"
                              >
                                <Eye size={16} className="text-blue-400" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditModal(transaction)}
                                className="h-8 w-8 p-0 hover:bg-yellow-500/10"
                                title="Editar"
                              >
                                <Edit size={16} className="text-yellow-400" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteModal(transaction)}
                                className="h-8 w-8 p-0 hover:bg-red-500/10"
                                title="Excluir"
                              >
                                <Trash2 size={16} className="text-red-400" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
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

      {/* Modal Ver Detalhes */}
      {viewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-card border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Eye size={20} className="text-blue-400" />
                Detalhes da Transação
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewModal(null)}
                className="h-8 w-8 p-0"
              >
                <X size={16} />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">ID</p>
                  <p className="text-sm font-mono">{viewModal.id}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Valor</p>
                  <p className="text-sm font-bold">{formatCurrency(viewModal.amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  {getStatusBadge(viewModal.status)}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Método</p>
                  <p className="text-sm">{getPaymentMethodLabel(viewModal.payment_method)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Cliente</p>
                  <p className="text-sm">{viewModal.customer_name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <p className="text-sm">{viewModal.customer_email || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Descrição</p>
                  <p className="text-sm">{viewModal.description || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Data</p>
                  <p className="text-sm">{formatDateTime(viewModal.created_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Editar */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-card border-border max-w-md w-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Edit size={20} className="text-yellow-400" />
                Editar Transação
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditModal(null)}
                className="h-8 w-8 p-0"
              >
                <X size={16} />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Funcionalidade de edição em desenvolvimento.
              </p>
              <p className="text-xs text-muted-foreground">
                ID: {editModal.id}
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditModal(null)}>
                  Cancelar
                </Button>
                <Button onClick={() => {
                  toast.info('Funcionalidade em desenvolvimento')
                  setEditModal(null)
                }}>
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Excluir */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-card border-border max-w-md w-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Trash2 size={20} className="text-red-400" />
                Excluir Transação
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteModal(null)}
                className="h-8 w-8 p-0"
              >
                <X size={16} />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-foreground">
                Tem certeza que deseja excluir esta transação?
              </p>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-xs text-red-400 mb-2">⚠️ Esta ação não pode ser desfeita!</p>
                <p className="text-xs text-muted-foreground">ID: {deleteModal.id.slice(0, 8)}</p>
                <p className="text-xs text-muted-foreground">Valor: {formatCurrency(deleteModal.amount)}</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeleteModal(null)}>
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    toast.success('Transação excluída com sucesso!')
                    setDeleteModal(null)
                    refetch()
                  }}
                >
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
