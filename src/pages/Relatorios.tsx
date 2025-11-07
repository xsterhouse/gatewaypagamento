import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Download, Filter, Loader2 } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import { useTransactions } from '@/hooks/useTransactions'
import { usePagination } from '@/hooks/usePagination'
import { toast } from 'sonner'

export function Relatorios() {
  const [filter, setFilter] = useState<string>('all')
  const { currentPage, pageSize, offset, goToPage, getTotalPages } = usePagination(1, 10)
  const { transactions, loading, error, total } = useTransactions({ 
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

  const exportToCSV = () => {
    const headers = ['ID', 'Valor', 'Status', 'Método', 'Cliente', 'Email', 'Data']
    const rows = transactions.map(t => [
      t.id,
      t.amount,
      t.status,
      t.payment_method,
      t.customer_name || '-',
      t.customer_email || '-',
      formatDateTime(t.created_at)
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-transacoes-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">Visualize e exporte relatórios de transações</p>
        </div>
        <Button onClick={exportToCSV} className="gap-2 w-full sm:w-auto" size="sm">
          <Download size={16} />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Filter size={20} className="text-muted-foreground" />
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Todos
              </Button>
              <Button
                variant={filter === 'approved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('approved')}
              >
                Aprovados
              </Button>
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('pending')}
              >
                Pendentes
              </Button>
              <Button
                variant={filter === 'rejected' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('rejected')}
              >
                Rejeitados
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-muted-foreground">
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
    </div>
  )
}
