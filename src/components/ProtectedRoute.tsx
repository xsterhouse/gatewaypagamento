import { Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
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

        // Verificar se é admin ou manager e se está bloqueado
        const { data: userData } = await supabase
          .from('users')
          .select('role, is_blocked')
          .eq('id', session.user.id)
          .single()

        if (!mounted) return

        // Verificar se o usuário está bloqueado
        if (userData?.is_blocked && location.pathname !== '/account-blocked') {
          console.log('🔒 Usuário bloqueado, redirecionando...')
          window.location.href = '/account-blocked'
          return
        }

        const userIsAdmin = userData?.role === 'admin'
        const userIsManager = userData?.role === 'manager'
        const isAdminOrManager = userIsAdmin || userIsManager
        
        console.log('👤 Tipo de usuário:', userIsAdmin ? 'Admin' : userIsManager ? 'Gerente' : 'Cliente')

        // Verificar se há impersonation ativa
        const impersonationData = localStorage.getItem('impersonation')
        const isImpersonating = !!impersonationData

        // Rotas de cliente que admin/manager não devem acessar sem impersonation
        const clientRoutes = ['/', '/gerente', '/financeiro', '/relatorios', '/premiacoes', '/checkout', '/wallets', '/exchange', '/deposits', '/extrato']
        const isClientRoute = clientRoutes.includes(location.pathname)

        // Se é admin/manager, não está impersonando e está tentando acessar rota de cliente
        if (isAdminOrManager && !isImpersonating && isClientRoute) {
          console.log('🔀 Admin/Gerente acessando rota cliente, redirecionando...')
          // Redirecionar imediatamente sem esperar o estado
          window.location.href = '/admin/dashboard'
          return
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed:', event, !!session)
      if (!mounted) return
      
      // Só atualizar se realmente mudou
      const newAuthState = !!session
      setIsAuthenticated(prev => {
        if (prev !== newAuthState) {
          console.log('🔄 Atualizando estado de autenticação:', prev, '->', newAuthState)
          return newAuthState
        }
        return prev
      })
      
      // Se fez logout, marcar para não carregar
      if (event === 'SIGNED_OUT') {
        setLoading(false)
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

  return <>{children}</>
}
