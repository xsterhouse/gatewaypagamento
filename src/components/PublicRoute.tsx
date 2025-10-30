import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  // Para rotas públicas, não mostramos loading
  // Se já estiver autenticado, redireciona para o dashboard
  if (!loading && user) {
    return <Navigate to="/" replace />
  }

  // Sempre renderiza o children (página de login/register) sem esperar loading
  return <>{children}</>
}
