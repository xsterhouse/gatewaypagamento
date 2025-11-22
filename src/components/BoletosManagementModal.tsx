import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { 
  FileText, Search, RefreshCw, Eye, Trash2, 
  CheckCircle, Clock, XCircle, AlertCircle, Copy
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Boleto {
  id: string
  user_id: string
  payer_name: string
  payer_email: string
  payer_document: string
  amount: number
  description: string
  due_date: string
  status: 'pending' | 'paid' | 'expired' | 'cancelled'
  barcode?: string
  digitable_line?: string
  pdf_url?: string
  created_at: string
  paid_at?: string
  fee_amount: number
  net_amount: number
  mercadopago_payment_id?: string
}

interface User {
  id: string
  name: string
  email: string
}

interface BoletosManagementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefresh?: () => void
}

export function BoletosManagementModal({ open, onOpenChange, onRefresh }: BoletosManagementModalProps) {
  const [boletos, setBoletos] = useState<Boleto[]>([])
  const [users, setUsers] = useState<Record<string, User>>({})
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedBoleto, setSelectedBoleto] = useState<Boleto | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    if (open) {
      loadBoletos()
    }
  }, [open])

  const loadBoletos = async () => {
    try {
      setLoading(true)

      // Buscar boletos
      const { data: boletosData, error: boletosError } = await supabase
        .from('invoices_boletos')
        .select('*')
        .order('created_at', { ascending: false })

      if (boletosError) throw boletosError

      // Buscar usuários únicos
      const userIds = [...new Set(boletosData?.map(b => b.user_id) || [])]
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', userIds)

      if (usersError) throw usersError

      // Mapear usuários por ID
      const usersMap: Record<string, User> = {}
      usersData?.forEach(user => {
        usersMap[user.id] = user
      })

      setBoletos(boletosData || [])
      setUsers(usersMap)
    } catch (error: any) {
      console.error('Erro ao carregar boletos:', error)
      toast.error('Erro ao carregar boletos')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este boleto?')) return

    try {
      const { error } = await supabase
        .from('invoices_boletos')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Boleto excluído com sucesso')
      loadBoletos()
      onRefresh?.()
    } catch (error: any) {
      console.error('Erro ao excluir boleto:', error)
      toast.error('Erro ao excluir boleto')
    }
  }

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copiado!`)
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { icon: Clock, label: 'Pendente', class: 'bg-yellow-500/10 text-yellow-500' },
      paid: { icon: CheckCircle, label: 'Pago', class: 'bg-green-500/10 text-green-500' },
      expired: { icon: XCircle, label: 'Vencido', class: 'bg-red-500/10 text-red-500' },
      cancelled: { icon: AlertCircle, label: 'Cancelado', class: 'bg-gray-500/10 text-gray-500' }
    }
    const badge = badges[status as keyof typeof badges] || badges.pending
    const Icon = badge.icon
    return (
      <Badge className={badge.class}>
        <Icon size={12} className="mr-1" />
        {badge.label}
      </Badge>
    )
  }

  const filteredBoletos = boletos.filter(boleto => {
    const matchesSearch = 
      boleto.payer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      boleto.payer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      boleto.payer_document.includes(searchTerm) ||
      users[boleto.user_id]?.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || boleto.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const stats = {
    total: boletos.length,
    pending: boletos.filter(b => b.status === 'pending').length,
    paid: boletos.filter(b => b.status === 'paid').length,
    expired: boletos.filter(b => b.status === 'expired').length,
    cancelled: boletos.filter(b => b.status === 'cancelled').length,
    totalAmount: boletos.reduce((sum, b) => sum + b.amount, 0),
    paidAmount: boletos.filter(b => b.status === 'paid').reduce((sum, b) => sum + b.amount, 0)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="text-primary" />
              Gerenciar Boletos
            </DialogTitle>
          </DialogHeader>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-yellow-500/10 p-3 rounded-lg">
              <p className="text-xs text-yellow-600">Pendentes</p>
              <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="bg-green-500/10 p-3 rounded-lg">
              <p className="text-xs text-green-600">Pagos</p>
              <p className="text-xl font-bold text-green-600">{stats.paid}</p>
            </div>
            <div className="bg-blue-500/10 p-3 rounded-lg">
              <p className="text-xs text-blue-600">Volume Pago</p>
              <p className="text-xl font-bold text-blue-600">
                R$ {stats.paidAmount.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Buscar por nome, email, CPF/CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-md bg-background"
            >
              <option value="all">Todos os Status</option>
              <option value="pending">Pendentes</option>
              <option value="paid">Pagos</option>
              <option value="expired">Vencidos</option>
              <option value="cancelled">Cancelados</option>
            </select>
            <Button onClick={loadBoletos} variant="outline" disabled={loading}>
              <RefreshCw className={loading ? 'animate-spin' : ''} size={18} />
            </Button>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 text-xs font-medium">Cliente</th>
                    <th className="text-left p-3 text-xs font-medium">Pagador</th>
                    <th className="text-left p-3 text-xs font-medium">Valor</th>
                    <th className="text-left p-3 text-xs font-medium">Vencimento</th>
                    <th className="text-left p-3 text-xs font-medium">Status</th>
                    <th className="text-left p-3 text-xs font-medium">Criado em</th>
                    <th className="text-right p-3 text-xs font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-muted-foreground">
                        Carregando...
                      </td>
                    </tr>
                  ) : filteredBoletos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-muted-foreground">
                        Nenhum boleto encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredBoletos.map((boleto) => (
                      <tr key={boleto.id} className="border-t hover:bg-muted/50">
                        <td className="p-3">
                          <div className="text-sm font-medium">{users[boleto.user_id]?.name || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">{users[boleto.user_id]?.email}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">{boleto.payer_name}</div>
                          <div className="text-xs text-muted-foreground">{boleto.payer_document}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm font-medium">R$ {boleto.amount.toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">
                            Taxa: R$ {boleto.fee_amount.toFixed(2)}
                          </div>
                        </td>
                        <td className="p-3 text-sm">
                          {new Date(boleto.due_date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-3">
                          {getStatusBadge(boleto.status)}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {new Date(boleto.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedBoleto(boleto)
                                setShowDetailsModal(true)
                              }}
                            >
                              <Eye size={16} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(boleto.id)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Boleto</DialogTitle>
          </DialogHeader>

          {selectedBoleto && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  <p className="font-medium">{users[selectedBoleto.user_id]?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  {getStatusBadge(selectedBoleto.status)}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pagador</p>
                  <p className="font-medium">{selectedBoleto.payer_name}</p>
                  <p className="text-xs">{selectedBoleto.payer_email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CPF/CNPJ</p>
                  <p className="font-medium">{selectedBoleto.payer_document}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Valor</p>
                  <p className="text-xl font-bold">R$ {selectedBoleto.amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Taxa</p>
                  <p className="font-medium">R$ {selectedBoleto.fee_amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vencimento</p>
                  <p className="font-medium">
                    {new Date(selectedBoleto.due_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Criado em</p>
                  <p className="font-medium">
                    {new Date(selectedBoleto.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Descrição</p>
                <p className="text-sm">{selectedBoleto.description}</p>
              </div>

              {selectedBoleto.barcode && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Código de Barras</p>
                  <div className="flex gap-2">
                    <Input value={selectedBoleto.barcode} readOnly className="font-mono text-xs" />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(selectedBoleto.barcode!, 'Código de barras')}
                    >
                      <Copy size={16} />
                    </Button>
                  </div>
                </div>
              )}

              {selectedBoleto.digitable_line && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Linha Digitável</p>
                  <div className="flex gap-2">
                    <Input value={selectedBoleto.digitable_line} readOnly className="font-mono text-xs" />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(selectedBoleto.digitable_line!, 'Linha digitável')}
                    >
                      <Copy size={16} />
                    </Button>
                  </div>
                </div>
              )}

              {selectedBoleto.pdf_url && (
                <Button
                  className="w-full"
                  onClick={() => window.open(selectedBoleto.pdf_url, '_blank')}
                >
                  Baixar PDF do Boleto
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
