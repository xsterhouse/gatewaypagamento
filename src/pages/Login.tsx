import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField, FormLabel, FormMessage } from '@/components/ui/form'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const navigate = useNavigate()

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {}

    if (!email) {
      newErrors.email = 'Email é obrigatório'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email inválido'
    }

    if (!password) {
      newErrors.password = 'Senha é obrigatória'
    } else if (password.length < 6) {
      newErrors.password = 'Senha deve ter no mínimo 6 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        console.error('Erro no login:', authError)
        toast.error('Email ou senha incorretos')
        return
      }

      if (!authData.user) {
        toast.error('Erro ao fazer login')
        return
      }

      let { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (userError && userError.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: authData.user.email || email,
            name: authData.user.user_metadata?.name || email.split('@')[0],
            role: 'user',
            status: 'active',
            kyc_status: 'pending',
          })

        if (insertError) {
          console.error('Erro ao criar registro do usuário:', insertError)
          toast.error('Erro ao criar perfil do usuário')
          await supabase.auth.signOut()
          return
        }

        const { data: newUserData, error: newUserError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single()

        if (newUserError || !newUserData) {
          console.error('Erro ao buscar dados do novo usuário:', newUserError)
          toast.error('Erro ao carregar dados do usuário')
          await supabase.auth.signOut()
          return
        }

        userData = newUserData
      } else if (userError || !userData) {
        console.error('Erro ao buscar dados do usuário:', userError)
        toast.error('Erro ao carregar dados do usuário')
        await supabase.auth.signOut()
        return
      }

      if (userData?.status === 'suspended') {
        toast.error('Sua conta está suspensa. Entre em contato com o suporte.')
        await supabase.auth.signOut()
        return
      }

      if (userData?.status === 'blocked') {
        toast.error('Sua conta está bloqueada. Entre em contato com o suporte.')
        await supabase.auth.signOut()
        return
      }

      toast.success('Login realizado com sucesso!')
      
      if (userData.role === 'admin') {
        navigate('/admin/dashboard')
      } else {
        navigate('/')
      }
    } catch (error: any) {
      console.error('Erro no login:', error)
      toast.error('Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Lado Esquerdo - Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#1a1d29]">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-10">
            <img 
              src="/logo-dimpay.png" 
              alt="DiMPay" 
              className="h-16 w-auto mb-2"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                const fallback = document.createElement('div')
                fallback.className = 'text-3xl font-bold text-primary'
                fallback.textContent = 'DiMPay'
                e.currentTarget.parentElement?.appendChild(fallback)
              }}
            />
          </div>

          {/* Título */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Acesse sua conta</h1>
            <p className="text-gray-400 text-sm">Insira os dados para realizar seu login em nossa plataforma.</p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <FormField>
              <FormLabel className="text-white text-sm font-medium">Email *</FormLabel>
              <Input
                type="email"
                placeholder="Digite seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#2a2f3f] border-[#3a3f4f] text-white placeholder:text-gray-500 h-12 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
              {errors.email && <FormMessage className="text-red-400 text-xs mt-1">{errors.email}</FormMessage>}
            </FormField>

            <FormField>
              <FormLabel className="text-white text-sm font-medium">Senha *</FormLabel>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#2a2f3f] border-[#3a3f4f] text-white placeholder:text-gray-500 h-12 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <FormMessage className="text-red-400 text-xs mt-1">{errors.password}</FormMessage>}
            </FormField>

            <div className="flex items-center justify-end">
              <Link 
                to="/forgot-password" 
                className="text-primary text-sm hover:underline transition-all"
              >
                Esqueceu a senha?
              </Link>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold rounded-lg bg-white text-black hover:bg-gray-100 transition-all shadow-lg" 
              disabled={loading}
            >
              {loading ? 'Acessando...' : 'Acessar'}
            </Button>

            <div className="text-center text-sm text-gray-400 pt-2">
              <span>Ainda não possui uma conta? </span>
              <Link 
                to="/register" 
                className="text-white font-semibold hover:text-primary transition-colors"
              >
                Criar conta agora.
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Lado Direito - Background com Imagem */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0f1117] flex-col items-center justify-center p-12">
        {/* Imagem de Fundo ou Gradiente Fallback */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/login-bg.jpg), linear-gradient(135deg, #1a1d29 0%, #0f1117 50%, #1a1d29 100%)',
            filter: 'brightness(0.3)'
          }}
        ></div>
        
        {/* Padrão Hexagonal de Fundo */}
        <div className="absolute inset-0 hexagon-pattern opacity-5"></div>
        
        {/* Overlay escuro */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60"></div>
        
        {/* Círculos decorativos */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        
        {/* Conteúdo Central */}
        <div className="relative z-10 max-w-md text-left flex items-center h-full">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-40 bg-primary rounded-full shadow-lg shadow-primary/50"></div>
            <div>
              <h2 className="text-white text-6xl font-bold tracking-tight leading-tight drop-shadow-lg">
                INOVAÇÃO
              </h2>
              <h3 className="text-white text-4xl font-light tracking-wider mt-2 drop-shadow-lg">
                FUTURO
              </h3>
              <h3 className="text-white text-4xl font-light tracking-wider mt-2 drop-shadow-lg">
                TECNOLOGIA
              </h3>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .hexagon-pattern {
          background-image: 
            repeating-linear-gradient(0deg, transparent, transparent 35px, rgba(255, 255, 255, 0.03) 35px, rgba(255, 255, 255, 0.03) 70px),
            repeating-linear-gradient(60deg, transparent, transparent 35px, rgba(255, 255, 255, 0.03) 35px, rgba(255, 255, 255, 0.03) 70px),
            repeating-linear-gradient(120deg, transparent, transparent 35px, rgba(255, 255, 255, 0.03) 35px, rgba(255, 255, 255, 0.03) 70px);
        }
      `}</style>
    </div>
  )
}
