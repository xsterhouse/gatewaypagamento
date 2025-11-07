import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FormField, FormLabel, FormMessage } from '@/components/ui/form'
import { toast } from 'sonner'
import { sendOTPEmail } from '@/lib/email'
import { 
  UserPlus, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Calendar, 
  MapPin, 
  Upload, 
  FileText, 
  Camera, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight,
  Loader2,
  X
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface FormData {
  name: string
  email: string
  document: string
  documentType: 'cpf' | 'cnpj'
  phone: string
  birthDate: string
  password: string
  confirmPassword: string
  address: string
  city: string
  state: string
  zipCode: string
}

interface DocumentFile {
  file: File | null
  preview: string | null
  uploaded: boolean
}

interface Documents {
  identity_document: DocumentFile
  address_proof: DocumentFile
  selfie: DocumentFile
  selfie_with_document: DocumentFile
}

export function RegisterKYC() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: Dados Básicos, 2: Upload Documentos, 3: Verificação Email, 4: Confirmação
  const [loading, setLoading] = useState(false)
  
  // Debug
  console.log('RegisterKYC - Current Step:', step)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [sentOTP, setSentOTP] = useState('')
  const [otpCode, setOtpCode] = useState('')
  
  // Form data
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    document: '',
    documentType: 'cpf',
    phone: '',
    birthDate: '',
    password: '',
    confirmPassword: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  })

  // Documents
  const [documents, setDocuments] = useState<Documents>({
    identity_document: { file: null, preview: null, uploaded: false },
    address_proof: { file: null, preview: null, uploaded: false },
    selfie: { file: null, preview: null, uploaded: false },
    selfie_with_document: { file: null, preview: null, uploaded: false }
  })

  const [errors, setErrors] = useState<any>({})
  const [loadingCep, setLoadingCep] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null)

  // Validação Step 1
  const validateStep1 = () => {
    const newErrors: any = {}

    if (!formData.name || formData.name.length < 3) {
      newErrors.name = 'Nome completo é obrigatório (mínimo 3 caracteres)'
    }

    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email válido é obrigatório'
    }

    const cleanDocument = formData.document.replace(/\D/g, '')
    if (formData.documentType === 'cpf') {
      if (cleanDocument.length !== 11) {
        newErrors.document = 'CPF deve ter 11 dígitos'
      }
    } else {
      if (cleanDocument.length !== 14) {
        newErrors.document = 'CNPJ deve ter 14 dígitos'
      }
    }

    if (!formData.phone || formData.phone.length < 10) {
      newErrors.phone = 'Telefone válido é obrigatório'
    }

    if (!formData.birthDate) {
      newErrors.birthDate = 'Data de nascimento é obrigatória'
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Senha deve ter no mínimo 8 caracteres'
    } else if (formData.password.length > 15) {
      newErrors.password = 'Senha deve ter no máximo 15 caracteres'
    } else {
      const strength = checkPasswordStrength(formData.password)
      if (strength === 'weak') {
        newErrors.password = 'Senha muito fraca. Use letras maiúsculas, minúsculas, números e caracteres especiais'
      }
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle Step 1 Submit
  const handleStep1Submit = async () => {
    console.log('handleStep1Submit called')
    if (!validateStep1()) {
      console.log('Validation failed')
      return
    }

    console.log('Validation passed, moving to step 2')
    setLoading(true)
    try {
      // Verificar se email já existe
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', formData.email)
        .single()

      if (existingUser) {
        setErrors({ email: 'Email já cadastrado' })
        setLoading(false)
        return
      }

      toast.success('Dados validados! Agora envie seus documentos.')
      setStep(2)
    } catch (error: any) {
      console.error('Erro na validação:', error)
      toast.error('Erro ao validar dados')
    } finally {
      setLoading(false)
    }
  }

  // Handle file selection
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

  // Remove file
  const handleFileRemove = (docType: keyof Documents) => {
    if (documents[docType].preview) {
      URL.revokeObjectURL(documents[docType].preview!)
    }
    setDocuments(prev => ({
      ...prev,
      [docType]: { file: null, preview: null, uploaded: false }
    }))
  }

  // Upload documents
  const uploadDocument = async (docType: keyof Documents, uploadUserId: string) => {
    console.log(`📤 Starting upload for ${docType}`)
    console.log('User ID:', uploadUserId)
    console.log('File:', documents[docType].file)
    
    if (!uploadUserId || !documents[docType].file) {
      console.error(`❌ Upload failed: userId=${uploadUserId}, file=${documents[docType].file}`)
      return false
    }

    const file = documents[docType].file!
    const filePath = `${uploadUserId}/${docType}_${Date.now()}.${file.name.split('.').pop()}`
    console.log('File path:', filePath)

    try {
      setUploadProgress(prev => ({ ...prev, [docType]: 0 }))

      console.log('📦 Uploading to storage...')
      
      // Check if bucket exists first
      const { data: buckets } = await supabase.storage.listBuckets()
      const bucketExists = buckets?.some(b => b.name === 'kyc-documents')
      
      if (!bucketExists) {
        console.error('❌ Bucket kyc-documents does not exist!')
        throw new Error('Bucket de documentos não encontrado. Contate o administrador.')
      }
      
      // Upload para Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('❌ Storage upload error:', uploadError)
        throw uploadError
      }
      console.log('✅ Storage upload successful')

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('kyc-documents')
        .getPublicUrl(filePath)
      
      console.log('📎 Public URL:', publicUrl)

      console.log('💾 Saving to database...')
      // Salvar referência no banco
      const { error: dbError } = await supabase
        .from('kyc_documents')
        .upsert({
          user_id: uploadUserId,
          document_type: docType,
          file_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type
        }, {
          onConflict: 'user_id,document_type'
        })

      if (dbError) {
        console.error('❌ Database save error:', dbError)
        throw dbError
      }
      console.log('✅ Database save successful')

      setUploadProgress(prev => ({ ...prev, [docType]: 100 }))
      setDocuments(prev => ({
        ...prev,
        [docType]: { ...prev[docType], uploaded: true }
      }))

      console.log(`✅ Upload complete for ${docType}`)
      return true
    } catch (error: any) {
      console.error(`❌ Fatal error uploading ${docType}:`, error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      toast.error(`Erro ao enviar ${getDocumentLabel(docType)}: ${error.message}`)
      return false
    }
  }

  // Validate documents and move to email verification
  const handleStep2Submit = async () => {
    // Verificar se todos os documentos foram selecionados
    const requiredDocs: (keyof Documents)[] = [
      'identity_document',
      'address_proof',
      'selfie',
      'selfie_with_document'
    ]

    const missingDocs = requiredDocs.filter(doc => !documents[doc].file)
    if (missingDocs.length > 0) {
      toast.error('Por favor, selecione todos os documentos obrigatórios')
      return
    }

    setLoading(true)
    try {
      // Gerar código OTP de 6 dígitos
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      setSentOTP(otp)

      // Enviar email com código
      console.log('🔄 Tentando enviar email para:', formData.email)
      const emailResult = await sendOTPEmail(formData.email, otp, 'register')
      
      if (!emailResult.success) {
        console.error('❌ Erro ao enviar email:', emailResult.error)
        console.log('⚠️ Código OTP (use este código):', otp)
        toast.error(`Erro ao enviar email: ${emailResult.error}`)
        toast.info(`Código de teste: ${otp}`, { duration: 10000 })
        // Continua para o step 3 mesmo com erro (modo desenvolvimento)
      } else {
        console.log('✅ Email enviado com sucesso!')
        toast.success('Documentos selecionados! Código enviado para seu email.')
      }

      setStep(3)
    } catch (error: any) {
      console.error('Erro:', error)
      toast.error('Erro ao processar')
    } finally {
      setLoading(false)
    }
  }

  // Handle Step 3 - Email Verification and Account Creation
  const handleStep3Submit = async () => {
    console.log('Step 3 - Starting account creation')
    
    if (otpCode !== sentOTP) {
      console.log('OTP validation failed')
      setErrors({ otpCode: 'Código inválido' })
      return
    }

    console.log('OTP validated successfully')
    setLoading(true)
    
    try {
      console.log('Creating user in Supabase Auth...')
      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: 'user',
          }
        }
      })

      if (authError) {
        console.error('Auth error:', authError)
        throw authError
      }
      if (!authData.user) {
        console.error('No user data returned')
        throw new Error('Erro ao criar usuário')
      }

      console.log('User created successfully:', authData.user.id)
      console.log('Creating user record in database...')
      // Criar registro na tabela users com status "pending"
      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: authData.user.id,
          email: authData.user.email,
          name: formData.name,
          document: formData.document.replace(/\D/g, ''),
          document_type: formData.documentType,
          phone: formData.phone,
          birth_date: formData.birthDate,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zipCode,
          role: 'user',
          kyc_status: 'pending',
          kyc_submitted_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        })

      if (upsertError) {
        console.error('Database error:', upsertError)
        console.error('Error details:', {
          code: upsertError.code,
          message: upsertError.message,
          details: upsertError.details,
          hint: upsertError.hint
        })
        toast.error(`Erro ao criar perfil: ${upsertError.message}`)
        await supabase.auth.signOut()
        return
      }

      console.log('User record created successfully')
      console.log('Starting document upload...')
      console.log('Using user ID for upload:', authData.user.id)

      // Upload de todos os documentos
      const requiredDocs: (keyof Documents)[] = [
        'identity_document',
        'address_proof',
        'selfie',
        'selfie_with_document'
      ]

      const uploadPromises = requiredDocs.map(doc => uploadDocument(doc, authData.user!.id))
      const results = await Promise.all(uploadPromises)

      console.log('Upload results:', results)

      if (results.every(r => r)) {
        console.log('All documents uploaded successfully')
        console.log('Updating user status to awaiting_verification...')
        
        // Atualizar status para "awaiting_verification"
        const { error } = await supabase
          .from('users')
          .update({
            kyc_status: 'awaiting_verification',
            kyc_submitted_at: new Date().toISOString()
          })
          .eq('id', authData.user.id)

        if (error) {
          console.error('Error updating status:', error)
          throw error
        }

        console.log('Status updated successfully')
        toast.success('Conta criada e documentos enviados com sucesso!')
        setStep(4)
      } else {
        console.error('Some documents failed to upload')
        toast.error('Erro ao enviar alguns documentos. Tente novamente.')
      }
    } catch (error: any) {
      console.error('Fatal error in handleStep3Submit:', error)
      toast.error(`Erro ao criar conta: ${error.message || 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  // Get document label
  const getDocumentLabel = (docType: keyof Documents) => {
    const labels = {
      identity_document: 'Documento de Identidade (RG, CPF ou CNH)',
      address_proof: 'Comprovante de Endereço',
      selfie: 'Selfie do Rosto',
      selfie_with_document: 'Selfie Segurando o Documento'
    }
    return labels[docType]
  }

  // Get document icon
  const getDocumentIcon = (docType: keyof Documents) => {
    const icons = {
      identity_document: FileText,
      address_proof: MapPin,
      selfie: Camera,
      selfie_with_document: Camera
    }
    return icons[docType]
  }

  // Check password strength
  const checkPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
    if (password.length < 8) return 'weak'

    // Verificar senhas sequenciais
    const sequential = ['12345678', '87654321', 'abcdefgh', 'qwertyui', '11111111', '00000000']
    if (sequential.some(seq => password.toLowerCase().includes(seq))) {
      return 'weak'
    }

    // Verificar padrões repetitivos
    if (/(.)\1{3,}/.test(password)) return 'weak'

    let strength = 0

    // Tem letra minúscula
    if (/[a-z]/.test(password)) strength++
    
    // Tem letra maiúscula
    if (/[A-Z]/.test(password)) strength++
    
    // Tem número
    if (/[0-9]/.test(password)) strength++
    
    // Tem caractere especial
    if (/[^A-Za-z0-9]/.test(password)) strength++

    // Tem tamanho adequado
    if (password.length >= 12) strength++

    if (strength <= 2) return 'weak'
    if (strength === 3) return 'medium'
    return 'strong'
  }

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password })
    if (password.length > 0) {
      setPasswordStrength(checkPasswordStrength(password))
    } else {
      setPasswordStrength(null)
    }
  }

  // Fetch address by CEP
  const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '')
    
    if (cleanCep.length !== 8) return

    setLoadingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data = await response.json()

      if (!data.erro) {
        setFormData({
          ...formData,
          zipCode: cep,
          address: data.logradouro || '',
          city: data.localidade || '',
          state: data.uf || ''
        })
        toast.success('Endereço encontrado!')
      } else {
        toast.error('CEP não encontrado')
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
      toast.error('Erro ao buscar CEP')
    } finally {
      setLoadingCep(false)
    }
  }

  // Format phone
  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1')
  }

  // Format CEP
  const formatZipCode = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1')
  }

  return (
    <div className="min-h-screen bg-[#0a0e13] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/logo-dimpay.png" 
              alt="DiMPay" 
              className="h-16 w-auto"
            />
          </div>
          <p className="text-gray-400">Cadastro de Conta - Pessoa Física</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-primary' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        <Card className="bg-[#1a1f2e] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              {step === 1 && <><UserPlus size={24} /> Dados Básicos</>}
              {step === 2 && <><Upload size={24} /> Upload de Documentos</>}
              {step === 3 && <><Mail size={24} /> Verificação de Email</>}
              {step === 4 && <><CheckCircle size={24} /> Cadastro Concluído</>}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {step === 1 && 'Preencha seus dados pessoais'}
              {step === 2 && 'Selecione os documentos obrigatórios para verificação'}
              {step === 3 && 'Digite o código enviado para seu email'}
              {step === 4 && 'Sua conta está em análise'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Dados Básicos */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField className="md:col-span-2">
                    <FormLabel>Nome Completo *</FormLabel>
                    <div className="relative">
                      <User className="absolute left-3 top-3 text-gray-400" size={18} />
                      <Input
                        type="text"
                        placeholder="João da Silva"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="bg-gray-800 border-gray-700 text-white pl-10"
                      />
                    </div>
                    {errors.name && <FormMessage>{errors.name}</FormMessage>}
                  </FormField>

                  <FormField>
                    <FormLabel>Email *</FormLabel>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="bg-gray-800 border-gray-700 text-white pl-10"
                      />
                    </div>
                    {errors.email && <FormMessage>{errors.email}</FormMessage>}
                  </FormField>

                  <FormField>
                    <FormLabel>CPF/CNPJ *</FormLabel>
                    <div className="space-y-2">
                      <div className="flex gap-2 mb-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, documentType: 'cpf', document: '' })}
                          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                            formData.documentType === 'cpf'
                              ? 'bg-primary text-black'
                              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                          }`}
                        >
                          CPF
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, documentType: 'cnpj', document: '' })}
                          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                            formData.documentType === 'cnpj'
                              ? 'bg-primary text-black'
                              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                          }`}
                        >
                          CNPJ
                        </button>
                      </div>
                      <div className="relative">
                        <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
                        <Input
                          type="text"
                          placeholder={formData.documentType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                          value={formData.document}
                          onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                          className="bg-gray-800 border-gray-700 text-white pl-10"
                        />
                      </div>
                    </div>
                    {errors.document && <FormMessage>{errors.document}</FormMessage>}
                  </FormField>

                  <FormField>
                    <FormLabel>Telefone *</FormLabel>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                      <Input
                        type="text"
                        placeholder="(11) 99999-9999"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                        className="bg-gray-800 border-gray-700 text-white pl-10"
                        maxLength={15}
                      />
                    </div>
                    {errors.phone && <FormMessage>{errors.phone}</FormMessage>}
                  </FormField>

                  <FormField className="md:col-span-2">
                    <FormLabel>Data de Nascimento *</FormLabel>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
                      <Input
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                        className="bg-gray-800 border-gray-700 text-white pl-10"
                      />
                    </div>
                    {errors.birthDate && <FormMessage>{errors.birthDate}</FormMessage>}
                  </FormField>

                  <FormField className="md:col-span-2">
                    <FormLabel>CEP (opcional)</FormLabel>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                      <Input
                        type="text"
                        placeholder="00000-000"
                        value={formData.zipCode}
                        onChange={(e) => {
                          const formatted = formatZipCode(e.target.value)
                          setFormData({ ...formData, zipCode: formatted })
                        }}
                        onBlur={(e) => fetchAddressByCep(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white pl-10"
                        maxLength={9}
                        disabled={loadingCep}
                      />
                      {loadingCep && (
                        <Loader2 className="absolute right-3 top-3 text-primary animate-spin" size={18} />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      💡 Digite o CEP e o endereço será preenchido automaticamente
                    </p>
                  </FormField>

                  <FormField className="md:col-span-2">
                    <FormLabel>Endereço (opcional)</FormLabel>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                      <Input
                        type="text"
                        placeholder="Rua, número, complemento"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="bg-gray-800 border-gray-700 text-white pl-10"
                      />
                    </div>
                  </FormField>

                  <FormField>
                    <FormLabel>Cidade (opcional)</FormLabel>
                    <Input
                      type="text"
                      placeholder="São Paulo"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </FormField>

                  <FormField>
                    <FormLabel>Estado (opcional)</FormLabel>
                    <Input
                      type="text"
                      placeholder="SP"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                      className="bg-gray-800 border-gray-700 text-white"
                      maxLength={2}
                    />
                  </FormField>

                  <FormField>
                    <FormLabel>Senha *</FormLabel>
                    <div className="space-y-2">
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                        <Input
                          type="password"
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={(e) => handlePasswordChange(e.target.value)}
                          className="bg-gray-800 border-gray-700 text-white pl-10"
                          maxLength={15}
                        />
                      </div>
                      
                      {/* Password Strength Bar */}
                      {passwordStrength && (
                        <div className="space-y-1">
                          <div className="flex gap-1">
                            <div className={`h-1 flex-1 rounded-full transition-colors ${
                              passwordStrength === 'weak' ? 'bg-red-500' :
                              passwordStrength === 'medium' ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`} />
                            <div className={`h-1 flex-1 rounded-full transition-colors ${
                              passwordStrength === 'medium' || passwordStrength === 'strong' ? 
                              (passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-500') : 
                              'bg-gray-700'
                            }`} />
                            <div className={`h-1 flex-1 rounded-full transition-colors ${
                              passwordStrength === 'strong' ? 'bg-green-500' : 'bg-gray-700'
                            }`} />
                          </div>
                          <p className={`text-xs ${
                            passwordStrength === 'weak' ? 'text-red-400' :
                            passwordStrength === 'medium' ? 'text-yellow-400' :
                            'text-green-400'
                          }`}>
                            {passwordStrength === 'weak' && '❌ Senha fraca'}
                            {passwordStrength === 'medium' && '⚠️ Senha média'}
                            {passwordStrength === 'strong' && '✅ Senha forte'}
                          </p>
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-400">
                        8-15 caracteres • Letras maiúsculas e minúsculas • Números • Caracteres especiais
                      </p>
                    </div>
                    {errors.password && <FormMessage>{errors.password}</FormMessage>}
                  </FormField>

                  <FormField>
                    <FormLabel>Confirmar Senha *</FormLabel>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="bg-gray-800 border-gray-700 text-white pl-10"
                        maxLength={15}
                      />
                    </div>
                    {errors.confirmPassword && <FormMessage>{errors.confirmPassword}</FormMessage>}
                  </FormField>
                </div>

                <Button
                  onClick={handleStep1Submit}
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      Continuar
                      <ArrowRight size={16} className="ml-2" />
                    </>
                  )}
                </Button>

                <div className="text-center text-sm text-gray-400">
                  Já tem uma conta?{' '}
                  <Link to="/login" className="text-primary hover:underline">
                    Fazer login
                  </Link>
                </div>
              </div>
            )}

            {/* Step 2: Upload de Documentos */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-yellow-200 text-sm">
                    📋 Envie os 4 documentos abaixo para verificação da sua identidade.
                    Todos os arquivos devem estar legíveis e em formato JPG, PNG ou PDF.
                  </p>
                </div>

                {(['identity_document', 'address_proof', 'selfie', 'selfie_with_document'] as (keyof Documents)[]).map((docType) => {
                  const Icon = getDocumentIcon(docType)
                  const doc = documents[docType]

                  return (
                    <div key={docType} className="border border-gray-700 rounded-lg p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <Icon className="text-primary mt-1" size={20} />
                        <div className="flex-1">
                          <h3 className="text-white font-medium text-sm">
                            {getDocumentLabel(docType)}
                          </h3>
                          <p className="text-gray-400 text-xs mt-1">
                            Formatos aceitos: JPG, PNG, PDF (máx. 5MB)
                          </p>
                        </div>
                        {doc.uploaded && (
                          <CheckCircle className="text-green-500" size={20} />
                        )}
                      </div>

                      {!doc.file ? (
                        <label className="block">
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                            onChange={(e) => handleFileSelect(docType, e)}
                            className="hidden"
                          />
                          <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
                            <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                            <p className="text-gray-300 text-sm">
                              Clique para selecionar arquivo
                            </p>
                          </div>
                        </label>
                      ) : (
                        <div className="bg-gray-800/50 rounded-lg p-3">
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
                                <p className="text-white text-sm truncate">
                                  {doc.file.name}
                                </p>
                                <p className="text-gray-400 text-xs">
                                  {(doc.file.size / 1024).toFixed(2)} KB
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleFileRemove(docType)}
                              className="text-red-400 hover:text-red-300 ml-2"
                              disabled={doc.uploaded}
                            >
                              <X size={20} />
                            </button>
                          </div>
                          {uploadProgress[docType] !== undefined && (
                            <div className="mt-3">
                              <div className="w-full bg-gray-700 rounded-full h-2">
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

                <div className="flex gap-3">
                  <Button
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="flex-1 border-gray-700"
                    disabled={loading}
                  >
                    <ArrowLeft size={16} className="mr-2" />
                    Voltar
                  </Button>
                  <Button 
                    onClick={handleStep2Submit} 
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        Continuar
                        <ArrowRight size={16} className="ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Verificação de Email */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-300 mb-2">
                    Enviamos um código de 6 dígitos para:
                  </p>
                  <p className="text-white font-medium">{formData.email}</p>
                </div>

                {/* Código OTP em Destaque */}
                <div className="bg-gradient-to-r from-primary/20 to-cyan-500/20 border-2 border-primary rounded-lg p-6">
                  <div className="text-center space-y-3">
                    <p className="text-sm text-gray-300">
                      💡 <strong>MODO DESENVOLVIMENTO</strong>
                    </p>
                    <p className="text-xs text-gray-400">
                      Use o código abaixo para continuar:
                    </p>
                    <div className="bg-gray-900/50 rounded-lg p-4">
                      <p className="text-primary font-mono text-3xl font-bold tracking-[0.5em]">
                        {sentOTP}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      ⚠️ Em produção, o código será enviado por email
                    </p>
                  </div>
                </div>

                <FormField>
                  <FormLabel>Código de Verificação</FormLabel>
                  <Input
                    type="text"
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => {
                      setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                      setErrors({})
                    }}
                    className="bg-gray-800 border-gray-700 text-white text-center text-2xl tracking-widest"
                    maxLength={6}
                  />
                  {errors.otpCode && <FormMessage>{errors.otpCode}</FormMessage>}
                </FormField>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setStep(2)}
                    variant="outline"
                    className="flex-1 border-gray-700"
                    disabled={loading}
                  >
                    <ArrowLeft size={16} className="mr-2" />
                    Voltar
                  </Button>
                  <Button 
                    onClick={handleStep3Submit} 
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando conta...
                      </>
                    ) : (
                      <>
                        Verificar e Criar Conta
                        <ArrowRight size={16} className="ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Confirmação */}
            {step === 4 && (
              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center">
                    <CheckCircle className="text-green-500" size={40} />
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Cadastro Concluído!
                  </h3>
                  <p className="text-gray-400">
                    Sua conta está em análise pela nossa equipe
                  </p>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-left">
                  <p className="text-yellow-200 text-sm mb-3">
                    <strong>Próximos passos:</strong>
                  </p>
                  <ul className="space-y-2 text-yellow-200 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Nossa equipe irá analisar seus documentos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Você receberá um email assim que a análise for concluída</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>O processo pode levar até 24 horas úteis</span>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => navigate('/')}
                    className="w-full"
                    size="lg"
                  >
                    Acessar Página Inicial
                  </Button>
                  
                  <Button
                    onClick={() => navigate('/login')}
                    variant="outline"
                    className="w-full border-gray-700"
                  >
                    Fazer Login
                  </Button>
                </div>

                <p className="text-xs text-gray-500 mt-4">
                  💡 Você pode fazer login agora e acompanhar o status da sua análise
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-4 text-center">
          <Link 
            to="/login" 
            className="text-sm text-gray-400 hover:text-primary transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Voltar para a página de login
          </Link>
        </div>
      </div>
    </div>
  )
}
