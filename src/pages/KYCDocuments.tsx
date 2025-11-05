import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Upload, 
  FileText, 
  Camera, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  Clock,
  Loader2,
  X,
  AlertCircle
} from 'lucide-react'

interface DocumentFile {
  file: File | null
  preview: string | null
  uploaded: boolean
  url?: string
}

interface Documents {
  identity_document: DocumentFile
  address_proof: DocumentFile
  selfie: DocumentFile
  selfie_with_document: DocumentFile
}

interface ExistingDocument {
  id: string
  document_type: string
  file_url: string
  file_name: string
  uploaded_at: string
}

export function KYCDocuments() {
  const { effectiveUserId, userData } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [existingDocuments, setExistingDocuments] = useState<ExistingDocument[]>([])
  
  const [documents, setDocuments] = useState<Documents>({
    identity_document: { file: null, preview: null, uploaded: false },
    address_proof: { file: null, preview: null, uploaded: false },
    selfie: { file: null, preview: null, uploaded: false },
    selfie_with_document: { file: null, preview: null, uploaded: false }
  })

  useEffect(() => {
    if (effectiveUserId) {
      loadExistingDocuments()
    }
  }, [effectiveUserId])

  const loadExistingDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('uploaded_at', { ascending: false })

      if (error) throw error

      setExistingDocuments(data || [])

      // Marcar documentos já enviados
      const updatedDocs = { ...documents }
      data?.forEach((doc) => {
        const docType = doc.document_type as keyof Documents
        if (updatedDocs[docType]) {
          updatedDocs[docType] = {
            ...updatedDocs[docType],
            uploaded: true,
            url: doc.file_url
          }
        }
      })
      setDocuments(updatedDocs)
    } catch (error) {
      console.error('Erro ao carregar documentos:', error)
    }
  }

  const handleFileSelect = (docType: keyof Documents, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      toast.error('Tipo de arquivo inválido. Use JPG, PNG, WEBP ou PDF.')
      return
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Tamanho máximo: 5MB')
      return
    }

    // Criar preview
    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null

    setDocuments(prev => ({
      ...prev,
      [docType]: { file, preview, uploaded: false }
    }))
  }

  const handleFileRemove = (docType: keyof Documents) => {
    if (documents[docType].preview) {
      URL.revokeObjectURL(documents[docType].preview!)
    }
    setDocuments(prev => ({
      ...prev,
      [docType]: { ...prev[docType], file: null, preview: null }
    }))
  }

  const uploadDocument = async (docType: keyof Documents) => {
    if (!effectiveUserId || !documents[docType].file) return false

    const file = documents[docType].file!
    const filePath = `${effectiveUserId}/${docType}_${Date.now()}.${file.name.split('.').pop()}`

    try {
      setUploadProgress(prev => ({ ...prev, [docType]: 0 }))

      // Upload para Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('kyc-documents')
        .getPublicUrl(filePath)

      // Salvar referência no banco
      const { error: dbError } = await supabase
        .from('kyc_documents')
        .upsert({
          user_id: effectiveUserId,
          document_type: docType,
          file_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type
        }, {
          onConflict: 'user_id,document_type'
        })

      if (dbError) throw dbError

      setUploadProgress(prev => ({ ...prev, [docType]: 100 }))
      setDocuments(prev => ({
        ...prev,
        [docType]: { ...prev[docType], uploaded: true, url: publicUrl }
      }))

      return true
    } catch (error: any) {
      console.error(`Erro ao fazer upload de ${docType}:`, error)
      toast.error(`Erro ao enviar ${getDocumentLabel(docType)}`)
      return false
    }
  }

  const handleUploadAll = async () => {
    const docsToUpload = (Object.keys(documents) as (keyof Documents)[]).filter(
      doc => documents[doc].file && !documents[doc].uploaded
    )

    if (docsToUpload.length === 0) {
      toast.error('Selecione pelo menos um documento para enviar')
      return
    }

    setLoading(true)
    try {
      const uploadPromises = docsToUpload.map(doc => uploadDocument(doc))
      const results = await Promise.all(uploadPromises)

      if (results.every(r => r)) {
        // Atualizar status do usuário se todos os documentos obrigatórios foram enviados
        const allRequiredUploaded = ['identity_document', 'address_proof', 'selfie', 'selfie_with_document']
          .every(doc => documents[doc as keyof Documents].uploaded || documents[doc as keyof Documents].file)

        if (allRequiredUploaded && userData?.kyc_status === 'pending') {
          await supabase
            .from('users')
            .update({
              kyc_status: 'awaiting_verification',
              kyc_submitted_at: new Date().toISOString()
            })
            .eq('id', effectiveUserId)
        }

        toast.success('Documentos enviados com sucesso!')
        loadExistingDocuments()
      } else {
        toast.error('Erro ao enviar alguns documentos. Tente novamente.')
      }
    } catch (error: any) {
      console.error('Erro ao enviar documentos:', error)
      toast.error('Erro ao enviar documentos')
    } finally {
      setLoading(false)
    }
  }

  const getDocumentLabel = (docType: keyof Documents) => {
    const labels = {
      identity_document: 'Documento de Identidade (RG, CPF ou CNH)',
      address_proof: 'Comprovante de Endereço',
      selfie: 'Selfie do Rosto',
      selfie_with_document: 'Selfie Segurando o Documento'
    }
    return labels[docType]
  }

  const getDocumentIcon = (docType: keyof Documents) => {
    const icons = {
      identity_document: FileText,
      address_proof: MapPin,
      selfie: Camera,
      selfie_with_document: Camera
    }
    return icons[docType]
  }

  const getStatusBadge = () => {
    switch (userData?.kyc_status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-sm font-medium">
            <Clock size={14} />
            Pendente
          </span>
        )
      case 'awaiting_verification':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-sm font-medium">
            <Clock size={14} />
            Aguardando Verificação
          </span>
        )
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-sm font-medium">
            <CheckCircle size={14} />
            Aprovado
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-sm font-medium">
            <XCircle size={14} />
            Rejeitado
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Documentos KYC</h1>
          <p className="text-muted-foreground">Gerencie seus documentos de verificação</p>
        </div>
        {getStatusBadge()}
      </div>

      {/* Status da Conta */}
      {userData?.kyc_status === 'rejected' && userData?.kyc_rejection_reason && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-500 mt-0.5" size={20} />
              <div>
                <h3 className="text-red-500 font-medium mb-1">KYC Rejeitado</h3>
                <p className="text-red-300 text-sm">
                  <strong>Motivo:</strong> {userData.kyc_rejection_reason}
                </p>
                <p className="text-red-300 text-sm mt-2">
                  Por favor, envie novos documentos para análise.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {userData?.kyc_status === 'awaiting_verification' && (
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Clock className="text-blue-500 mt-0.5" size={20} />
              <div>
                <h3 className="text-blue-500 font-medium mb-1">Documentos em Análise</h3>
                <p className="text-blue-300 text-sm">
                  Seus documentos foram enviados e estão sendo analisados pela nossa equipe.
                  Você será notificado assim que a análise for concluída.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {userData?.kyc_status === 'approved' && (
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-500 mt-0.5" size={20} />
              <div>
                <h3 className="text-green-500 font-medium mb-1">KYC Aprovado</h3>
                <p className="text-green-300 text-sm">
                  Sua conta foi verificada com sucesso! Você tem acesso completo a todas as funcionalidades.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload de Documentos */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Enviar Documentos</CardTitle>
          <CardDescription>
            Envie os documentos obrigatórios para verificação da sua identidade
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {(Object.keys(documents) as (keyof Documents)[]).map((docType) => {
            const Icon = getDocumentIcon(docType)
            const doc = documents[docType]

            return (
              <div key={docType} className="border border-border rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <Icon className="text-primary mt-1" size={20} />
                  <div className="flex-1">
                    <h3 className="text-foreground font-medium text-sm">
                      {getDocumentLabel(docType)}
                    </h3>
                    <p className="text-muted-foreground text-xs mt-1">
                      Formatos aceitos: JPG, PNG, PDF (máx. 5MB)
                    </p>
                  </div>
                  {doc.uploaded && (
                    <CheckCircle className="text-green-500" size={20} />
                  )}
                </div>

                {doc.uploaded && doc.url ? (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <p className="text-green-500 text-sm flex items-center gap-2">
                      <CheckCircle size={16} />
                      Documento enviado
                    </p>
                  </div>
                ) : !doc.file ? (
                  <label className="block">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                      onChange={(e) => handleFileSelect(docType, e)}
                      className="hidden"
                    />
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
                      <Upload className="mx-auto text-muted-foreground mb-2" size={32} />
                      <p className="text-foreground text-sm">
                        Clique para selecionar arquivo
                      </p>
                    </div>
                  </label>
                ) : (
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {doc.preview && (
                          <img
                            src={doc.preview}
                            alt="Preview"
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground text-sm truncate">
                            {doc.file.name}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {(doc.file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleFileRemove(docType)}
                        className="text-red-400 hover:text-red-300 ml-2"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    {uploadProgress[docType] !== undefined && (
                      <div className="mt-3">
                        <div className="w-full bg-muted-foreground/20 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${uploadProgress[docType]}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          <Button
            onClick={handleUploadAll}
            className="w-full"
            disabled={loading || Object.values(documents).every(doc => !doc.file || doc.uploaded)}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Enviar Documentos
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Histórico de Documentos */}
      {existingDocuments.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Histórico de Envios</CardTitle>
            <CardDescription>
              Documentos enviados anteriormente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {existingDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="text-primary" size={20} />
                    <div>
                      <p className="text-foreground text-sm font-medium">
                        {getDocumentLabel(doc.document_type as keyof Documents)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Enviado em {new Date(doc.uploaded_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <CheckCircle className="text-green-500" size={20} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
