import { useImpersonation } from '@/contexts/ImpersonationContext'
import { Button } from '@/components/ui/button'
import { AlertCircle, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function ImpersonationBanner() {
  const { isImpersonating, impersonatedUserId, stopImpersonation } = useImpersonation()
  const [userName, setUserName] = useState('')

  useEffect(() => {
    if (isImpersonating && impersonatedUserId) {
      loadUserName()
    }
  }, [isImpersonating, impersonatedUserId])

  const loadUserName = async () => {
    try {
      const { data } = await supabase
        .from('users')
        .select('name')
        .eq('id', impersonatedUserId)
        .single()

      if (data) {
        setUserName(data.name)
      }
    } catch (error) {
      console.error('Erro ao carregar nome:', error)
    }
  }

  if (!isImpersonating) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle size={24} />
            <div>
              <p className="font-bold text-sm">Modo Administrador</p>
              <p className="text-xs opacity-90">
                Você está visualizando como: <strong>{userName}</strong>
              </p>
            </div>
          </div>
          <Button
            onClick={stopImpersonation}
            size="sm"
            className="bg-white text-red-600 hover:bg-gray-100"
          >
            <LogOut size={16} className="mr-2" />
            Voltar ao Painel Admin
          </Button>
        </div>
      </div>
    </div>
  )
}
