import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Building2, 
  CreditCard,
  Mail,
  Calendar,
  Search
} from 'lucide-react'

interface KYCUser {
  id: string
  name: string
  email: string
  document: string
  document_type: string
  company_name: string | null
  kyc_status: 'pending' | 'approved' | 'rejected'
  kyc_submitted_at: string
  kyc_rejection_reason: string | null
  created_at: string
}

export function KYCManagement() {
  const [users, setUsers] = useState<KYCUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<KYCUser[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, filter, searchTerm])

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'user')
        .order('kyc_submitted_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    // Filtrar por status
    if (filter !== 'all') {
      filtered = filtered.filter(u => u.kyc_status === filter)
    }

    // Filtrar por busca
    if (searchTerm) {
      filtered = filtered.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.document.includes(searchTerm)
      )
    }

    setFilteredUsers(filtered)
  }

  const approveKYC = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          kyc_status: 'approved',
          kyc_approved_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) throw error

      toast.success('KYC aprovado com sucesso!')
      loadUsers()
    } catch (error) {
      toast.error('Erro ao aprovar KYC')
    }
  }

  const rejectKYC = async (userId: string) => {
    const reason = rejectionReason[userId]
    if (!reason) {
      toast.error('Digite o motivo da rejeição')
      return
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({
          kyc_status: 'rejected',
          kyc_rejection_reason: reason,
        })
        .eq('id', userId)

      if (error) throw error

      toast.success('KYC rejeitado')
      setRejectionReason({ ...rejectionReason, [userId]: '' })
      loadUsers()
    } catch (error) {
      toast.error('Erro ao rejeitar KYC')
    }
  }

  const formatDocument = (doc: string, type: string) => {
    if (type === 'cpf') {
      return doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    } else {
      return doc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-medium">
            <Clock size={14} />
            Pendente
          </span>
        )
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium">
            <CheckCircle size={14} />
            Aprovado
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-medium">
            <XCircle size={14} />
            Rejeitado
          </span>
        )
    }
  }

  const stats = {
    total: users.length,
    pending: users.filter(u => u.kyc_status === 'pending').length,
    approved: users.filter(u => u.kyc_status === 'approved').length,
    rejected: users.filter(u => u.kyc_status === 'rejected').length,
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
        <h1 className="text-3xl font-bold text-foreground mb-2">Gerenciamento de KYC</h1>
        <p className="text-muted-foreground">Aprove ou rejeite cadastros de clientes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
              <User className="text-muted-foreground" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
              </div>
              <Clock className="text-yellow-500" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Aprovados</p>
                <p className="text-2xl font-bold text-green-500">{stats.approved}</p>
              </div>
              <CheckCircle className="text-green-500" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Rejeitados</p>
                <p className="text-2xl font-bold text-red-500">{stats.rejected}</p>
              </div>
              <XCircle className="text-red-500" size={32} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
              <Input
                placeholder="Buscar por nome, email ou documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-input border-border text-foreground pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                className={filter !== 'all' ? 'border-border' : ''}
              >
                Todos
              </Button>
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                onClick={() => setFilter('pending')}
                className={filter !== 'pending' ? 'border-border' : ''}
              >
                Pendentes
              </Button>
              <Button
                variant={filter === 'approved' ? 'default' : 'outline'}
                onClick={() => setFilter('approved')}
                className={filter !== 'approved' ? 'border-border' : ''}
              >
                Aprovados
              </Button>
              <Button
                variant={filter === 'rejected' ? 'default' : 'outline'}
                onClick={() => setFilter('rejected')}
                className={filter !== 'rejected' ? 'border-border' : ''}
              >
                Rejeitados
              </Button>
            </div>
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
                      <User size={20} />
                      {user.name}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail size={14} />
                        {user.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(user.kyc_submitted_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(user.kyc_status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard className="text-muted-foreground" size={16} />
                    <span className="text-muted-foreground">
                      {user.document_type ? user.document_type.toUpperCase() : 'DOCUMENTO'}:
                    </span>
                    <span className="text-foreground font-mono">
                      {user.document ? formatDocument(user.document, user.document_type) : 'Não informado'}
                    </span>
                  </div>
                  {user.company_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="text-muted-foreground" size={16} />
                      <span className="text-foreground">{user.company_name}</span>
                    </div>
                  )}
                </div>

                {user.kyc_status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t border-border">
                    <Input
                      placeholder="Motivo da rejeição (opcional)"
                      value={rejectionReason[user.id] || ''}
                      onChange={(e) => setRejectionReason({
                        ...rejectionReason,
                        [user.id]: e.target.value
                      })}
                      className="bg-input border-border text-foreground flex-1"
                    />
                    <Button
                      onClick={() => rejectKYC(user.id)}
                      variant="outline"
                      className="border-red-500 text-red-500 hover:bg-red-500/10"
                    >
                      <XCircle size={16} className="mr-2" />
                      Rejeitar
                    </Button>
                    <Button
                      onClick={() => approveKYC(user.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle size={16} className="mr-2" />
                      Aprovar
                    </Button>
                  </div>
                )}

                {user.kyc_status === 'rejected' && user.kyc_rejection_reason && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <p className="text-red-300 text-sm">
                      <strong>Motivo da rejeição:</strong> {user.kyc_rejection_reason}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
