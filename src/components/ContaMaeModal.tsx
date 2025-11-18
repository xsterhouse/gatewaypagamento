import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { 
  DollarSign, Search, RefreshCw, TrendingUp, 
  User, FileText, ArrowUpDown, Download
} from 'lucide-react'

interface WalletTransaction {
  id: string
  wallet_id: string
  user_id: string
  user_name: string
  user_email: string
  transaction_type: 'credit' | 'debit'
  amount: number
  balance_before: number
  balance_after: number
  description: string
  created_at: string
  reference_type?: string
  reference_id?: string
}

interface ContaMaeStats {
  totalBalance: number
  totalCredits: number
  totalDebits: number
  transactionsCount: number
  todayCredits: number
  weekCredits: number
  monthCredits: number
}

interface ContaMaeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContaMaeModal({ open, onOpenChange }: ContaMaeModalProps) {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [stats, setStats] = useState<ContaMaeStats>({
    totalBalance: 0,
    totalCredits: 0,
    totalDebits: 0,
    transactionsCount: 0,
    todayCredits: 0,
    weekCredits: 0,
    monthCredits: 0
  })

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  const loadData = async () => {
    try {
      setLoading(true)

      // Buscar carteira da Conta Mãe
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('id, balance, available_balance')
        .eq('wallet_name', 'Conta Mãe - Taxas Gateway')
        .single()

      if (walletError) throw walletError

      // Buscar transações da carteira
      const { data: transData, error: transError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', wallet.id)
        .order('created_at', { ascending: false })
        .limit(500)

      if (transError) throw transError

      // Buscar usuários únicos
      const userIds = [...new Set(transData?.map(t => t.user_id).filter(Boolean))]
      let usersMap = new Map()
      
      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', userIds)
        
        usersData?.forEach(user => {
          usersMap.set(user.id, { name: user.name, email: user.email })
        })
      }

      const formattedTrans = (transData || []).map(t => {
        const user = usersMap.get(t.user_id)
        return {
          id: t.id,
          wallet_id: t.wallet_id,
          user_id: t.user_id,
          user_name: user?.name || 'Sistema',
          user_email: user?.email || '',
          transaction_type: t.transaction_type,
          amount: Number(t.amount),
          balance_before: Number(t.balance_before),
          balance_after: Number(t.balance_after),
          description: t.description || '',
          created_at: t.created_at,
          reference_type: t.reference_type,
          reference_id: t.reference_id
        }
      })

      setTransactions(formattedTrans)

      // Calcular estatísticas
      const now = new Date()
      const todayStart = new Date(now.setHours(0, 0, 0, 0))
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const credits = formattedTrans.filter(t => t.transaction_type === 'credit')
      const debits = formattedTrans.filter(t => t.transaction_type === 'debit')
      const todayCredits = credits.filter(t => new Date(t.created_at) >= todayStart)
      const weekCredits = credits.filter(t => new Date(t.created_at) >= weekStart)
      const monthCredits = credits.filter(t => new Date(t.created_at) >= monthStart)

      setStats({
        totalBalance: wallet.balance,
        totalCredits: credits.reduce((sum, t) => sum + t.amount, 0),
        totalDebits: debits.reduce((sum, t) => sum + t.amount, 0),
        transactionsCount: formattedTrans.length,
        todayCredits: todayCredits.reduce((sum, t) => sum + t.amount, 0),
        weekCredits: weekCredits.reduce((sum, t) => sum + t.amount, 0),
        monthCredits: monthCredits.reduce((sum, t) => sum + t.amount, 0)
      })
    } catch (error: any) {
      console.error('Erro ao carregar dados da Conta Mãe:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    const csv = [
      ['Data', 'Usuário', 'Email', 'Tipo', 'Valor', 'Saldo Anterior', 'Saldo Posterior', 'Descrição'].join(','),
      ...filteredTransactions.map(t => [
        new Date(t.created_at).toLocaleString('pt-BR'),
        t.user_name,
        t.user_email,
        t.transaction_type === 'credit' ? 'Crédito' : 'Débito',
        `R$ ${t.amount.toFixed(2)}`,
        `R$ ${t.balance_before.toFixed(2)}`,
        `R$ ${t.balance_after.toFixed(2)}`,
        t.description
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `conta_mae_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    toast.success('Exportado com sucesso!')
  }

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === 'all' || t.transaction_type === filterType

    let matchesDate = true
    if (dateFilter !== 'all') {
      const transDate = new Date(t.created_at)
      const now = new Date()
      
      if (dateFilter === 'today') {
        matchesDate = transDate.toDateString() === now.toDateString()
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        matchesDate = transDate >= weekAgo
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        matchesDate = transDate >= monthAgo
      }
    }

    return matchesSearch && matchesType && matchesDate
  }).sort((a, b) => {
    const dateA = new Date(a.created_at).getTime()
    const dateB = new Date(b.created_at).getTime()
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <DollarSign className="text-primary" />
            Conta Mãe - Taxas Gateway
          </DialogTitle>
        </DialogHeader>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 p-4 rounded-lg">
            <p className="text-xs text-muted-foreground">Saldo Total</p>
            <p className="text-2xl font-bold text-blue-500">{formatCurrency(stats.totalBalance)}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30 p-4 rounded-lg">
            <p className="text-xs text-muted-foreground">Total Créditos</p>
            <p className="text-xl font-bold text-green-500">{formatCurrency(stats.totalCredits)}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30 p-4 rounded-lg">
            <p className="text-xs text-muted-foreground">Hoje</p>
            <p className="text-xl font-bold text-purple-500">{formatCurrency(stats.todayCredits)}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/30 p-4 rounded-lg">
            <p className="text-xs text-muted-foreground">Este Mês</p>
            <p className="text-xl font-bold text-orange-500">{formatCurrency(stats.monthCredits)}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="space-y-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Buscar por usuário ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={loadData} variant="outline" size="sm" disabled={loading}>
                <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
              </Button>
              <Button onClick={handleExport} variant="outline" size="sm">
                <Download size={16} />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1">
              <Button
                onClick={() => setFilterType('all')}
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
              >
                Todas
              </Button>
              <Button
                onClick={() => setFilterType('credit')}
                variant={filterType === 'credit' ? 'default' : 'outline'}
                size="sm"
                className={filterType === 'credit' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                <TrendingUp size={14} className="mr-1" />
                Créditos
              </Button>
              <Button
                onClick={() => setFilterType('debit')}
                variant={filterType === 'debit' ? 'default' : 'outline'}
                size="sm"
                className={filterType === 'debit' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                Débito
              </Button>
            </div>

            <div className="flex gap-1">
              <Button
                onClick={() => setDateFilter('all')}
                variant={dateFilter === 'all' ? 'default' : 'outline'}
                size="sm"
              >
                Todo Período
              </Button>
              <Button
                onClick={() => setDateFilter('today')}
                variant={dateFilter === 'today' ? 'default' : 'outline'}
                size="sm"
              >
                Hoje
              </Button>
              <Button
                onClick={() => setDateFilter('week')}
                variant={dateFilter === 'week' ? 'default' : 'outline'}
                size="sm"
              >
                7 dias
              </Button>
              <Button
                onClick={() => setDateFilter('month')}
                variant={dateFilter === 'month' ? 'default' : 'outline'}
                size="sm"
              >
                30 dias
              </Button>
            </div>

            <Button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <ArrowUpDown size={14} />
              {sortOrder === 'desc' ? 'Mais recentes' : 'Mais antigas'}
            </Button>
          </div>
        </div>

        {/* Tabela de Transações */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full">
              <thead className="bg-muted sticky top-0">
                <tr className="text-left text-xs">
                  <th className="p-3 font-medium">Data/Hora</th>
                  <th className="p-3 font-medium">Usuário</th>
                  <th className="p-3 font-medium">Tipo</th>
                  <th className="p-3 font-medium">Valor</th>
                  <th className="p-3 font-medium">Saldo Anterior</th>
                  <th className="p-3 font-medium">Saldo Posterior</th>
                  <th className="p-3 font-medium">Descrição</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-muted-foreground">
                      <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                      Carregando...
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-muted-foreground">
                      Nenhuma transação encontrada
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-t hover:bg-muted/50">
                      <td className="p-3 text-sm">
                        {new Date(transaction.created_at).toLocaleDateString('pt-BR')}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{transaction.user_name}</p>
                            {transaction.user_email && (
                              <p className="text-xs text-muted-foreground">{transaction.user_email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge className={
                          transaction.transaction_type === 'credit' 
                            ? 'bg-green-500/10 text-green-500 border-green-500/30' 
                            : 'bg-red-500/10 text-red-500 border-red-500/30'
                        }>
                          {transaction.transaction_type === 'credit' ? 'Crédito' : 'Débito'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span className={`font-bold ${
                          transaction.transaction_type === 'credit' ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {transaction.transaction_type === 'credit' ? '+' : '-'} {formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {formatCurrency(transaction.balance_before)}
                      </td>
                      <td className="p-3 text-sm font-medium">
                        {formatCurrency(transaction.balance_after)}
                      </td>
                      <td className="p-3 text-sm text-muted-foreground max-w-xs truncate">
                        <div className="flex items-start gap-1">
                          <FileText size={14} className="mt-0.5 flex-shrink-0" />
                          <span>{transaction.description}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-between items-center text-sm text-muted-foreground pt-2">
          <span>{filteredTransactions.length} transações encontradas</span>
          <span>Total exibido: {formatCurrency(filteredTransactions.reduce((sum, t) => sum + (t.transaction_type === 'credit' ? t.amount : 0), 0))}</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
