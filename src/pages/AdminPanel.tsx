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
  LogIn
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
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .neq('role', 'admin')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
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
      const { error } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', userId)

      if (error) throw error

      toast.success('Saldo atualizado com sucesso!')
      loadUsers()
      setEditingBalance({ ...editingBalance, [userId]: '' })
    } catch (error) {
      toast.error('Erro ao atualizar saldo')
    }
  }

  const addBalance = async (userId: string, amount: number) => {
    const user = users.find(u => u.id === userId)
    if (!user) return

    const newBalance = Number(user.balance) + amount
    await updateBalance(userId, newBalance)
  }

  const removeBalance = async (userId: string, amount: number) => {
    const user = users.find(u => u.id === userId)
    if (!user) return

    const newBalance = Math.max(0, Number(user.balance) - amount)
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
        <div className="text-gray-400">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Painel Administrativo</h1>
        <p className="text-muted-foreground">Gerencie usuários, saldos e permissões</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total de Usuários</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
              <Users className="text-gray-500" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Usuários Ativos</p>
                <p className="text-2xl font-bold text-green-500">{stats.active}</p>
              </div>
              <CheckCircle className="text-green-500" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Suspensos</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.suspended}</p>
              </div>
              <Ban className="text-yellow-500" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Saldo Total</p>
                <p className="text-2xl font-bold text-primary">
                  R$ {stats.totalBalance.toFixed(2)}
                </p>
              </div>
              <DollarSign className="text-primary" size={32} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-input border-border text-foreground pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Nenhum usuário encontrado</p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.id} className="bg-card border-border">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-foreground flex items-center gap-2">
                      {user.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  {getStatusBadge(user.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Balance */}
                <div className="bg-accent/50 rounded-lg p-4 border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Saldo Disponível</p>
                      <p className="text-2xl font-bold text-primary">
                        R$ {Number(user.balance).toFixed(2)}
                      </p>
                    </div>
                    <DollarSign className="text-primary" size={24} />
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
                      className="bg-input border-border text-foreground"
                    />
                    <Button
                      onClick={() => {
                        const amount = parseFloat(editingBalance[user.id] || '0')
                        if (amount > 0) addBalance(user.id, amount)
                      }}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
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
                      className="border-red-500 text-red-500 hover:bg-red-500/10"
                    >
                      <Minus size={16} />
                    </Button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
                  {/* Botão Logar como Cliente */}
                  <Button
                    onClick={async () => {
                      try {
                        await impersonateUser(user.id)
                        toast.success(`Logado como ${user.name}`)
                      } catch (error) {
                        toast.error('Erro ao logar como cliente')
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <LogIn size={16} className="mr-2" />
                    Logar como Cliente
                  </Button>

                  {/* Botão MED - Bloquear Saldo */}
                  <Button
                    onClick={() => setLockModalOpen(user.id)}
                    variant="outline"
                    className="border-orange-500 text-orange-500 hover:bg-orange-500/10"
                  >
                    <Lock size={16} className="mr-2" />
                    MED - Bloquear Saldo
                  </Button>

                  {user.status === 'active' ? (
                    <>
                      <Input
                        placeholder="Motivo da suspensão"
                        value={suspensionReason[user.id] || ''}
                        onChange={(e) => setSuspensionReason({
                          ...suspensionReason,
                          [user.id]: e.target.value
                        })}
                        className="bg-input border-border text-foreground flex-1"
                      />
                      <Button
                        onClick={() => suspendUser(user.id)}
                        variant="outline"
                        className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
                      >
                        <Ban size={16} className="mr-2" />
                        Suspender
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => activateUser(user.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Unlock size={16} className="mr-2" />
                      Ativar
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => deleteUser(user.id)}
                    variant="outline"
                    className="border-red-500 text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Excluir
                  </Button>
                </div>

                {user.suspension_reason && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-yellow-300 text-sm">
                      <strong>Motivo da suspensão:</strong> {user.suspension_reason}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
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
