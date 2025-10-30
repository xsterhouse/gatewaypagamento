import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  MessageSquare, 
  Wallet, 
  FileText, 
  Gift, 
  ShoppingCart,
  HelpCircle,
  Settings,
  ChevronLeft,
  Menu,
  X,
  Shield,
  UserCog,
  ArrowUpDown,
  Download,
  Coins,
  TrendingUp,
  CreditCard,
  LogOut,
  Receipt
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useImpersonation } from '@/contexts/ImpersonationContext'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Wallet, label: 'Minhas Carteiras', path: '/wallets' },
  { icon: ArrowUpDown, label: 'Exchange', path: '/exchange' },
  { icon: Download, label: 'Depósitos', path: '/deposits' },
  { icon: MessageSquare, label: 'Fale com seu Gerente', path: '/gerente' },
  { icon: Wallet, label: 'Financeiro', path: '/financeiro' },
  { icon: FileText, label: 'Relatórios', path: '/relatorios' },
  { icon: Gift, label: 'Premiações', path: '/premiacoes' },
  { icon: ShoppingCart, label: 'Acessar Checkout', path: '/checkout' },
]

const adminMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard Admin', path: '/admin/dashboard' },
  { icon: Coins, label: 'Gerenciar Carteiras', path: '/admin/wallets' },
  { icon: TrendingUp, label: 'Exchange & Ordens', path: '/admin/exchange' },
  { icon: CreditCard, label: 'Depósitos & Saques', path: '/admin/deposits' },
  { icon: Receipt, label: 'Gerenciar Faturas', path: '/admin/invoices' },
  { icon: UserCog, label: 'Gerenciar Usuários', path: '/admin' },
  { icon: Shield, label: 'Gerenciar KYC', path: '/kyc' },
  { icon: MessageSquare, label: 'Tickets de Suporte', path: '/admin/tickets' },
  { icon: Wallet, label: 'Transações', path: '/admin/transactions' },
  { icon: FileText, label: 'Logs de Atividades', path: '/admin/logs' },
  { icon: Settings, label: 'Configurações Avançadas', path: '/admin/configuracoes-avancadas' },
]

const bottomMenuItems = [
  { icon: HelpCircle, label: 'Central de Ajuda', path: '/ajuda' },
  { icon: Settings, label: 'Configurações', path: '/configuracoes' },
]

export function Sidebar() {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const { isImpersonating, impersonatedUserId } = useImpersonation()

  useEffect(() => {
    checkUserRole()
    loadUserData()
  }, [isImpersonating, impersonatedUserId])

  const checkUserRole = async () => {
    try {
      // Buscar sessão do Supabase Auth
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) return

      // Buscar role do usuário
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single()

      // Se estiver impersonando, considerar como não-admin para mostrar menu de cliente
      // Gerentes também têm acesso ao menu admin
      if ((data?.role === 'admin' || data?.role === 'manager') && !isImpersonating) {
        setIsAdmin(true)
      } else {
        setIsAdmin(false)
      }
    } catch (error) {
      console.error('Erro ao verificar role:', error)
    }
  }

  const loadUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) return

      // Se estiver impersonando, buscar dados do usuário impersonado
      const userId = isImpersonating && impersonatedUserId ? impersonatedUserId : session.user.id

      const { data } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', userId)
        .single()

      if (data) {
        setUserName(data.name || 'Usuário')
        setUserEmail(data.email || '')
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card border border-border rounded-lg text-foreground shadow-md"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "h-screen bg-card border-r border-border flex flex-col transition-all duration-300 fixed lg:relative z-40 shadow-sm",
          isOpen ? "w-64" : "w-20",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-4 flex items-center justify-between border-b border-border">
          {isOpen && (
            <div className="flex items-center gap-2">
              <img 
                src="/logo-dimpay.png" 
                alt="DiMPay" 
                className="h-8 w-auto"
              />
            </div>
          )}
          {!isOpen && (
            <div className="flex justify-center mx-auto">
              <img 
                src="/logo-dimpay.png" 
                alt="DiMPay" 
                className="h-8 w-auto"
              />
            </div>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-muted-foreground hover:text-primary hidden lg:block"
          >
            <ChevronLeft size={20} className={cn("transition-transform", !isOpen && "rotate-180")} />
          </button>
        </div>

        {/* User Info */}
        {isOpen && (
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-sm">
                  {userName.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground text-sm font-medium truncate">{userName || 'Carregando...'}</p>
                <p className="text-muted-foreground text-xs truncate">{userEmail}</p>
              </div>
            </div>
          </div>
        )}

        {!isOpen && (
          <div className="p-4 border-b border-border flex justify-center">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-black font-bold text-sm">
                {userName.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          </div>
        )}

        {/* Main Menu */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* Se for admin E NÃO está impersonando, mostrar APENAS menu admin */}
          {isAdmin && !isImpersonating ? (
            <>
              {isOpen && (
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground uppercase px-3 mb-2">Administração</p>
                </div>
              )}
              {adminMenuItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors",
                      isActive 
                        ? "bg-primary/10 text-primary border border-primary/20" 
                        : "text-muted-foreground hover:text-foreground hover:bg-accent",
                      !isOpen && "justify-center"
                    )}
                    title={!isOpen ? item.label : undefined}
                  >
                    <Icon size={20} />
                    {isOpen && <span className="text-sm">{item.label}</span>}
                  </Link>
                )
              })}
            </>
          ) : (
            /* Se for usuário normal, mostrar menu de cliente */
            menuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    isActive 
                      ? "bg-primary/10 text-primary border border-primary/20" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent",
                    !isOpen && "justify-center"
                  )}
                  title={!isOpen ? item.label : undefined}
                >
                  <Icon size={20} />
                  {isOpen && <span className="text-sm">{item.label}</span>}
                </Link>
              )
            })
          )}
        </nav>

        {/* Bottom Menu */}
        <div className="p-4 border-t border-border space-y-2">
          {/* Usuários normais */}
          {!isAdmin && (
            <>
            {bottomMenuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    isActive 
                      ? "bg-primary/10 text-primary border border-primary/20" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent",
                    !isOpen && "justify-center"
                  )}
                  title={!isOpen ? item.label : undefined}
                >
                  <Icon size={20} />
                  {isOpen && <span className="text-sm">{item.label}</span>}
                </Link>
              )
            })}
            </>
          )}
          
          {/* Botão Logout - Para todos */}
          <button
            onClick={async () => {
              try {
                console.log('🚪 Logout iniciado pelo Sidebar')
                // Marcar logout ANTES de qualquer ação
                localStorage.setItem('isLoggingOut', 'true')
                
                await supabase.auth.signOut()
                
                // Aguardar para garantir que a tela de loading está visível
                await new Promise(resolve => setTimeout(resolve, 1000))
                
                // Usar replace para evitar histórico
                window.location.replace('/login')
              } catch (error) {
                console.error('Erro no logout:', error)
                localStorage.removeItem('isLoggingOut')
              }
            }}
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors w-full",
              "text-destructive hover:text-destructive hover:bg-destructive/10",
              !isOpen && "justify-center"
            )}
            title={!isOpen ? 'Sair' : undefined}
          >
            <LogOut size={20} />
            {isOpen && <span className="text-sm font-medium">Sair</span>}
          </button>
        </div>
      </div>
    </>
  )
}
