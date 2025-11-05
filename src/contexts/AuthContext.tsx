import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  loggingOut: boolean
  userData: any
  effectiveUserId: string | null
  isImpersonating: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(() => {
    // Verificar se estava fazendo logout antes do reload
    return localStorage.getItem('isLoggingOut') === 'true'
  })
  const [userData, setUserData] = useState<any>(null)
  const [isImpersonating, setIsImpersonating] = useState(false)
  const [impersonatedUserId, setImpersonatedUserId] = useState<string | null>(null)
  const [effectiveUserId, setEffectiveUserId] = useState<string | null>(null)

  // Verificar impersonation no localStorage
  useEffect(() => {
    const checkImpersonation = () => {
      const impersonationData = localStorage.getItem('impersonation')
      if (impersonationData) {
        try {
          const parsed = JSON.parse(impersonationData)
          setIsImpersonating(true)
          setImpersonatedUserId(parsed.impersonatedUserId)
        } catch (error) {
          console.error('Erro ao parsear impersonation:', error)
          setIsImpersonating(false)
          setImpersonatedUserId(null)
        }
      } else {
        setIsImpersonating(false)
        setImpersonatedUserId(null)
      }
    }

    // Verificar ao montar
    checkImpersonation()

    // Verificar quando localStorage mudar (em outra aba ou via events)
    window.addEventListener('storage', checkImpersonation)
    
    return () => window.removeEventListener('storage', checkImpersonation)
  }, [])

  // Atualizar effectiveUserId quando user ou impersonation mudar
  useEffect(() => {
    if (isImpersonating && impersonatedUserId) {
      setEffectiveUserId(impersonatedUserId)
    } else if (user?.id) {
      setEffectiveUserId(user.id)
    } else {
      setEffectiveUserId(null)
    }
  }, [user, isImpersonating, impersonatedUserId])

  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      
      // Se não tem sessão e estava fazendo logout, limpar flag
      if (!session && localStorage.getItem('isLoggingOut') === 'true') {
        console.log('✅ Logout completo, limpando flag')
        localStorage.removeItem('isLoggingOut')
        setLoggingOut(false)
      }
    })

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Carregar dados do usuário efetivo (impersonado ou real)
  useEffect(() => {
    if (effectiveUserId) {
      loadUserData(effectiveUserId)
    } else {
      setUserData(null)
    }
  }, [effectiveUserId])

  const loadUserData = async (userId: string) => {
    try {
      console.log('🔍 Loading user data for:', userId)
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle() // Use maybeSingle instead of single
      
      if (error) {
        console.error('❌ Erro ao carregar dados do usuário:', error)
        setUserData(null)
        return
      }
      
      if (!data) {
        console.warn('⚠️ User data not found for ID:', userId)
        setUserData(null)
        return
      }
      
      console.log('✅ User data loaded successfully')
      setUserData(data)
    } catch (error) {
      console.error('❌ Erro ao carregar dados do usuário:', error)
      setUserData(null)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (error) throw error
    
    // Criar registro na tabela users
    if (data.user) {
      await supabase.from('users').insert({
        id: data.user.id,
        email,
        name,
        role: 'admin',
      })
    }
  }

  const signOut = async () => {
    // Limpar dados locais imediatamente
    localStorage.removeItem('impersonation')
    localStorage.removeItem('isLoggingOut')
    
    // Fazer logout em background (não bloqueante)
    supabase.auth.signOut().catch(error => {
      console.error('Logout error:', error)
    })
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading,
      loggingOut,
      userData,
      effectiveUserId,
      isImpersonating,
      signIn, 
      signUp, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
