import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { 
  TrendingUp, 
  TrendingDown, 
  Lock, 
  Unlock,
  Search
} from 'lucide-react'

interface Transaction {
  id: string
  user_id: string
  user_name: string
  user_email: string
  type: string
  amount: number
  status: string
  description: string
  created_at: string
}

interface BalanceLock {
  id: string
  user_id: string
  user_name: string
  amount: number
  reason: string
  lock_type: string
  locked_at: string
  status: string
}

export function TransactionsManagement() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [locks, setLocks] = useState<BalanceLock[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Carregar transações
      const { data: transData, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (transError) {
        console.error('Erro ao carregar transações:', transError)
        throw transError
      }

      // Buscar nomes de usuários
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
          user_id: t.user_id,
          user_name: user?.name || 'Desconhecido',
          user_email: user?.email || '',
          type: t.type,
          amount: t.amount,
          status: t.status,
          description: t.description || '',
          created_at: t.created_at,
        }
      })

      setTransactions(formattedTrans)

      // Carregar bloqueios ativos
      const { data: locksData, error: locksError } = await supabase
        .from('balance_locks')
        .select('*')
        .eq('status', 'active')
        .order('locked_at', { ascending: false })

      if (locksError) {
        console.error('Erro ao carregar bloqueios:', locksError)
        // Não throw error aqui, deixa continuar sem bloqueios
      }

      if (locksData && locksData.length > 0) {
        const lockUserIds = [...new Set(locksData.map(l => l.user_id).filter(Boolean))]
        let lockUsersMap = new Map()
        
        if (lockUserIds.length > 0) {
          const { data: lockUsersData } = await supabase
            .from('users')
            .select('id, name')
            .in('id', lockUserIds)
          
          lockUsersData?.forEach(user => {
            lockUsersMap.set(user.id, user.name)
          })
        }

        const formattedLocks = locksData.map(l => ({
          id: l.id,
          user_id: l.user_id,
          user_name: lockUsersMap.get(l.user_id) || 'Desconhecido',
          amount: l.amount,
          reason: l.reason,
          lock_type: l.lock_type,
          locked_at: l.locked_at,
          status: l.status,
        }))

        setLocks(formattedLocks)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }


  const handleUnlockBalance = async (lockId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Não autenticado')

      const { error } = await supabase
        .from('balance_locks')
        .update({
          status: 'released',
          unlocked_at: new Date().toISOString(),
          unlocked_by: session.user.id,
        })
        .eq('id', lockId)

      if (error) throw error

      toast.success('Saldo desbloqueado!')
      loadData()
    } catch (error) {
      console.error('Erro ao desbloquear:', error)
      toast.error('Erro ao desbloquear saldo')
    }
  }

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === 'all' || t.type === filterType

    return matchesSearch && matchesType
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="text-green-500 text-xs">✓ Concluída</span>
      case 'pending':
        return <span className="text-yellow-500 text-xs">⏳ Pendente</span>
      case 'failed':
        return <span className="text-red-500 text-xs">✗ Falhou</span>
      default:
        return <span className="text-muted-foreground text-xs">{status}</span>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Gerenciamento de Transações</h1>
        <p className="text-muted-foreground">Visualize e gerencie todas as transações do sistema</p>
      </div>

      {/* Bloqueios Ativos */}
      {locks.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Lock className="text-yellow-500" size={24} />
              Saldos Bloqueados ({locks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {locks.map((lock) => (
                <div
                  key={lock.id}
                  className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
                >
                  <div>
                    <p className="text-foreground font-medium">{lock.user_name}</p>
                    <p className="text-yellow-300 text-sm">
                      R$ {lock.amount.toFixed(2)} bloqueado
                    </p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Motivo: {lock.reason} ({lock.lock_type.toUpperCase()})
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(lock.locked_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleUnlockBalance(lock.id)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Unlock size={16} className="mr-2" />
                    Desbloquear
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
              <Input
                placeholder="Buscar por nome, email ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-input border-border text-foreground pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setFilterType('all')}
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
                className={filterType === 'all' ? 'bg-primary' : 'border-border'}
              >
                Todas
              </Button>
              <Button
                onClick={() => setFilterType('credit')}
                variant={filterType === 'credit' ? 'default' : 'outline'}
                size="sm"
                className={filterType === 'credit' ? 'bg-green-600' : 'border-border'}
              >
                Crédito
              </Button>
              <Button
                onClick={() => setFilterType('debit')}
                variant={filterType === 'debit' ? 'default' : 'outline'}
                size="sm"
                className={filterType === 'debit' ? 'bg-red-600' : 'border-border'}
              >
                Débito
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Transações */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">
            Transações ({filteredTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTransactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhuma transação encontrada</p>
            ) : (
              filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-input/50 rounded-lg hover:bg-input transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-3 rounded-lg ${
                      transaction.type === 'credit' 
                        ? 'bg-green-500/10' 
                        : 'bg-red-500/10'
                    }`}>
                      {transaction.type === 'credit' ? (
                        <TrendingUp className="text-green-500" size={24} />
                      ) : (
                        <TrendingDown className="text-red-500" size={24} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground font-medium">{transaction.user_name}</p>
                      <p className="text-muted-foreground text-sm">{transaction.user_email}</p>
                      {transaction.description && (
                        <p className="text-muted-foreground text-xs mt-1">{transaction.description}</p>
                      )}
                      <p className="text-muted-foreground text-xs">
                        {new Date(transaction.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      transaction.type === 'credit' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {transaction.type === 'credit' ? '+' : '-'} R$ {transaction.amount.toFixed(2)}
                    </p>
                    {getStatusBadge(transaction.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
