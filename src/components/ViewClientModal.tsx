import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { 
  User, 
  Mail, 
  Phone, 
  FileText, 
  MapPin, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Loader2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ViewClientModalProps {
  open: boolean
  onClose: () => void
  client: any
}

export function ViewClientModal({ open, onClose, client }: ViewClientModalProps) {
  if (!client) return null
  
  const [activeTab, setActiveTab] = useState('personal')
  const [documents, setDocuments] = useState<any[]>([])
  const [loadingDocuments, setLoadingDocuments] = useState(false)

  // Load user documents when modal opens
  useEffect(() => {
    if (open && client?.id) {
      loadUserDocuments()
    }
  }, [open, client?.id])

  const loadUserDocuments = async () => {
    setLoadingDocuments(true)
    try {
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('user_id', client.id)
        .order('uploaded_at', { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error('Erro ao carregar documentos:', error)
    } finally {
      setLoadingDocuments(false)
    }
  }

  // Generate signed URL for private bucket access
  const getDocumentUrl = async (fileUrl: string) => {
    try {
      const urlParts = fileUrl.split('/')
      const filePath = urlParts.slice(-2).join('/')
      
      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .createSignedUrl(filePath, 3600)
      
      if (error) {
        console.error('Error generating signed URL:', error)
        return fileUrl
      }
      
      return data.signedUrl
    } catch (error) {
      console.error('Error getting document URL:', error)
      return fileUrl
    }
  }

  const formatDate = (date: string) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDocument = (doc: string) => {
    if (!doc) return 'N/A'
    const numbers = doc.replace(/\D/g, '')
    if (numbers.length === 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    } else if (numbers.length === 14) {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }
    return doc
  }

  const formatPhone = (phone: string) => {
    if (!phone) return 'N/A'
    const numbers = phone.replace(/\D/g, '')
    if (numbers.length === 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    } else if (numbers.length === 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }
    return phone
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      approved: { label: 'Aprovado', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      rejected: { label: 'Rejeitado', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
    }
    const variant = variants[status as keyof typeof variants] || variants.pending
    return <Badge className={variant.className}>{variant.label}</Badge>
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <User className="w-6 h-6" />
            Detalhes do Cliente
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          {/* Aba Dados Pessoais */}
          <TabsContent value="personal" className="space-y-6">
            {/* Status KYC */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status KYC:
                </span>
                {getStatusBadge(client.kyc_status)}
              </div>
              {client.is_blocked && (
                <div className="mt-2 flex items-center gap-2 text-red-600 dark:text-red-400">
                  <XCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Conta Bloqueada</span>
                </div>
              )}
            </div>

            {/* Informações Pessoais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Nome Completo
                </label>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {client.name || 'N/A'}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {client.email || 'N/A'}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Telefone
                </label>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {formatPhone(client.phone)}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  CPF/CNPJ
                </label>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {formatDocument(client.document)}
                </p>
              </div>
            </div>

            {/* Endereço */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Endereço
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Endereço Completo
                  </label>
                  <p className="text-base text-gray-900 dark:text-white">
                    {client.address || 'Não informado'}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Cidade
                  </label>
                  <p className="text-base text-gray-900 dark:text-white">
                    {client.city || 'N/A'}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Estado
                  </label>
                  <p className="text-base text-gray-900 dark:text-white">
                    {client.state || 'N/A'}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    CEP
                  </label>
                  <p className="text-base text-gray-900 dark:text-white">
                    {client.zip_code ? client.zip_code.replace(/(\d{5})(\d{3})/, '$1-$2') : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Aba Documentos */}
          <TabsContent value="documents" className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <strong>Nota:</strong> Clique nos documentos para visualizar em tamanho completo.
              </p>
            </div>

            {loadingDocuments ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin mr-2" />
                <span className="text-muted-foreground">Carregando documentos...</span>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto text-muted-foreground mb-3" size={48} />
                <p className="text-muted-foreground">Nenhum documento enviado</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((doc) => {
                  const docLabels: { [key: string]: string } = {
                    identity_document: 'Documento de Identidade',
                    address_proof: 'Comprovante de Endereço',
                    selfie: 'Selfie',
                    selfie_with_document: 'Selfie com Documento'
                  }

                  return (
                    <div key={doc.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          {docLabels[doc.document_type] || doc.document_type}
                        </h4>
                        <Badge className="bg-green-100 text-green-800">Enviado</Badge>
                      </div>
                      <div className="space-y-2">
                        {doc.file_url.endsWith('.pdf') ? (
                          <div className="bg-muted rounded-lg p-4 text-center">
                            <FileText className="mx-auto text-muted-foreground mb-2" size={32} />
                            <p className="text-sm text-foreground mb-2">{doc.file_name}</p>
                            <Button
                              size="sm"
                              onClick={async () => {
                                const signedUrl = await getDocumentUrl(doc.file_url)
                                window.open(signedUrl, '_blank')
                              }}
                              className="gap-2"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Abrir PDF
                            </Button>
                          </div>
                        ) : (
                          <>
                            <img
                              src={doc.file_url}
                              alt={docLabels[doc.document_type]}
                              className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80"
                              onClick={async () => {
                                const signedUrl = await getDocumentUrl(doc.file_url)
                                window.open(signedUrl, '_blank')
                              }}
                            />
                            <Button
                              size="sm"
                              onClick={async () => {
                                const signedUrl = await getDocumentUrl(doc.file_url)
                                window.open(signedUrl, '_blank')
                              }}
                              className="w-full gap-2"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Visualizar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Aba Histórico */}
          <TabsContent value="history" className="space-y-4">
            <div className="space-y-3">
              {/* Data de Cadastro */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Cadastro Realizado
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(client.created_at)}
                  </p>
                </div>
              </div>

              {/* Data de Envio KYC */}
              {client.kyc_submitted_at && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      KYC Enviado
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(client.kyc_submitted_at)}
                    </p>
                  </div>
                </div>
              )}

              {/* Data de Aprovação */}
              {client.kyc_approved_at && (
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      KYC Aprovado
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(client.kyc_approved_at)}
                    </p>
                  </div>
                </div>
              )}

              {/* Motivo de Rejeição */}
              {client.kyc_status === 'rejected' && client.kyc_rejection_reason && (
                <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      Motivo da Rejeição
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {client.kyc_rejection_reason}
                    </p>
                  </div>
                </div>
              )}

              {/* Bloqueio */}
              {client.is_blocked && (
                <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      Conta Bloqueada
                    </p>
                    {client.blocked_at && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Bloqueado em: {formatDate(client.blocked_at)}
                      </p>
                    )}
                    {client.blocked_reason && (
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Motivo: {client.blocked_reason}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Botão Fechar */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
