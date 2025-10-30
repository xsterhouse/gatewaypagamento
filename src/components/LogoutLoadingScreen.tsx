import { useAuth } from '@/contexts/AuthContext'
import { LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'

export function LogoutLoadingScreen() {
  const { loggingOut } = useAuth()
  const [isVisible, setIsVisible] = useState(false)
  const [showByLocalStorage, setShowByLocalStorage] = useState(false)

  // Verificar localStorage imediatamente
  useEffect(() => {
    const checkLogout = () => {
      const isLoggingOut = localStorage.getItem('isLoggingOut') === 'true'
      setShowByLocalStorage(isLoggingOut)
    }
    
    // Verificar imediatamente
    checkLogout()
    
    // Verificar a cada 100ms para capturar mudanças rápidas
    const interval = setInterval(checkLogout, 100)
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (loggingOut || showByLocalStorage) {
      // Mostrar imediatamente
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [loggingOut, showByLocalStorage])

  if (!loggingOut && !showByLocalStorage) return null

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-background transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="text-center">
        <div className="relative mb-6">
          {/* Ícone de logout com animação */}
          <LogOut className="w-20 h-20 text-primary mx-auto animate-pulse" />
          
          {/* Círculo girando em volta */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-foreground mb-2 animate-pulse">
          Saindo...
        </h2>
        <p className="text-muted-foreground">
          Encerrando sua sessão com segurança
        </p>
      </div>
    </div>
  )
}
