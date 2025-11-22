import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useImpersonation } from '@/contexts/ImpersonationContext'
import { 
  Users, 
  DollarSign, 
  Ban, 
  Trash2,
  CheckCircle,
  Search,
  Plus,
  Minus,
  Lock,
  Unlock,
  LogIn,
  TrendingUp,
  AlertCircle
} from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  balance: number
  status: 'active' | 'suspended' | 'blocked'
  role: string
  kyc_status: string
  created_at: string
  suspension_reason?: string
}

export function AdminPanel() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingBalance, setEditingBalance] = useState<{ [key: string]: string }>({})
  const [suspensionReason, setSuspensionReason] = useState<{ [key: string]: string }>({})
  const [lockModalOpen, setLockModalOpen] = useState<string | null>(null)
  const [lockAmount, setLockAmount] = useState('')
  const [lockReason, setLockReason] = useState('')
  const [lockType, setLockType] = useState('med')
  const { impersonateUser } = useImpersonation()

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm])

  const loadUsers = async () => {
    try {
      console.log('📋 Carregando apenas CLIENTES (excluindo admin e manager)...')
      
      const { data: usersData, error } = await supabase
        .from('users')
        .select('*')
        .not('role', 'in', '("admin", "manager")')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      console.log('✅ Clientes carregados:', usersData?.length || 0)
      
      // Buscar saldos das carteiras BRL para cada usuário
      const usersWithBalance = await Promise.all(
        (usersData || []).map(async (user) => {
          const { data: wallet } = await supabase
            .from('wallets')
            .select('available_balance, balance')
            .eq('user_id', user.id)
            .eq('currency_code', 'BRL')
            .eq('is_active', true)
            .maybeSingle()
          
          return {
            ...user,
            balance: wallet?.available_balance || 0
          }
        })
      )
      
      console.log('✅ Saldos carregados para', usersWithBalance.length, 'usuários')
      setUsers(usersWithBalance)
    } catch (error) {
      console.error('❌ Erro ao carregar clientes:', error)
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    if (!searchTerm) {
      setFilteredUsers(users)
      return
    }

    const filtered = users.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredUsers(filtered)
  }

  const updateBalance = async (userId: string, newBalance: number) => {
    try {
      // Atualizar o saldo na carteira BRL do usuário
      const { error } = await supabase
        .from('wallets')
        .update({ 
          available_balance: newBalance,
          balance: newBalance 
        })
        .eq('user_id', userId)
        .eq('currency_code', 'BRL')
        .eq('is_active', true)

      if (error) throw error

      toast.success('Saldo atualizado com sucesso!')
      loadUsers()
      setEditingBalance({ ...editingBalance, [userId]: '' })
    } catch (error) {
      console.error('Erro ao atualizar saldo:', error)
      toast.error('Erro ao atualizar saldo')
    }
  }

  const addBalance = async (userId: string, amount: number) => {
    const user = users.find(u => u.id === userId)
    if (!user) return

    const newBalance = Number(user.balance || 0) + amount
    await updateBalance(userId, newBalance)
  }

  const removeBalance = async (userId: string, amount: number) => {
    const user = users.find(u => u.id === userId)
    if (!user) return

    const newBalance = Math.max(0, Number(user.balance || 0) - amount)
    await updateBalance(userId, newBalance)
  }

  const suspendUser = async (userId: string) => {
    const reason = suspensionReason[userId]
    if (!reason) {
      toast.error('Digite o motivo da suspensão')
      return
    }

    try {
      const adminStr = localStorage.getItem('user')
      if (!adminStr) return

      const { error} = await supabase
        .from('users')
        .update({
          status: 'suspended',
          suspended_at: new Date().toISOString(),
          suspension_reason: reason,
        })
        .eq('id', userId)

      if (error) throw error

      toast.success('Usuário suspenso')
      setSuspensionReason({ ...suspensionReason, [userId]: '' })
      loadUsers()
    } catch (error) {
      toast.error('Erro ao suspender usuário')
    }
  }

  const activateUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          status: 'active',
          suspended_at: null,
          suspension_reason: null,
        })
        .eq('id', userId)

      if (error) throw error

      toast.success('Usuário ativado')
      loadUsers()
    } catch (error) {
      toast.error('Erro ao ativar usuário')
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) throw error

      toast.success('Usuário excluído')
      loadUsers()
    } catch (error) {
      toast.error('Erro ao excluir usuário')
    }
  }

  const handleLockBalance = async (userId: string) => {
    if (!lockAmount || !lockReason) {
      toast.error('Preencha o valor e o motivo do bloqueio')
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Não autenticado')

      const { error } = await supabase
        .from('balance_locks')
        .insert({
          user_id: userId,
          amount: parseFloat(lockAmount),
          reason: lockReason,
          lock_type: lockType,
          locked_by: session.user.id,
        })

      if (error) throw error

      toast.success('Saldo bloqueado com sucesso!')
      setLockModalOpen(null)
      setLockAmount('')
      setLockReason('')
      setLockType('med')
      loadUsers()
    } catch (error) {
      console.error('Erro ao bloquear saldo:', error)
      toast.error('Erro ao bloquear saldo')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium">
            <CheckCircle size={14} />
            Ativo
          </span>
        )
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-medium">
            <Ban size={14} />
            Suspenso
          </span>
        )
      case 'blocked':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-medium">
            <Lock size={14} />
            Bloqueado
          </span>
        )
    }
  }

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    totalBalance: users.reduce((sum, u) => sum + Number(u.balance), 0),
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Moderno */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Gestão de Usuários</h1>
          <p className="text-sm text-muted-foreground mt-1">Controle total sobre contas e saldos</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg">
          <TrendingUp className="text-primary" size={18} />
          <span className="text-sm font-medium text-primary">{stats.total} Clientes</span>
        </div>
      </div>

      {/* Stats Cards Modernos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="group relative overflow-hidden bg-gradient-to-br from-card to-card/50 border border-border rounded-xl p-5 hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="text-blue-500" size={20} />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Total</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground mt-1">Usuários cadastrados</p>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-gradient-to-br from-card to-card/50 border border-border rounded-xl p-5 hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="text-green-500" size={20} />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Ativos</span>
            </div>
            <p className="text-3xl font-bold text-green-500">{stats.active}</p>
            <p className="text-xs text-muted-foreground mt-1">Contas ativas</p>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-gradient-to-br from-card to-card/50 border border-border rounded-xl p-5 hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <AlertCircle className="text-yellow-500" size={20} />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Suspensos</span>
            </div>
            <p className="text-3xl font-bold text-yellow-500">{stats.suspended}</p>
            <p className="text-xs text-muted-foreground mt-1">Contas suspensas</p>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-gradient-to-br from-card to-card/50 border border-border rounded-xl p-5 hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="text-primary" size={20} />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Volume</span>
            </div>
            <p className="text-2xl font-bold text-primary">R$ {stats.totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-muted-foreground mt-1">Saldo total em custódia</p>
          </div>
        </div>
      </div>

      {/* Search Bar Moderno */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
        <Input
          placeholder="Buscar usuário por nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 h-12 bg-card border-border text-foreground rounded-xl shadow-sm focus:ring-2 focus:ring-primary/20 transition-all"
        />
        {searchTerm && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {filteredUsers.length} resultado{filteredUsers.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Users List - Design Moderno */}
      <div className="space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Users className="mx-auto text-muted-foreground mb-3" size={48} />
            <p className="text-muted-foreground">Nenhum usuário encontrado</p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user.id} className="group bg-gradient-to-br from-card to-card/50 border border-border rounded-xl overflow-hidden hover:shadow-xl hover:border-primary/20 transition-all duration-300">
              {/* Header do Card */}
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{user.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
                {getStatusBadge(user.status)}
              </div>

              {/* Conteúdo do Card */}
              <div className="p-4 space-y-4">
                {/* Saldo - Design Compacto */}
                <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/10 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Saldo Disponível</p>
                    <p className="text-xl font-bold text-primary">
                      R$ {Number(user.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Valor"
                      value={editingBalance[user.id] || ''}
                      onChange={(e) => setEditingBalance({
                        ...editingBalance,
                        [user.id]: e.target.value
                      })}
                      className="w-24 h-9 bg-background border-border text-foreground text-sm"
                    />
                    <Button
                      onClick={() => {
                        const amount = parseFloat(editingBalance[user.id] || '0')
                        if (amount > 0) addBalance(user.id, amount)
                      }}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 h-9 w-9 p-0 shadow-sm"
                      title="Adicionar saldo"
                    >
                      <Plus size={16} />
                    </Button>
                    <Button
                      onClick={() => {
                        const amount = parseFloat(editingBalance[user.id] || '0')
                        if (amount > 0) removeBalance(user.id, amount)
                      }}
                      size="sm"
                      variant="outline"
                      className="border-red-500 text-red-500 hover:bg-red-500/10 h-9 w-9 p-0"
                      title="Remover saldo"
                    >
                      <Minus size={16} />
                    </Button>
                  </div>
                </div>

                {/* Ações Rápidas */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Button
                    onClick={async () => {
                      try {
                        await impersonateUser(user.id)
                        toast.success(`Logado como ${user.name}`)
                      } catch (error) {
                        toast.error('Erro ao logar como cliente')
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="border-blue-500/50 text-blue-500 hover:bg-blue-500/10 h-9"
                  >
                    <LogIn size={14} className="mr-2" />
                    <span className="text-xs">Acessar</span>
                  </Button>

                  <Button
                    onClick={() => setLockModalOpen(user.id)}
                    variant="outline"
                    size="sm"
                    className="border-orange-500/50 text-orange-500 hover:bg-orange-500/10 h-9"
                  >
                    <Lock size={14} className="mr-2" />
                    <span className="text-xs">MED</span>
                  </Button>

                  {user.status === 'active' ? (
                    <Button
                      onClick={() => {
                        const reason = prompt('Digite o motivo da suspensão:')
                        if (reason) {
                          setSuspensionReason({ ...suspensionReason, [user.id]: reason })
                          suspendUser(user.id)
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 h-9"
                    >
                      <Ban size={14} className="mr-2" />
                      <span className="text-xs">Suspender</span>
                    </Button>
                  ) : (
                    <Button
                      onClick={() => activateUser(user.id)}
                      variant="outline"
                      size="sm"
                      className="border-green-500/50 text-green-500 hover:bg-green-500/10 h-9"
                    >
                      <Unlock size={14} className="mr-2" />
                      <span className="text-xs">Ativar</span>
                    </Button>
                  )}

                  <Button
                    onClick={() => deleteUser(user.id)}
                    variant="outline"
                    size="sm"
                    className="border-red-500/50 text-red-500 hover:bg-red-500/10 h-9"
                  >
                    <Trash2 size={14} className="mr-2" />
                    <span className="text-xs">Excluir</span>
                  </Button>
                </div>

                {/* Motivo de Suspensão */}
                {user.suspension_reason && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <AlertCircle className="text-yellow-500 flex-shrink-0 mt-0.5" size={16} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-yellow-500 mb-1">Motivo da Suspensão</p>
                      <p className="text-xs text-yellow-200/80">{user.suspension_reason}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Bloqueio de Saldo */}
      {lockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-md bg-[#1a1f2e] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Lock className="text-orange-500" size={24} />
                Bloquear Saldo - MED
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                <p className="text-orange-200 text-sm">
                  ⚠️ Esta ação bloqueará parte do saldo do usuário por medida judicial (MED).
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-white text-sm mb-2 block">Valor a Bloquear (R$)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={lockAmount}
                    onChange={(e) => setLockAmount(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-white text-sm mb-2 block">Tipo de Bloqueio</label>
                  <select
                    value={lockType}
                    onChange={(e) => setLockType(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2"
                  >
                    <option value="med">MED - Medida Judicial</option>
                    <option value="investigation">Investigação</option>
                    <option value="fraud">Fraude</option>
                    <option value="other">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="text-white text-sm mb-2 block">Motivo do Bloqueio</label>
                  <textarea
                    placeholder="Descreva o motivo do bloqueio..."
                    value={lockReason}
                    onChange={(e) => setLockReason(e.target.value)}
                    rows={3}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-800">
                <Button
                  onClick={() => {
                    setLockModalOpen(null)
                    setLockAmount('')
                    setLockReason('')
                    setLockType('med')
                  }}
                  variant="outline"
                  className="flex-1 border-gray-700"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => handleLockBalance(lockModalOpen)}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  <Lock size={16} className="mr-2" />
                  Bloquear Saldo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}