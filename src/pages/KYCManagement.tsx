import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { ViewClientModal } from '@/components/ViewClientModal'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Building2, 
  CreditCard,
  Mail,
  Calendar,
  Search,
  Eye,
  Lock,
  Unlock,
  Trash2,
  AlertTriangle,
  FileText
} from 'lucide-react'

interface KYCUser {
  id: string
  name: string
  email: string
  document: string
  document_type: string
  company_name: string | null
  kyc_status: 'pending' | 'awaiting_verification' | 'approved' | 'rejected'
  kyc_submitted_at: string
  kyc_rejection_reason: string | null
  created_at: string
  is_blocked?: boolean
  blocked_reason?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  birth_date?: string
}

interface KYCDocument {
  id: string
  document_type: string
  file_url: string
  file_name: string
  uploaded_at: string
}

export function KYCManagement() {
  const { effectiveUserId } = useAuth()
  const [users, setUsers] = useState<KYCUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<KYCUser[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'awaiting_verification' | 'approved' | 'rejected'>('awaiting_verification')
  const [searchTerm, setSearchTerm] = useState('')
  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({})
  
  // Modais
  const [selectedClient, setSelectedClient] = useState<KYCUser | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [blockModalOpen, setBlockModalOpen] = useState(false)
  const [blockReason, setBlockReason] = useState('')
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false)
  const [userDocuments, setUserDocuments] = useState<KYCDocument[]>([])
  const [loadingDocuments, setLoadingDocuments] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteReason, setDeleteReason] = useState('')
  const [deletingUser, setDeletingUser] = useState(false)

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

  const loadUserDocuments = async (userId: string) => {
    console.log('Loading documents for user:', userId)
    setLoadingDocuments(true)
    try {
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false })

      if (error) {
        console.error('Error loading documents:', error)
        throw error
      }
      
      console.log('Documents loaded:', data)
      console.log('Number of documents:', data?.length || 0)
      setUserDocuments(data || [])
    } catch (error) {
      console.error('Erro ao carregar documentos:', error)
      toast.error('Erro ao carregar documentos')
    } finally {
      setLoadingDocuments(false)
    }
  }

  // Generate signed URL for private bucket access
  const getDocumentUrl = async (fileUrl: string) => {
    try {
      // Extract path from public URL
      const urlParts = fileUrl.split('/')
      const filePath = urlParts.slice(-2).join('/') // Get userId/filename
      
      // Generate signed URL (valid for 1 hour)
      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .createSignedUrl(filePath, 3600) // 1 hour expiry
      
      if (error) {
        console.error('Error generating signed URL:', error)
        return fileUrl // Fallback to public URL
      }
      
      return data.signedUrl
    } catch (error) {
      console.error('Error getting document URL:', error)
      return fileUrl
    }
  }

  const handleViewDocuments = async (user: KYCUser) => {
    console.log('Opening documents modal for user:', user.name, user.id)
    setSelectedClient(user)
    setDocumentsModalOpen(true)
    await loadUserDocuments(user.id)
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
      console.log('🔵 Approving KYC for user:', userId)
      
      const { error } = await supabase
        .from('users')
        .update({
          kyc_status: 'approved',
          kyc_approved_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) {
        console.error('❌ KYC approval error:', error)
        throw error
      }

      console.log('✅ KYC approved successfully')
      toast.success('KYC aprovado com sucesso!')
      loadUsers()
    } catch (error: any) {
      console.error('❌ Fatal error in KYC approval:', error)
      toast.error(`Erro ao aprovar KYC: ${error.message}`)
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

  // Visualizar Cliente
  const handleViewClient = (client: KYCUser) => {
    setSelectedClient(client)
    setViewModalOpen(true)
  }

  // Bloquear/Desbloquear Cliente
  const handleToggleBlock = async () => {
    if (!selectedClient) return
    
    const isBlocking = !selectedClient.is_blocked
    
    if (isBlocking && !blockReason.trim()) {
      toast.error('Informe o motivo do bloqueio')
      return
    }
    
    try {
      const { error } = await supabase
        .from('users')
        .update({
          is_blocked: isBlocking,
          blocked_at: isBlocking ? new Date().toISOString() : null,
          blocked_reason: isBlocking ? blockReason : null,
          blocked_by: isBlocking ? effectiveUserId : null
        })
        .eq('id', selectedClient.id)
      
      if (error) throw error
      
      toast.success(isBlocking ? 'Cliente bloqueado com sucesso!' : 'Cliente desbloqueado com sucesso!')
      setBlockModalOpen(false)
      setBlockReason('')
      setSelectedClient(null)
      loadUsers()
    } catch (error) {
      console.error('Erro ao bloquear/desbloquear:', error)
      toast.error('Erro ao bloquear/desbloquear cliente')
    }
  }

  // Abrir modal de exclusão
  const handleOpenDeleteModal = (user: KYCUser) => {
    setSelectedClient(user)
    setDeleteModalOpen(true)
    setDeletePassword('')
    setDeleteReason('')
  }

  // Excluir Cliente (com validação de senha)
  const handleDeleteClient = async () => {
    if (!selectedClient) return
    
    // Validar campos obrigatórios
    if (!deletePassword.trim()) {
      toast.error('Digite sua senha para confirmar a exclusão')
      return
    }
    
    if (!deleteReason.trim()) {
      toast.error('Informe o motivo da exclusão')
      return
    }
    
    setDeletingUser(true)
    
    try {
      // 1. Validar senha do usuário atual
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        toast.error('Erro ao verificar usuário')
        setDeletingUser(false)
        return
      }
      
      // Tentar fazer login com a senha fornecida para validar
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: deletePassword
      })
      
      if (signInError) {
        toast.error('Senha incorreta!')
        setDeletingUser(false)
        return
      }
      
      // 2. Registrar log de exclusão antes de excluir
      const { error: logError } = await supabase
        .from('user_deletion_logs')
        .insert({
          deleted_user_id: selectedClient.id,
          deleted_user_name: selectedClient.name,
          deleted_user_email: selectedClient.email,
          deleted_user_document: selectedClient.document,
          deleted_by: effectiveUserId,
          deletion_reason: deleteReason,
          deleted_at: new Date().toISOString()
        })
      
      if (logError) {
        console.warn('Aviso: Não foi possível registrar log de exclusão:', logError)
        // Continua mesmo se o log falhar
      }
      
      // 3. Excluir documentos KYC do storage
      try {
        const { data: documents } = await supabase
          .from('kyc_documents')
          .select('file_url')
          .eq('user_id', selectedClient.id)
        
        if (documents && documents.length > 0) {
          for (const doc of documents) {
            const urlParts = doc.file_url.split('/')
            const filePath = urlParts.slice(-2).join('/')
            await supabase.storage.from('kyc-documents').remove([filePath])
          }
        }
      } catch (storageError) {
        console.warn('Aviso: Erro ao excluir documentos do storage:', storageError)
        // Continua mesmo se falhar
      }
      
      // 4. Excluir registros de documentos KYC
      await supabase
        .from('kyc_documents')
        .delete()
        .eq('user_id', selectedClient.id)
      
      // 5. Excluir carteiras do usuário
      await supabase
        .from('wallets')
        .delete()
        .eq('user_id', selectedClient.id)
      
      // 6. Excluir transações PIX (se existir)
      await supabase
        .from('pix_transactions')
        .delete()
        .eq('user_id', selectedClient.id)
      
      // 7. Excluir mensagens de tickets do usuário
      await supabase
        .from('ticket_messages')
        .delete()
        .eq('user_id', selectedClient.id)
      
      // 8. Excluir tickets criados pelo usuário
      await supabase
        .from('tickets')
        .delete()
        .eq('user_id', selectedClient.id)
      
      // 9. Finalmente, excluir o usuário
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', selectedClient.id)
      
      if (deleteError) throw deleteError
      
      // 10. Excluir do Auth (se possível)
      // Nota: Isso requer privilégios de admin no Supabase
      try {
        await supabase.auth.admin.deleteUser(selectedClient.id)
      } catch (authDeleteError) {
        console.warn('Aviso: Não foi possível excluir do Auth:', authDeleteError)
        // Não é crítico se falhar
      }
      
      toast.success(`Cliente ${selectedClient.name} excluído com sucesso!`)
      setDeleteModalOpen(false)
      setSelectedClient(null)
      setDeletePassword('')
      setDeleteReason('')
      loadUsers()
      
    } catch (error: any) {
      console.error('Erro ao excluir cliente:', error)
      toast.error(`Erro ao excluir cliente: ${error.message}`)
    } finally {
      setDeletingUser(false)
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
      case 'awaiting_verification':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium">
            <Clock size={14} />
            Aguardando Verificação
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
    awaiting: users.filter(u => u.kyc_status === 'awaiting_verification').length,
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
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Gerenciamento de KYC</h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1">Aprove ou rejeite cadastros de clientes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                <p className="text-muted-foreground text-sm">Aguardando</p>
                <p className="text-2xl font-bold text-blue-500">{stats.awaiting}</p>
              </div>
              <Clock className="text-blue-500" size={32} />
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
            <div className="flex gap-2 flex-wrap">
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
                variant={filter === 'awaiting_verification' ? 'default' : 'outline'}
                onClick={() => setFilter('awaiting_verification')}
                className={filter !== 'awaiting_verification' ? 'border-border' : ''}
              >
                Aguardando
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
                  <div className="flex items-center gap-2">
                    {getStatusBadge(user.kyc_status)}
                    {user.is_blocked && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs font-medium">
                        <Lock size={12} />
                        Bloqueado
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Botões de Ação */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewClient(user)}
                    className="gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Visualizar
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewDocuments(user)}
                    className="gap-2 border-blue-500 text-blue-500 hover:bg-blue-500/10"
                  >
                    <FileText className="w-4 h-4" />
                    Documentos
                  </Button>
                  
                  <Button
                    size="sm"
                    variant={user.is_blocked ? "default" : "outline"}
                    onClick={() => {
                      setSelectedClient(user)
                      setBlockModalOpen(true)
                    }}
                    className={user.is_blocked ? "gap-2" : "gap-2 border-orange-500 text-orange-500 hover:bg-orange-500/10"}
                  >
                    {user.is_blocked ? (
                      <>
                        <Unlock className="w-4 h-4" />
                        Desbloquear
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Bloquear
                      </>
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenDeleteModal(user)}
                    className="gap-2 border-red-500 text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </Button>
                </div>

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

                {(user.kyc_status === 'pending' || user.kyc_status === 'awaiting_verification') && (
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

      {/* Modal de Visualização */}
      <ViewClientModal 
        open={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false)
          setSelectedClient(null)
        }}
        client={selectedClient}
      />

      {/* Modal de Documentos */}
      <Dialog open={documentsModalOpen} onOpenChange={setDocumentsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Documentos KYC - {selectedClient?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {loadingDocuments ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground">Carregando documentos...</div>
              </div>
            ) : userDocuments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto text-muted-foreground mb-3" size={48} />
                <p className="text-muted-foreground">Nenhum documento enviado</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userDocuments.map((doc) => {
                  const docLabels: { [key: string]: string } = {
                    identity_document: 'Documento de Identidade',
                    address_proof: 'Comprovante de Endereço',
                    selfie: 'Selfie',
                    selfie_with_document: 'Selfie com Documento'
                  }

                  return (
                    <Card key={doc.id} className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="text-sm text-foreground">
                          {docLabels[doc.document_type] || doc.document_type}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Enviado em {new Date(doc.uploaded_at).toLocaleDateString('pt-BR')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {doc.file_url.endsWith('.pdf') ? (
                          <div className="bg-muted rounded-lg p-8 text-center">
                            <FileText className="mx-auto text-muted-foreground mb-2" size={48} />
                            <p className="text-sm text-foreground mb-3">{doc.file_name}</p>
                            <Button
                              size="sm"
                              onClick={async () => {
                                const signedUrl = await getDocumentUrl(doc.file_url)
                                window.open(signedUrl, '_blank')
                              }}
                              className="gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              Abrir PDF
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <img
                              src={doc.file_url}
                              alt={docLabels[doc.document_type]}
                              className="w-full h-48 object-cover rounded-lg"
                            />
                            <Button
                              size="sm"
                              onClick={async () => {
                                const signedUrl = await getDocumentUrl(doc.file_url)
                                window.open(signedUrl, '_blank')
                              }}
                              className="w-full gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              Ver em Tamanho Real
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setDocumentsModalOpen(false)
                setUserDocuments([])
                setSelectedClient(null)
              }}
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Exclusão */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Excluir Cliente Permanentemente
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Aviso de Perigo */}
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-bold text-red-900 dark:text-red-200">
                    ⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!
                  </p>
                  <p className="text-sm text-red-800 dark:text-red-300">
                    Ao excluir <strong>{selectedClient?.name}</strong>, os seguintes dados serão removidos permanentemente:
                  </p>
                  <ul className="text-xs text-red-700 dark:text-red-400 space-y-1 ml-4 list-disc">
                    <li>Dados cadastrais do cliente</li>
                    <li>Documentos KYC enviados</li>
                    <li>Carteiras digitais</li>
                    <li>Histórico de transações</li>
                    <li>Conta de acesso ao sistema</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Informações do Cliente */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                DADOS DO CLIENTE A SER EXCLUÍDO:
              </p>
              <div className="space-y-1">
                <p className="text-sm text-foreground">
                  <strong>Nome:</strong> {selectedClient?.name}
                </p>
                <p className="text-sm text-foreground">
                  <strong>Email:</strong> {selectedClient?.email}
                </p>
                <p className="text-sm text-foreground">
                  <strong>Documento:</strong> {selectedClient?.document}
                </p>
              </div>
            </div>

            {/* Campo de Senha */}
            <div className="space-y-2">
              <Label htmlFor="deletePassword" className="text-foreground font-medium">
                Sua Senha (Admin/Gerente) *
              </Label>
              <Input
                id="deletePassword"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Digite sua senha para confirmar"
                className="bg-background border-input"
                required
                disabled={deletingUser}
              />
              <p className="text-xs text-gray-500">
                Digite a senha da sua conta para autorizar esta exclusão.
              </p>
            </div>

            {/* Campo de Motivo */}
            <div className="space-y-2">
              <Label htmlFor="deleteReason" className="text-foreground font-medium">
                Motivo da Exclusão *
              </Label>
              <textarea
                id="deleteReason"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Descreva o motivo da exclusão (será registrado no log)..."
                rows={4}
                className="w-full p-3 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                required
                disabled={deletingUser}
              />
              <p className="text-xs text-gray-500">
                Este motivo será registrado permanentemente no log de auditoria.
              </p>
            </div>

            {/* Confirmação Final */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                <strong>📋 Registro de Auditoria:</strong> Esta exclusão será registrada no sistema com seu nome, data/hora e motivo informado.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteModalOpen(false)
                setDeletePassword('')
                setDeleteReason('')
                setSelectedClient(null)
              }}
              disabled={deletingUser}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteClient}
              disabled={deletingUser}
              className="gap-2"
            >
              {deletingUser ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Confirmar Exclusão
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Bloqueio */}
      <Dialog open={blockModalOpen} onOpenChange={setBlockModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedClient?.is_blocked ? (
                <>
                  <Unlock className="w-5 h-5" />
                  Desbloquear Cliente
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Bloquear Cliente
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedClient?.is_blocked ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  Tem certeza que deseja desbloquear a conta de <strong>{selectedClient.name}</strong>?
                </p>
                {selectedClient.blocked_reason && (
                  <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                    <p className="text-xs text-blue-800 dark:text-blue-300 mb-1">
                      <strong>Motivo do bloqueio:</strong>
                    </p>
                    <p className="text-sm text-blue-900 dark:text-blue-200">
                      {selectedClient.blocked_reason}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900 dark:text-red-200 mb-1">
                        Atenção!
                      </p>
                      <p className="text-sm text-red-800 dark:text-red-300">
                        Ao bloquear, <strong>{selectedClient?.name}</strong> não conseguirá acessar a conta.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="blockReason">Motivo do Bloqueio *</Label>
                  <textarea
                    id="blockReason"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="Descreva o motivo do bloqueio..."
                    rows={4}
                    className="w-full p-3 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Este motivo será registrado e poderá ser visualizado posteriormente.
                  </p>
                </div>
              </>
            )}
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setBlockModalOpen(false)
                setBlockReason('')
                setSelectedClient(null)
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant={selectedClient?.is_blocked ? "default" : "destructive"}
              onClick={handleToggleBlock}
              className="gap-2"
            >
              {selectedClient?.is_blocked ? (
                <>
                  <Unlock className="w-4 h-4" />
                  Desbloquear
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Bloquear Cliente
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
