import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FormField, FormLabel, FormMessage } from '@/components/ui/form'
import { toast } from 'sonner'
import { Lock, Key, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function ResetPassword() {
  const location = useLocation()
  const navigate = useNavigate()
  const email = location.state?.email || ''

  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<any>({})

  const validateForm = () => {
    const newErrors: any = {}

    if (!code || code.length !== 6) {
      newErrors.code = 'Código deve ter 6 dígitos'
    }

    if (!newPassword) {
      newErrors.newPassword = 'Nova senha é obrigatória'
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Senha deve ter no mínimo 8 caracteres'
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    try {
      // Verificar código OTP
      const { data: token } = await supabase
        .from('password_reset_tokens')
        .select('*, users(id)')
        .eq('token', code)
        .single()

      if (!token) {
        setErrors({ code: 'Código inválido' })
        setLoading(false)
        return
      }

      // Verificar se expirou
      if (new Date(token.expires_at) < new Date()) {
        setErrors({ code: 'Código expirado' })
        setLoading(false)
        return
      }

      // Atualizar senha (em produção, usar hash bcrypt)
      await supabase
        .from('users')
        .update({ password: newPassword })
        .eq('id', token.user_id)

      // Deletar token usado
      await supabase
        .from('password_reset_tokens')
        .delete()
        .eq('id', token.id)

      toast.success('Senha redefinida com sucesso!')
      navigate('/login')
    } catch (error: any) {
      toast.error('Erro ao redefinir senha')
    } finally {
      setLoading(false)
    }
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
          <p className="text-gray-400">Redefinir Senha</p>
        </div>

        <Card className="bg-[#1a1f2e] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Nova Senha</CardTitle>
            <CardDescription className="text-gray-400">
              Digite o código enviado para {email} e sua nova senha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField>
                <FormLabel>Código de Verificação</FormLabel>
                <div className="relative">
                  <Key className="absolute left-3 top-3 text-gray-400" size={18} />
                  <Input
                    type="text"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="bg-gray-800 border-gray-700 text-white pl-10 text-center text-2xl tracking-widest"
                    maxLength={6}
                  />
                </div>
                {errors.code && <FormMessage>{errors.code}</FormMessage>}
              </FormField>

              <FormField>
                <FormLabel>Nova Senha</FormLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white pl-10"
                  />
                </div>
                {errors.newPassword && <FormMessage>{errors.newPassword}</FormMessage>}
              </FormField>

              <FormField>
                <FormLabel>Confirmar Nova Senha</FormLabel>
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Redefinindo...' : 'Redefinir Senha'}
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
