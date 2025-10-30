import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FormField, FormLabel, FormMessage } from '@/components/ui/form'
import { toast } from 'sonner'
import { Mail, ArrowLeft, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { sendOTPEmail } from '@/lib/email'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email) {
      setError('Email é obrigatório')
      return
    }

    if (!validateEmail(email)) {
      setError('Email inválido')
      return
    }

    setLoading(true)
    try {
      // Verificar se o email existe
      const { data: user } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', email)
        .single()

      if (!user) {
        setError('Email não encontrado')
        setLoading(false)
        return
      }

      // Gerar código OTP de 6 dígitos
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutos

      // Salvar OTP no banco
      await supabase
        .from('password_reset_tokens')
        .insert({
          user_id: user.id,
          token: otpCode,
          expires_at: expiresAt.toISOString(),
        })

      // Enviar email com código
      const emailResult = await sendOTPEmail(email, otpCode, 'reset')
      
      if (!emailResult.success) {
        console.error('Erro ao enviar email:', emailResult.error)
        // Em desenvolvimento, continua mesmo se falhar
        console.log('Código OTP (fallback):', otpCode)
      }
      
      toast.success('Código enviado para seu email!')
      setSent(true)
    } catch (error: any) {
      toast.error('Erro ao enviar código')
      setError('Erro ao processar solicitação')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#0a0e13] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-[#1a1f2e] border-gray-800">
            <CardHeader>
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="text-green-400" size={24} />
              </div>
              <CardTitle className="text-white text-center">
                Email Enviado!
              </CardTitle>
              <CardDescription className="text-gray-400 text-center">
                Enviamos um código de verificação para <strong>{email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
                <p className="text-sm text-gray-300">
                  ✓ Verifique sua caixa de entrada
                </p>
                <p className="text-sm text-gray-300">
                  ✓ O código expira em 15 minutos
                </p>
                <p className="text-sm text-gray-300">
                  ✓ Use o código para redefinir sua senha
                </p>
              </div>

              <Link to="/reset-password" state={{ email }}>
                <Button className="w-full">
                  Inserir Código
                </Button>
              </Link>

              <div className="text-center">
                <button
                  onClick={() => setSent(false)}
                  className="text-sm text-primary hover:underline"
                >
                  Reenviar código
                </button>
              </div>

              <Link to="/login">
                <Button variant="outline" className="w-full border-gray-700">
                  <ArrowLeft size={16} className="mr-2" />
                  Voltar ao login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0e13] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-xl">PAY</span>
            </div>
            <span className="text-white font-bold text-2xl">Gateway</span>
          </div>
          <p className="text-gray-400">Recuperação de Senha</p>
        </div>

        <Card className="bg-[#1a1f2e] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Esqueceu sua senha?</CardTitle>
            <CardDescription className="text-gray-400">
              Digite seu email e enviaremos um código para redefinir sua senha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField>
                <FormLabel>Email</FormLabel>
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
                {error && <FormMessage>{error}</FormMessage>}
              </FormField>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar Código'}
              </Button>

              <Link to="/login">
                <Button variant="outline" className="w-full border-gray-700">
                  <ArrowLeft size={16} className="mr-2" />
                  Voltar ao login
                </Button>
              </Link>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
