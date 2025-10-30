import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FormField, FormLabel, FormMessage } from '@/components/ui/form'
import { toast } from 'sonner'
import { UserPlus, Mail, Lock, User, Building2, CreditCard, ArrowLeft, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { sendOTPEmail } from '@/lib/email'

export function Register() {
  const [step, setStep] = useState(1) // 1: Dados básicos, 2: Verificação OTP
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [documentType, setDocumentType] = useState<'cpf' | 'cnpj'>('cpf')
  const [document, setDocument] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [sentOTP, setSentOTP] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<any>({})
  const navigate = useNavigate()

  // Validar CPF
  const validateCPF = (cpf: string) => {
    cpf = cpf.replace(/\D/g, '')
    if (cpf.length !== 11) return false
    if (/^(\d)\1+$/.test(cpf)) return false

    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i)
    }
    let digit = 11 - (sum % 11)
    if (digit >= 10) digit = 0
    if (digit !== parseInt(cpf.charAt(9))) return false

    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i)
    }
    digit = 11 - (sum % 11)
    if (digit >= 10) digit = 0
    return digit === parseInt(cpf.charAt(10))
  }

  // Validar CNPJ
  const validateCNPJ = (cnpj: string) => {
    cnpj = cnpj.replace(/\D/g, '')
    if (cnpj.length !== 14) return false
    if (/^(\d)\1+$/.test(cnpj)) return false

    let length = cnpj.length - 2
    let numbers = cnpj.substring(0, length)
    const digits = cnpj.substring(length)
    let sum = 0
    let pos = length - 7

    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--
      if (pos < 2) pos = 9
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
    if (result !== parseInt(digits.charAt(0))) return false

    length = length + 1
    numbers = cnpj.substring(0, length)
    sum = 0
    pos = length - 7

    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--
      if (pos < 2) pos = 9
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
    return result === parseInt(digits.charAt(1))
  }

  // Formatar CPF
  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }

  // Formatar CNPJ
  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }

  const handleDocumentChange = (value: string) => {
    if (documentType === 'cpf') {
      setDocument(formatCPF(value))
    } else {
      setDocument(formatCNPJ(value))
    }
  }

  const validateStep1 = () => {
    const newErrors: any = {}

    if (!name || name.length < 3) {
      newErrors.name = 'Nome completo é obrigatório (mínimo 3 caracteres)'
    }

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email válido é obrigatório'
    }

    if (!password || password.length < 8) {
      newErrors.password = 'Senha deve ter no mínimo 8 caracteres'
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem'
    }

    const cleanDoc = document.replace(/\D/g, '')
    if (documentType === 'cpf') {
      if (!validateCPF(cleanDoc)) {
        newErrors.document = 'CPF inválido'
      }
    } else {
      if (!validateCNPJ(cleanDoc)) {
        newErrors.document = 'CNPJ inválido'
      }
      if (!companyName) {
        newErrors.companyName = 'Nome da empresa é obrigatório'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleStep1Submit = async () => {
    if (!validateStep1()) return

    setLoading(true)
    try {
      // Verificar se email já existe
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (existingUser) {
        setErrors({ email: 'Email já cadastrado' })
        setLoading(false)
        return
      }

      // Gerar código OTP de 6 dígitos
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      setSentOTP(otp)

      // Enviar email com código
      const emailResult = await sendOTPEmail(email, otp, 'register')
      
      if (!emailResult.success) {
        console.error('Erro ao enviar email:', emailResult.error)
        // Em desenvolvimento, continua mesmo se falhar
        console.log('Código OTP (fallback):', otp)
      }

      toast.success('Código enviado para seu email!')
      setStep(2)
    } catch (error: any) {
      toast.error('Erro ao processar cadastro')
    } finally {
      setLoading(false)
    }
  }

  const handleStep2Submit = async () => {
    if (otpCode !== sentOTP) {
      setErrors({ otpCode: 'Código inválido' })
      return
    }

    // Criar usuário diretamente após verificação OTP
    setLoading(true)
    try {
      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: 'user',
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Erro ao criar usuário')

      // Criar/Atualizar registro na tabela users
      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: authData.user.id,
          email: authData.user.email,
          name,
          document: document.replace(/\D/g, ''),
          document_type: documentType,
          company_name: documentType === 'cnpj' ? companyName : null,
          role: 'user',
          kyc_status: 'pending',
          kyc_submitted_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        })

      if (upsertError) {
        console.error('Erro ao criar registro do usuário:', upsertError)
        console.error('Detalhes do erro:', {
          code: upsertError.code,
          message: upsertError.message,
          details: upsertError.details,
          hint: upsertError.hint
        })
        
        // Mensagem de erro mais específica
        if (upsertError.code === '42P01') {
          toast.error('Erro: Tabela users não existe. Configure o Supabase primeiro!')
        } else if (upsertError.code === '42501') {
          toast.error('Erro: Permissões incorretas. Verifique RLS no Supabase!')
        } else {
          toast.error(`Erro ao criar perfil: ${upsertError.message}`)
        }
        
        await supabase.auth.signOut()
        return
      }
      
      toast.success('Conta criada com sucesso! Bem-vindo!')
      navigate('/')
    } catch (error: any) {
      toast.error('Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen bg-[#0a0e13] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/logo-dimpay.png" 
              alt="DiMPay" 
              className="h-16 w-auto"
            />
          </div>
          <p className="text-gray-400">Sistema de Pagamentos</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2].map((s) => (
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
              {step === 1 && <><UserPlus size={24} /> Dados Cadastrais</>}
              {step === 2 && <><Mail size={24} /> Verificação de Email</>}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {step === 1 && 'Preencha seus dados para criar sua conta'}
              {step === 2 && 'Digite o código enviado para seu email'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Dados Básicos */}
            {step === 1 && (
              <div className="space-y-4">
                <FormField>
                  <FormLabel>Nome Completo *</FormLabel>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-gray-400" size={18} />
                    <Input
                      type="text"
                      placeholder="João da Silva"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white pl-10"
                    />
                  </div>
                  {errors.email && <FormMessage>{errors.email}</FormMessage>}
                </FormField>

                <FormField>
                  <FormLabel>Tipo de Documento *</FormLabel>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant={documentType === 'cpf' ? 'default' : 'outline'}
                      onClick={() => {
                        setDocumentType('cpf')
                        setDocument('')
                        setCompanyName('')
                      }}
                      className={documentType === 'cpf' ? '' : 'border-gray-700'}
                    >
                      <CreditCard size={16} className="mr-2" />
                      CPF
                    </Button>
                    <Button
                      type="button"
                      variant={documentType === 'cnpj' ? 'default' : 'outline'}
                      onClick={() => {
                        setDocumentType('cnpj')
                        setDocument('')
                      }}
                      className={documentType === 'cnpj' ? '' : 'border-gray-700'}
                    >
                      <Building2 size={16} className="mr-2" />
                      CNPJ
                    </Button>
                  </div>
                </FormField>

                <FormField>
                  <FormLabel>{documentType === 'cpf' ? 'CPF' : 'CNPJ'} *</FormLabel>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 text-gray-400" size={18} />
                    <Input
                      type="text"
                      placeholder={documentType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                      value={document}
                      onChange={(e) => handleDocumentChange(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white pl-10"
                      maxLength={documentType === 'cpf' ? 14 : 18}
                    />
                  </div>
                  {errors.document && <FormMessage>{errors.document}</FormMessage>}
                </FormField>

                {documentType === 'cnpj' && (
                  <FormField>
                    <FormLabel>Nome da Empresa *</FormLabel>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 text-gray-400" size={18} />
                      <Input
                        type="text"
                        placeholder="Minha Empresa Ltda"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white pl-10"
                      />
                    </div>
                    {errors.companyName && <FormMessage>{errors.companyName}</FormMessage>}
                  </FormField>
                )}

                <FormField>
                  <FormLabel>Senha *</FormLabel>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white pl-10"
                    />
                  </div>
                  {errors.password && <FormMessage>{errors.password}</FormMessage>}
                  <p className="text-xs text-gray-400 mt-1">Mínimo 8 caracteres</p>
                </FormField>

                <FormField>
                  <FormLabel>Confirmar Senha *</FormLabel>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white pl-10"
                    />
                  </div>
                  {errors.confirmPassword && <FormMessage>{errors.confirmPassword}</FormMessage>}
                </FormField>

                <Button
                  onClick={handleStep1Submit}
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Processando...' : 'Continuar'}
                  <ArrowRight size={16} className="ml-2" />
                </Button>

                <div className="text-center text-sm text-gray-400">
                  Já tem uma conta?{' '}
                  <Link to="/login" className="text-primary hover:underline">
                    Fazer login
                  </Link>
                </div>
              </div>
            )}

            {/* Step 2: Verificação OTP */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-300 mb-2">
                    Enviamos um código de 6 dígitos para:
                  </p>
                  <p className="text-white font-medium">{email}</p>
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
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="bg-gray-800 border-gray-700 text-white text-center text-2xl tracking-widest"
                    maxLength={6}
                  />
                  {errors.otpCode && <FormMessage>{errors.otpCode}</FormMessage>}
                </FormField>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="flex-1 border-gray-700"
                  >
                    <ArrowLeft size={16} className="mr-2" />
                    Voltar
                  </Button>
                  <Button 
                    onClick={handleStep2Submit} 
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? 'Criando...' : 'Verificar e Criar Conta'}
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                </div>
              </div>
            )}

          </CardContent>
        </Card>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Ao criar uma conta, você concorda com nossos</p>
          <p>
            <a href="#" className="text-primary hover:underline">Termos de Serviço</a>
            {' e '}
            <a href="#" className="text-primary hover:underline">Política de Privacidade</a>
          </p>
        </div>
      </div>
    </div>
  )
}
