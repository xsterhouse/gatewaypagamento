import { Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null)
  const [authLoaded, setAuthLoaded] = useState(false)

  useEffect(() => {
    let mounted = true

    console.log("🔐 ProtectedRoute: Inicializando...")

    // 1 — Aguarda a sessão inicial carregada pelo Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("🔄 Auth state changed:", event, !!session)

        if (!mounted) return
        setSession(session)

        // O evento INITIAL_SESSION garante que o supabase terminou de carregar localStorage
        if (event === "INITIAL_SESSION") {
          setAuthLoaded(true)
        }

        if (event === "SIGNED_OUT") {
          setAuthLoaded(true)
        }
      }
    )

    // 2 — Verifica sessão imediatamente (opcional, mas deixa mais rápido)
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // 🟡 Enquanto o Supabase ainda não carregou a sessão do LOCAL STORAGE
  if (!authLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0e13]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  // 🔴 Sessão carregou → mas é nula
  if (!session) {
    return <Navigate to="/login" replace />
  }

  // 🟢 Sessão válida
  return <>{children}</>
}
