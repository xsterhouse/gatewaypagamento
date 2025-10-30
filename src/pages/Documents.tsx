import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  Download,
  Trash2
} from 'lucide-react'

interface Document {
  id: string
  user_id: string
  document_type: 'cpf' | 'cnpj' | 'comprovante_residencia' | 'selfie'
  file_url: string
  file_name: string
  uploaded_at: string
}

export function Documents() {
  const { userData } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadingType, setUploadingType] = useState<string | null>(null)

  useEffect(() => {
    if (userData?.id) {
      loadDocuments()
    }
  }, [userData])

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('user_documents')
        .select('*')
        .eq('user_id', userData?.id)
        .order('uploaded_at', { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error('Erro ao carregar documentos:', error)
    }
  }

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    documentType: 'cpf' | 'cnpj' | 'comprovante_residencia' | 'selfie'
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo: 5MB')
      return
    }

    // Validar tipo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      toast.error('Tipo de arquivo inválido. Use JPG, PNG ou PDF')
      return
    }

    setUploadingType(documentType)
    setLoading(true)

    try {
      // Upload para Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${userData?.id}/${documentType}_${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('kyc-documents')
        .getPublicUrl(fileName)

      // Salvar no banco
      const { error: dbError } = await supabase
        .from('user_documents')
        .insert({
          user_id: userData?.id,
          document_type: documentType,
          file_url: publicUrl,
          file_name: file.name,
        })

      if (dbError) throw dbError

      // Atualizar status KYC para "submitted" se ainda estiver "pending"
      if (userData?.kyc_status === 'pending') {
        await supabase
          .from('users')
          .update({ 
            kyc_status: 'pending',
            kyc_submitted_at: new Date().toISOString() 
          })
          .eq('id', userData?.id)
      }

      toast.success('Documento enviado com sucesso!')
      loadDocuments()
    } catch (error: any) {
      console.error('Erro ao enviar documento:', error)
      toast.error('Erro ao enviar documento: ' + error.message)
    } finally {
      setLoading(false)
      setUploadingType(null)
    }
  }

  const deleteDocument = async (documentId: string, fileUrl: string) => {
    if (!confirm('Deseja realmente excluir este documento?')) return

    try {
      // Extrair caminho do arquivo da URL
      const urlParts = fileUrl.split('/kyc-documents/')
      const filePath = urlParts[1]

      // Deletar do storage
      const { error: storageError } = await supabase.storage
        .from('kyc-documents')
        .remove([filePath])

      if (storageError) console.error('Erro ao deletar do storage:', storageError)

      // Deletar do banco
      const { error: dbError } = await supabase
        .from('user_documents')
        .delete()
        .eq('id', documentId)

      if (dbError) throw dbError

      toast.success('Documento excluído com sucesso!')
      loadDocuments()
    } catch (error) {
      console.error('Erro ao excluir documento:', error)
      toast.error('Erro ao excluir documento')
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: (
        <div className="flex items-center gap-2 text-yellow-500">
          <Clock size={16} />
          <span>Em Análise</span>
        </div>
      ),
      approved: (
        <div className="flex items-center gap-2 text-green-500">
          <CheckCircle size={16} />
          <span>Aprovado</span>
        </div>
      ),
      rejected: (
        <div className="flex items-center gap-2 text-red-500">
          <XCircle size={16} />
          <span>Rejeitado</span>
        </div>
      ),
    }
    return badges[status as keyof typeof badges] || badges.pending
  }

  const documentTypes = [
    {
      type: 'cpf' as const,
      title: userData?.document_type === 'cpf' ? 'CPF' : 'CNPJ',
      description: userData?.document_type === 'cpf' 
        ? 'Frente e verso do CPF ou CNH' 
        : 'Documento CNPJ da empresa',
      required: true
    },
    {
      type: 'comprovante_residencia' as const,
      title: 'Comprovante de Residência',
      description: 'Conta de luz, água ou telefone (máx 3 meses)',
      required: true
    },
    {
      type: 'selfie' as const,
      title: 'Selfie com Documento',
      description: 'Foto sua segurando o documento',
      required: true
    }
  ]

  const hasDocument = (type: string) => {
    return documents.some(doc => doc.document_type === type)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Meus Documentos</h1>
        <p className="text-gray-400">
          Envie seus documentos para verificação de identidade (KYC)
        </p>
      </div>

      {/* Status KYC */}
      <Card className="bg-[#1a1f2e] border-gray-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Status da Verificação
              </h3>
              <p className="text-sm text-gray-400">
                {userData?.kyc_status === 'pending' && 'Seus documentos estão sendo analisados'}
                {userData?.kyc_status === 'approved' && 'Sua conta foi verificada com sucesso!'}
                {userData?.kyc_status === 'rejected' && 'Sua verificação foi rejeitada. Envie novos documentos.'}
              </p>
            </div>
            {getStatusBadge(userData?.kyc_status || 'pending')}
          </div>

          {userData?.kyc_rejection_reason && (
            <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
                <div>
                  <p className="text-red-500 font-semibold">Motivo da Rejeição:</p>
                  <p className="text-red-300 text-sm mt-1">{userData.kyc_rejection_reason}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Documentos para Enviar */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {documentTypes.map((docType) => (
          <Card key={docType.type} className="bg-[#1a1f2e] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText size={20} className="text-primary" />
                {docType.title}
                {docType.required && (
                  <span className="text-xs text-red-500">*</span>
                )}
              </CardTitle>
              <CardDescription className="text-gray-400 text-sm">
                {docType.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {hasDocument(docType.type) ? (
                <div className="space-y-2">
                  {documents
                    .filter(doc => doc.document_type === docType.type)
                    .map(doc => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle className="text-green-500" size={16} />
                          <span className="text-sm text-gray-300 truncate max-w-[150px]">
                            {doc.file_name}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(doc.file_url, '_blank')}
                            className="text-blue-500 hover:text-blue-400"
                          >
                            <Download size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteDocument(doc.id, doc.file_url)}
                            className="text-red-500 hover:text-red-400"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => document.getElementById(`file-${docType.type}`)?.click()}
                    disabled={loading}
                  >
                    Substituir
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => document.getElementById(`file-${docType.type}`)?.click()}
                  disabled={loading && uploadingType === docType.type}
                >
                  {loading && uploadingType === docType.type ? (
                    <>Enviando...</>
                  ) : (
                    <>
                      <Upload size={16} className="mr-2" />
                      Enviar {docType.title}
                    </>
                  )}
                </Button>
              )}

              <input
                id={`file-${docType.type}`}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                className="hidden"
                onChange={(e) => handleFileUpload(e, docType.type)}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Informações */}
      <Card className="bg-[#1a1f2e] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Informações Importantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-400">
          <p>• Arquivos aceitos: JPG, PNG ou PDF (máximo 5MB cada)</p>
          <p>• Todos os documentos são obrigatórios para verificação</p>
          <p>• A análise pode levar até 24 horas úteis</p>
          <p>• Certifique-se de que as imagens estão legíveis</p>
          <p>• Documentos com informações ilegíveis serão rejeitados</p>
        </CardContent>
      </Card>
    </div>
  )
}
