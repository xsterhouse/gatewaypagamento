import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { Download, Upload, CheckCircle, Clock, XCircle, DollarSign } from 'lucide-react'

interface DepositWithUser {
  id: string
  user_id: string
  amount: number
  method: string
  status: string
  created_at: string
  processed_at: string | null
  user_name: string
  user_email: string
}

interface WithdrawalWithUser {
  id: string
  user_id: string
  amount: number
  method: string
  status: string
  fee: number
  net_amount: number
  created_at: string
  processed_at: string | null
  user_name: string
  user_email: string
}

export function AdminDeposits() {
  const [deposits, setDeposits] = useState<DepositWithUser[]>([])
  const [withdrawals, setWithdrawals] = useState<WithdrawalWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'deposits' | 'withdrawals'>('deposits')
  const [stats, setStats] = useState({
    total_deposits: 0,
    pending_deposits: 0,
    total_withdrawals: 0,
    pending_withdrawals: 0,
    deposits_amount: 0,
    withdrawals_amount: 0
  })

  useEffect(() => {
    loadData()
    loadStats()
  }, [])

  const loadData = async () => {
    try {
      // Carregar depósitos
      const { data: depositsData, error: depositsError } = await supabase
        .from('deposits')
        .select(`
          *,
          users (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (depositsError) throw depositsError

      const depositsWithUser = depositsData?.map(deposit => ({
        ...deposit,
        user_name: deposit.users?.name || 'N/A',
        user_email: deposit.users?.email || 'N/A'
      })) || []

      setDeposits(depositsWithUser)

      // Carregar saques
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select(`
          *,
          users (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (withdrawalsError) throw withdrawalsError

      const withdrawalsWithUser = withdrawalsData?.map(withdrawal => ({
        ...withdrawal,
        user_name: withdrawal.users?.name || 'N/A',
        user_email: withdrawal.users?.email || 'N/A'
      })) || []

      setWithdrawals(withdrawalsWithUser)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const { count: total_deposits } = await supabase
        .from('deposits')
        .select('*', { count: 'exact', head: true })

      const { count: pending_deposits } = await supabase
        .from('deposits')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      const { data: allDeposits } = await supabase
        .from('deposits')
        .select('amount')

      const deposits_amount = allDeposits?.reduce((acc, d) => acc + Number(d.amount), 0) || 0

      const { count: total_withdrawals } = await supabase
        .from('withdrawals')
        .select('*', { count: 'exact', head: true })

      const { count: pending_withdrawals } = await supabase
        .from('withdrawals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      const { data: allWithdrawals } = await supabase
        .from('withdrawals')
        .select('amount')

      const withdrawals_amount = allWithdrawals?.reduce((acc, w) => acc + Number(w.amount), 0) || 0

      setStats({
        total_deposits: total_deposits || 0,
        pending_deposits: pending_deposits || 0,
        total_withdrawals: total_withdrawals || 0,
        pending_withdrawals: pending_withdrawals || 0,
        deposits_amount,
        withdrawals_amount
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'Pendente', variant: 'secondary' },
      approved: { label: 'Aprovado', variant: 'default' },
      rejected: { label: 'Rejeitado', variant: 'destructive' },
    }

    const { label, variant } = statusMap[status] || { label: status, variant: 'outline' }
    return <Badge variant={variant}>{label}</Badge>
  }

  const approveDeposit = async (depositId: string) => {
    try {
      const { error } = await supabase
        .from('deposits')
        .update({ status: 'approved', processed_at: new Date().toISOString() })
        .eq('id', depositId)

      if (error) throw error
      alert('Depósito aprovado com sucesso!')
      loadData()
      loadStats()
    } catch (error) {
      console.error('Erro ao aprovar depósito:', error)
      alert('Erro ao aprovar depósito')
    }
  }

  const rejectDeposit = async (depositId: string) => {
    try {
      const { error } = await supabase
        .from('deposits')
        .update({ status: 'rejected', processed_at: new Date().toISOString() })
        .eq('id', depositId)

      if (error) throw error
      alert('Depósito rejeitado!')
      loadData()
      loadStats()
    } catch (error) {
      console.error('Erro ao rejeitar depósito:', error)
      alert('Erro ao rejeitar depósito')
    }
  }

  const approveWithdrawal = async (withdrawalId: string) => {
    try {
      const { error } = await supabase
        .from('withdrawals')
        .update({ status: 'approved', processed_at: new Date().toISOString() })
        .eq('id', withdrawalId)

      if (error) throw error
      alert('Saque aprovado com sucesso!')
      loadData()
      loadStats()
    } catch (error) {
      console.error('Erro ao aprovar saque:', error)
      alert('Erro ao aprovar saque')
    }
  }

  const rejectWithdrawal = async (withdrawalId: string) => {
    try {
      const { error } = await supabase
        .from('withdrawals')
        .update({ status: 'rejected', processed_at: new Date().toISOString() })
        .eq('id', withdrawalId)

      if (error) throw error
      alert('Saque rejeitado!')
      loadData()
      loadStats()
    } catch (error) {
      console.error('Erro ao rejeitar saque:', error)
      alert('Erro ao rejeitar saque')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando dados...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Depósitos & Saques</h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1">Gerencie todas as operações financeiras</p>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Depósitos</CardTitle>
            <Download className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{stats.total_deposits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-yellow-600">{stats.pending_deposits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0
              }).format(stats.deposits_amount)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Saques</CardTitle>
            <Upload className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{stats.total_withdrawals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-yellow-600">{stats.pending_withdrawals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-red-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0
              }).format(stats.withdrawals_amount)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <CardHeader>
          <div className="flex gap-2">
            <Button 
              variant={activeTab === 'deposits' ? 'default' : 'outline'}
              onClick={() => setActiveTab('deposits')}
            >
              <Download className="h-4 w-4 mr-2" />
              Depósitos
            </Button>
            <Button 
              variant={activeTab === 'withdrawals' ? 'default' : 'outline'}
              onClick={() => setActiveTab('withdrawals')}
            >
              <Upload className="h-4 w-4 mr-2" />
              Saques
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Conteúdo */}
      {activeTab === 'deposits' ? (
        <Card>
          <CardHeader>
            <CardTitle>Depósitos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deposits.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum depósito encontrado
                </div>
              ) : (
                deposits.map((deposit) => (
                  <div
                    key={deposit.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-green-100 rounded-full">
                        <Download className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold">{deposit.user_name}</p>
                        <p className="text-sm text-gray-500">{deposit.user_email}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(deposit.created_at).toLocaleString('pt-BR')} • {deposit.method.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="text-xl font-bold text-green-600">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(Number(deposit.amount))}
                      </p>
                      {getStatusBadge(deposit.status)}
                      {deposit.status === 'pending' && (
                        <div className="flex gap-2 mt-2">
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={() => approveDeposit(deposit.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => rejectDeposit(deposit.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Saques Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {withdrawals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum saque encontrado
                </div>
              ) : (
                withdrawals.map((withdrawal) => (
                  <div
                    key={withdrawal.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-red-100 rounded-full">
                        <Upload className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-semibold">{withdrawal.user_name}</p>
                        <p className="text-sm text-gray-500">{withdrawal.user_email}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(withdrawal.created_at).toLocaleString('pt-BR')} • {withdrawal.method.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="text-xl font-bold text-red-600">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(Number(withdrawal.amount))}
                      </p>
                      <p className="text-xs text-gray-500">
                        Taxa: {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(Number(withdrawal.fee))} • Líquido: {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(Number(withdrawal.net_amount))}
                      </p>
                      {getStatusBadge(withdrawal.status)}
                      {withdrawal.status === 'pending' && (
                        <div className="flex gap-2 mt-2">
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={() => approveWithdrawal(withdrawal.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => rejectWithdrawal(withdrawal.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
