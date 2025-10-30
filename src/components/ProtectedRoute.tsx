import { Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const location = useLocation()

  useEffect(() => {
    let mounted = true
    
    const checkAuth = async () => {
      try {
        console.log('🔐 ProtectedRoute: Verificando autenticação...')
        
        // Verificar sessão do Supabase Auth
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (!session?.user) {
          console.log('❌ Sem sessão, redirecionando para login')
          setIsAuthenticated(false)
          setLoading(false)
          return
        }

        console.log('✅ Sessão encontrada:', session.user.email)
        setIsAuthenticated(true)

        // Verificar se é admin
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (!mounted) return

        const userIsAdmin = userData?.role === 'admin'
        console.log('👤 Tipo de usuário:', userIsAdmin ? 'Admin' : 'Cliente')

        // Verificar se há impersonation ativa
        const impersonationData = localStorage.getItem('impersonation')
        const isImpersonating = !!impersonationData

        // Rotas de cliente que admin não deve acessar sem impersonation
        const clientRoutes = ['/', '/gerente', '/financeiro', '/relatorios', '/premiacoes', '/checkout', '/wallets', '/exchange', '/deposits', '/extrato']
        const isClientRoute = clientRoutes.includes(location.pathname)

        // Se é admin, não está impersonando e está tentando acessar rota de cliente
        if (userIsAdmin && !isImpersonating && isClientRoute) {
          console.log('🔀 Admin acessando rota cliente, redirecionando...')
          setShouldRedirect(true)
        }

        console.log('✅ ProtectedRoute: Autenticação completa')
        setLoading(false)
      } catch (error) {
        console.error('❌ Erro ao verificar autenticação:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    checkAuth()

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('🔄 Auth state changed:', !!session)
      if (mounted) {
        setIsAuthenticated(!!session)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [location.pathname])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0e13]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Redirecionar admin para dashboard admin se tentar acessar rota de cliente
  if (shouldRedirect) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return <>{children}</>
}
