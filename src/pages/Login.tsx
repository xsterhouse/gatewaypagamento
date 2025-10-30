import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField, FormLabel, FormMessage } from '@/components/ui/form'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
      // Login com Supabase Auth
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

      // Buscar dados do usuário na tabela users
      let { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      // Se usuário não existe na tabela users, criar registro
      if (userError && userError.code === 'PGRST116') {
        console.log('Usuário não encontrado na tabela, criando registro...')
        
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

        // Buscar novamente após criar
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

      // Verificar se conta está suspensa ou bloqueada
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
      
      // Redirecionar admin para painel admin, usuário normal para dashboard cliente
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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-[#0a0e13] via-[#1a1f2e] to-[#0f172a]">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-2">
              <img 
                src="/logo-dimpay.png" 
                alt="DiMPay" 
                className="h-12 w-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  const fallback = document.createElement('div')
                  fallback.className = 'text-2xl font-bold text-primary'
                  fallback.textContent = 'DiMPay'
                  e.currentTarget.parentElement?.appendChild(fallback)
                }}
              />
            </div>
            <p className="text-gray-400 text-sm">Sistema de Pagamentos Inteligente</p>
          </div>

          {/* Título */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Faça seu Login.</h1>
            <p className="text-gray-400">Acesse sua conta para continuar</p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField>
              <FormLabel className="text-white text-sm mb-2">Email</FormLabel>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent border-2 border-gray-700 text-white placeholder:text-gray-500 h-12 rounded-xl focus:border-primary transition-colors"
              />
              {errors.email && <FormMessage>{errors.email}</FormMessage>}
            </FormField>

            <FormField>
              <FormLabel className="text-white text-sm mb-2">Senha</FormLabel>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent border-2 border-gray-700 text-white placeholder:text-gray-500 h-12 rounded-xl focus:border-primary transition-colors"
              />
              {errors.password && <FormMessage>{errors.password}</FormMessage>}
            </FormField>

            <div className="flex items-center justify-end text-sm">
              <Link 
                to="/forgot-password" 
                className="text-white hover:text-primary transition-colors underline"
              >
                Esqueci minha senha
              </Link>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-medium rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all shadow-lg hover:shadow-primary/50" 
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>

            <div className="text-center text-sm text-gray-400 pt-4">
              <Link 
                to="/register" 
                className="text-white hover:text-primary transition-colors underline"
              >
                Ainda não tenho uma conta
              </Link>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-12 text-center text-xs text-gray-500">
            <p>2025 | DiMPay - Todos os direitos reservados</p>
          </div>
        </div>
      </div>

      {/* Lado Direito - Background Visual */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#1e293b] via-[#334155] to-[#475569]">
        {/* Efeito de Grid */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        
        {/* Gradiente Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/10"></div>
        
        {/* Círculos decorativos */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        {/* Conteúdo Visual */}
        <div className="relative h-full flex flex-col items-center justify-center p-12 text-white">
          <div className="max-w-lg text-center space-y-6">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm mb-8">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <h2 className="text-4xl font-bold leading-tight">
              Gestão Financeira <br />Inteligente e Segura
            </h2>
            
            <p className="text-xl text-gray-300">
              Controle total das suas transações financeiras com tecnologia de ponta e segurança bancária.
            </p>
            
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">99.9%</div>
                <div className="text-sm text-gray-400">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">256-bit</div>
                <div className="text-sm text-gray-400">Criptografia</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">24/7</div>
                <div className="text-sm text-gray-400">Suporte</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 50px 50px;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.05); }
        }
        
        .animate-pulse {
          animation: pulse 4s ease-in-out infinite;
        }
        
        .delay-1000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  )
}
