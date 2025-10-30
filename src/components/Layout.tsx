import { Outlet } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { KYCPendingOverlay } from './KYCPendingOverlay'
import { ImpersonationBanner } from './ImpersonationBanner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export function Layout() {
  const [kycStatus, setKycStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null)
  const [rejectionReason, setRejectionReason] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const { effectiveUserId, isImpersonating } = useAuth()

  useEffect(() => {
    console.log('🏗️ Layout montado - effectiveUserId:', effectiveUserId, 'isImpersonating:', isImpersonating)
    if (effectiveUserId) {
      loadUserKYCStatus()
    } else {
      console.log('⚠️ Layout sem effectiveUserId, aguardando...')
    }
  }, [effectiveUserId, isImpersonating])

  const loadUserKYCStatus = async () => {
    try {
      // Usar o effectiveUserId (que considera impersonation)
      if (!effectiveUserId) {
        setLoading(false)
        return
      }

      // Buscar dados do usuário na tabela users
      const { data, error } = await supabase
        .from('users')
        .select('kyc_status, kyc_rejection_reason, role')
        .eq('id', effectiveUserId)
        .single()

      if (error) throw error

      // Admin não precisa de KYC (mas se estiver impersonando, mostrar KYC do cliente)
      if (data.role === 'admin' && !isImpersonating) {
        console.log('✅ Layout: Admin detectado, KYC aprovado automaticamente')
        setKycStatus('approved')
      } else {
        console.log('✅ Layout: Cliente KYC status:', data.kyc_status)
        setKycStatus(data.kyc_status)
        setRejectionReason(data.kyc_rejection_reason || '')
      }
    } catch (error) {
      console.error('❌ Layout: Erro ao carregar status KYC:', error)
    } finally {
      console.log('✅ Layout: Loading finalizado')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground text-lg">Carregando Layout...</p>
          <p className="text-muted-foreground text-sm mt-2">Verificando perfil do usuário</p>
        </div>
      </div>
    )
  }

  console.log('🎨 Layout: Renderizando com kycStatus:', kycStatus)
  
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <ImpersonationBanner />
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden w-full lg:w-auto">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 relative">
          {/* Conteúdo com blur se KYC não aprovado */}
          <div className={kycStatus !== 'approved' ? 'blur-sm pointer-events-none select-none' : ''}>
            <Outlet />
          </div>
          
          {/* Overlay de KYC pendente/rejeitado */}
          {kycStatus && kycStatus !== 'approved' && (
            <KYCPendingOverlay 
              status={kycStatus} 
              rejectionReason={rejectionReason}
            />
          )}
        </main>
      </div>
    </div>
  )
}
