import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  User,
  Mail,
  Calendar,
  FileText
} from 'lucide-react'

interface MEDRequest {
  id: string
  user_id: string
  amount: number
  reason: string
  description: string
  status: string
  pix_key: string
  pix_key_type: string
  created_at: string
  users: {
    name: string
    email: string
  }
}

export function AdminMED() {
  const { effectiveUserId } = useAuth()
  const [requests, setRequests] = useState<MEDRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<MEDRequest | null>(null)
  const [actionModalOpen, setActionModalOpen] = useState(false)
  const [action, setAction] = useState<'approve' | 'reject'>('approve')
  const [notes, setNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('med_requests')
        .select(`
          *,
          users!med_requests_user_id_fkey (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao carregar solicitações:', error)
        
        // Verificar se é erro de tabela não existente
        if (error.message.includes('does not exist') || error.code === '42P01') {
          toast.error('Tabela MED não encontrada. Execute o SQL: SQL_CRIAR_TABELA_MED.sql')
        } else {
          toast.error(`Erro ao carregar solicitações: ${error.message}`)
        }
        throw error
      }
      
      setRequests(data || [])
    } catch (error: any) {
      console.error('Erro completo:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!selectedRequest) return

    try {
      setProcessing(true)

      const { error } = await supabase
        .from('med_requests')
        .update({
          status: 'approved',
          admin_notes: notes,
          approved_by: effectiveUserId,
          approved_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id)

      if (error) throw error

      toast.success('Solicitação aprovada com sucesso!')
      setActionModalOpen(false)
      setNotes('')
      setSelectedRequest(null)
      loadRequests()
    } catch (error: any) {
      console.error('Erro ao aprovar:', error)
      toast.error('Erro ao aprovar solicitação')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error('Informe o motivo da rejeição')
      return
    }

    try {
      setProcessing(true)

      const { error } = await supabase
        .from('med_requests')
        .update({
          status: 'rejected',
          rejected_reason: rejectionReason,
          approved_by: effectiveUserId,
          approved_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id)

      if (error) throw error

      toast.success('Solicitação rejeitada')
      setActionModalOpen(false)
      setRejectionReason('')
      setSelectedRequest(null)
      loadRequests()
    } catch (error: any) {
      console.error('Erro ao rejeitar:', error)
      toast.error('Erro ao rejeitar solicitação')
    } finally {
      setProcessing(false)
    }
  }

  const handleComplete = async (requestId: string) => {
    if (!confirm('Marcar como concluído? Esta ação indica que a devolução foi processada.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('med_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', requestId)

      if (error) throw error

      toast.success('Marcado como concluído!')
      loadRequests()
    } catch (error: any) {
      console.error('Erro ao concluir:', error)
      toast.error('Erro ao marcar como concluído')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { label: 'Aprovado', className: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      rejected: { label: 'Rejeitado', className: 'bg-red-100 text-red-800', icon: XCircle },
      completed: { label: 'Concluído', className: 'bg-green-100 text-green-800', icon: CheckCircle }
    }
    const variant = variants[status as keyof typeof variants] || variants.pending
    const Icon = variant.icon
    return (
      <Badge className={`${variant.className} gap-1`}>
        <Icon className="w-3 h-3" />
        {variant.label}
      </Badge>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    completed: requests.filter(r => r.status === 'completed').length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Gerenciar MED</h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1">
          Mecanismo Especial de Devolução
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aprovados</p>
                <p className="text-2xl font-bold text-blue-500">{stats.approved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejeitados</p>
                <p className="text-2xl font-bold text-red-500">{stats.rejected}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Concluídos</p>
                <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista */}
      <div className="space-y-4">
        {requests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma solicitação MED encontrada</p>
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-5 h-5" />
                      {formatCurrency(request.amount)}
                    </CardTitle>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {request.users?.name}
                      </p>
                      <p className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {request.users?.email}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Motivo</Label>
                  <p className="text-sm mt-1">{request.reason}</p>
                </div>

                {request.description && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Descrição</Label>
                    <p className="text-sm mt-1">{request.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Chave PIX</Label>
                    <p className="text-sm font-mono mt-1">{request.pix_key}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Tipo: {request.pix_key_type?.toUpperCase()}
                    </p>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Data</Label>
                    <p className="text-sm flex items-center gap-1 mt-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(request.created_at)}
                    </p>
                  </div>
                </div>

                {request.status === 'pending' && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      className="flex-1 border-red-500 text-red-500 hover:bg-red-500/10"
                      onClick={() => {
                        setSelectedRequest(request)
                        setAction('reject')
                        setActionModalOpen(true)
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rejeitar
                    </Button>
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        setSelectedRequest(request)
                        setAction('approve')
                        setActionModalOpen(true)
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Aprovar
                    </Button>
                  </div>
                )}

                {request.status === 'approved' && (
                  <div className="pt-4 border-t">
                    <Button
                      onClick={() => handleComplete(request.id)}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Marcar como Concluído
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de Ação */}
      <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'approve' ? 'Aprovar Solicitação' : 'Rejeitar Solicitação'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {action === 'approve' ? (
              <>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-900 dark:text-green-200">
                    Ao aprovar, o cliente será notificado e a devolução deverá ser processada.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações (Opcional)</Label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Adicione observações sobre a aprovação..."
                    rows={4}
                    className="w-full p-3 border rounded-md bg-background resize-none"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-900 dark:text-red-200">
                    Informe o motivo da rejeição. O cliente verá esta mensagem.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rejection">Motivo da Rejeição *</Label>
                  <textarea
                    id="rejection"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Descreva o motivo da rejeição..."
                    rows={4}
                    className="w-full p-3 border rounded-md bg-background resize-none"
                    required
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setActionModalOpen(false)
                setNotes('')
                setRejectionReason('')
                setSelectedRequest(null)
              }}
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button
              variant={action === 'approve' ? 'default' : 'destructive'}
              onClick={action === 'approve' ? handleApprove : handleReject}
              disabled={processing}
            >
              {processing ? 'Processando...' : action === 'approve' ? 'Aprovar' : 'Rejeitar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
