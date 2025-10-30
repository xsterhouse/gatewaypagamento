import { useState, useEffect } from 'react'
import { Calendar, Bell, Moon, Sun, User, LogOut } from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { CalendarBankingActions } from './CalendarBankingActions'
import { NotificationsPanel } from './NotificationsPanel'
import { ProfileModal } from './ProfileModal'

export function Header() {
  const { user, userData, signOut, effectiveUserId } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [availableBalance, setAvailableBalance] = useState(0)
  const [totalBalance, setTotalBalance] = useState(0)

  useEffect(() => {
    if (effectiveUserId) {
      loadWalletBalance()
    }
  }, [effectiveUserId])

  const loadWalletBalance = async () => {
    try {
      if (!effectiveUserId) return

      const { data, error } = await supabase
        .from('wallets')
        .select('available_balance, balance')
        .eq('user_id', effectiveUserId)
        .eq('currency_code', 'BRL')
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('Erro ao carregar saldo:', error)
        return
      }

      if (data) {
        setAvailableBalance(data.available_balance || 0)
        setTotalBalance(data.balance || 0)
      }
    } catch (error) {
      console.error('Erro ao carregar saldo:', error)
    }
  }

  const handleLogout = async () => {
    try {
      // Marcar logout ANTES de qualquer ação
      localStorage.setItem('isLoggingOut', 'true')
      
      await signOut()
      
      // Aguardar para garantir que a tela de loading está visível
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Usar replace para evitar histórico e garantir transição suave
      window.location.replace('/login')
    } catch (error) {
      console.error('Erro no logout:', error)
      toast.error('Erro ao fazer logout')
      localStorage.removeItem('isLoggingOut')
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 md:px-6 shadow-sm">
      <div className="flex items-center gap-2 md:gap-4">
        <h1 className="text-base md:text-xl text-foreground font-semibold truncate">
          Boas vindas, {userData?.name || user?.email?.split('@')[0] || 'Usuário'}
        </h1>
      </div>

      <div className="flex items-center gap-1 md:gap-3">
        <div className="hidden md:flex items-center gap-2 bg-accent px-3 py-1.5 rounded-lg border border-border">
          <span className="text-foreground text-sm font-medium">
            {formatCurrency(availableBalance)} / {formatCurrency(totalBalance)}
          </span>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-primary hidden md:flex"
          onClick={() => setIsCalendarOpen(!isCalendarOpen)}
          title="Agenda Bancária"
        >
          <Calendar size={20} />
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-primary relative"
          onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
          title="Notificações"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 dark:bg-red-600 text-white text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-primary hidden sm:flex"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Tema Claro' : 'Tema Escuro'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-primary hidden sm:flex"
          onClick={() => setIsProfileOpen(true)}
          title="Perfil do Usuário"
        >
          <User size={20} />
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-destructive"
          onClick={handleLogout}
          title="Sair"
        >
          <LogOut size={20} />
        </Button>
      </div>
      
      {/* Calendar Banking Actions Modal */}
      <CalendarBankingActions 
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
      />
      
      {/* Notifications Panel */}
      <NotificationsPanel 
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onUnreadCountChange={setUnreadCount}
      />
      
      {/* Profile Modal */}
      <ProfileModal 
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </header>
  )
}
