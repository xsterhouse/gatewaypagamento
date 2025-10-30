import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

interface ImpersonationContextType {
  isImpersonating: boolean
  originalAdminId: string | null
  impersonatedUserId: string | null
  impersonateUser: (userId: string) => Promise<void>
  stopImpersonation: () => Promise<void>
}

const ImpersonationContext = createContext<ImpersonationContextType>({
  isImpersonating: false,
  originalAdminId: null,
  impersonatedUserId: null,
  impersonateUser: async () => {},
  stopImpersonation: async () => {},
})

export const useImpersonation = () => useContext(ImpersonationContext)

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [isImpersonating, setIsImpersonating] = useState(false)
  const [originalAdminId, setOriginalAdminId] = useState<string | null>(null)
  const [impersonatedUserId, setImpersonatedUserId] = useState<string | null>(null)

  useEffect(() => {
    // Verificar se há impersonation ativa ao carregar
    const impersonationData = localStorage.getItem('impersonation')
    if (impersonationData) {
      const data = JSON.parse(impersonationData)
      setIsImpersonating(true)
      setOriginalAdminId(data.originalAdminId)
      setImpersonatedUserId(data.impersonatedUserId)
    }
  }, [])

  const impersonateUser = async (userId: string) => {
    try {
      // Obter sessão atual do admin
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Não autenticado')

      // Verificar se é admin
      const { data: adminData } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (adminData?.role !== 'admin') {
        throw new Error('Apenas admins podem fazer impersonation')
      }

      // Buscar dados do usuário a ser impersonado
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error || !userData) throw new Error('Usuário não encontrado')

      // Salvar dados de impersonation
      const impersonationData = {
        originalAdminId: session.user.id,
        impersonatedUserId: userId,
        impersonatedUserData: userData,
      }

      localStorage.setItem('impersonation', JSON.stringify(impersonationData))
      
      setIsImpersonating(true)
      setOriginalAdminId(session.user.id)
      setImpersonatedUserId(userId)

      // Recarregar página para aplicar mudanças
      window.location.href = '/'
    } catch (error) {
      console.error('Erro ao impersonar:', error)
      throw error
    }
  }

  const stopImpersonation = async () => {
    try {
      // Remover dados de impersonation
      localStorage.removeItem('impersonation')
      
      setIsImpersonating(false)
      setOriginalAdminId(null)
      setImpersonatedUserId(null)

      // Recarregar página para voltar ao admin
      window.location.href = '/admin/dashboard'
    } catch (error) {
      console.error('Erro ao parar impersonation:', error)
      throw error
    }
  }

  return (
    <ImpersonationContext.Provider
      value={{
        isImpersonating,
        originalAdminId,
        impersonatedUserId,
        impersonateUser,
        stopImpersonation,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  )
}
