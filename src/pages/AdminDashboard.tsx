import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  Clock,
  CheckCircle,
  Ban,
  RefreshCw,
  ArrowRight,
  Trash2,
  Eye,
  Edit,
  XCircle,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { PixPendingModal } from '@/components/PixPendingModal'
import { InvoicesManagementModal } from '@/components/InvoicesManagementModal'

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  suspendedUsers: number
  totalBalance: number
  totalTransactions: number
  pendingKYC: number
  openTickets: number
  lockedBalance: number
  pixSentVolume: number
  pixReceivedVolume: number
  pixSentCount: number
  pixReceivedCount: number
  totalFeesCollected: number
  newUsersToday: number
  transactionsToday: number
  // Gateway específicos:
  gatewayBalance: number      // Saldo da conta mãe
  gatewayAvailableBalance: number // Saldo disponível
  gatewayFeesToday: number    // FEEs gerados hoje
  pendingPixTransactions: number // PIX pendentes
  failedPixTransactions: number  // PIX falhados
  averageTicket: number       // Ticket médio
  successRate: number         // Taxa de sucesso
}

interface RecentTransaction {
  id: string
  user_name: string
  type: string
  amount: number
  status: string
  created_at: string
  description?: string
  payment_method?: string
}

export function AdminDashboard() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    totalBalance: 0,
    totalTransactions: 0,
    pendingKYC: 0,
    openTickets: 0,
    lockedBalance: 0,
    pixSentVolume: 0,
    pixReceivedVolume: 0,
    pixSentCount: 0,
    pixReceivedCount: 0,
    totalFeesCollected: 0,
    newUsersToday: 0,
    transactionsToday: 0,
    gatewayBalance: 0,
    gatewayAvailableBalance: 0,
    gatewayFeesToday: 0,
    pendingPixTransactions: 0,
    failedPixTransactions: 0,
    averageTicket: 0,
    successRate: 0
  })
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingMEDs, setPendingMEDs] = useState(0)
  const [totalMEDAmount, setTotalMEDAmount] = useState(0)
  
  // Modals State
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<RecentTransaction | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [transactionToCancel, setTransactionToCancel] = useState<RecentTransaction | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [transactionToView, setTransactionToView] = useState<RecentTransaction | null>(null)
  
  // New Modals State
  const [showPixPendingModal, setShowPixPendingModal] = useState(false)
  const [showInvoicesModal, setShowInvoicesModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)


  useEffect(() => {
    console.log('🔵 AdminDashboard montado')
    console.log('authLoading:', authLoading, 'user:', !!user)
    
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ Timeout de segurança atingido, forçando carregamento')
        if (user) {
          loadDashboardData()
        } else {
          setLoading(false)
        }
      }
    }, 3000)
    
    if (!authLoading && user) {
      console.log('✅ Auth pronto, carregando dados do dashboard...')
      loadDashboardData()
    } else if (!authLoading && !user) {
      console.log('⚠️ Auth completo mas sem usuário')
      setLoading(false)
    }

    return () => clearTimeout(safetyTimeout)
  }, [authLoading, user])

  const loadDashboardData = async () => {
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, status, kyc_status, created_at, name, email, role')
        .order('created_at', { ascending: false })

      if (usersError) console.error('Erro ao carregar usuários:', usersError)

      const { data: wallets, error: walletsError } = await supabase
        .from('wallets')
        .select('user_id, currency_code, balance, available_balance, blocked_balance, is_active, wallet_name')
        .eq('is_active', true)

      if (walletsError) console.error('Erro ao carregar carteiras:', walletsError)
      
      const { data: allTransactions, error: allTransError } = await supabase
        .from('transactions')
        .select('*')
        .limit(1000)

      if (allTransError && !allTransError.message.includes('does not exist')) {
        console.error('Erro ao carregar transações:', allTransError)
      }
      
      const { data: medRequests, error: medError } = await supabase
        .from('med_requests')
        .select('id, amount, status')
        .eq('status', 'pending')

      if (medError && !medError.message.includes('does not exist')) {
        console.error('Erro ao carregar MEDs:', medError)
      }

      const pendingMEDsCount = medRequests?.length || 0
      const totalMED = medRequests?.reduce((sum, med) => sum + Number(med.amount || 0), 0) || 0
      
      setPendingMEDs(pendingMEDsCount)
      setTotalMEDAmount(totalMED)
      
      const { data: tickets, error: ticketsError } = await supabase
        .from('support_tickets')
        .select('id')
        .in('status', ['open', 'in_progress'])

      if (ticketsError && !ticketsError.message.includes('does not exist')) {
        console.error('Erro ao carregar tickets:', ticketsError)
      }
      
      const clientWallets = (wallets || []).filter(w => w.wallet_name !== 'Conta Mãe - Taxas Gateway');
      
      const { data: cryptoPricesData, error: pricesError } = await supabase
        .from('crypto_prices')
        .select('cryptocurrency_symbol, price_brl')

      if (pricesError) console.error('Erro ao buscar preços de cripto:', pricesError)
      
      const cryptoPrices = new Map(
        cryptoPricesData?.map(p => [p.cryptocurrency_symbol, p.price_brl]) || []
      )
      
      const totalBalance = clientWallets.reduce((sum, wallet) => {
        const available = Number(wallet.available_balance || 0);
        if (wallet.currency_code === 'BRL') {
          return sum + available;
        }
        const price = cryptoPrices.get(wallet.currency_code) || 0;
        return sum + (available * price);
      }, 0);
      
      const lockedBalance = clientWallets.reduce((sum, wallet) => {
        const blocked = Number(wallet.blocked_balance || 0);
        if (wallet.currency_code === 'BRL') {
          return sum + blocked;
        }
        const price = cryptoPrices.get(wallet.currency_code) || 0;
        return sum + (blocked * price);
      }, 0);

      if (users) {
        const clientUsers = users.filter(u => u.role === 'user')
        const usersWithPendingKYC = clientUsers.filter(u => 
          u.kyc_status === 'pending' || u.kyc_status === 'awaiting_verification'
        )
        const nonAdminUsers = clientUsers.filter(u => u.id)
        const activeUsers = clientUsers.filter(u => u.status === 'active').length
        const suspendedUsers = clientUsers.filter(u => u.status === 'suspended').length
        const pendingKYC = usersWithPendingKYC.length
        
        const newUsersToday = users.filter(u => {
          if (!u.created_at) return false
          const userDate = new Date(u.created_at)
          const todayLocal = new Date()
          return userDate.toDateString() === todayLocal.toDateString()
        }).length
        
        // ==================================================================
        // CORREÇÃO: Buscar estatísticas de PIX de forma eficiente
        // ==================================================================
        const { count: pixReceivedCount, error: receivedCountError } = await supabase
          .from('pix_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed')
          .eq('transaction_type', 'deposit')

        const { data: pixReceivedData, error: receivedVolumeError } = await supabase
          .from('pix_transactions')
          .select('amount')
          .eq('status', 'completed')
          .eq('transaction_type', 'deposit')
        
        const pixReceivedVolume = pixReceivedData?.reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0

        const { count: pixSentCount, error: sentCountError } = await supabase
          .from('pix_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed')
          .eq('transaction_type', 'withdrawal')

        const { data: pixSentData, error: sentVolumeError } = await supabase
          .from('pix_transactions')
          .select('amount')
          .eq('status', 'completed')
          .eq('transaction_type', 'withdrawal')
        
        const pixSentVolume = pixSentData?.reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0

        const { count: pendingPixTransactions, error: pendingError } = await supabase
          .from('pix_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')

        const { count: failedPixTransactions, error: failedError } = await supabase
          .from('pix_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'failed')

        const { count: totalPixCount, error: totalError } = await supabase
          .from('pix_transactions')
          .select('*', { count: 'exact', head: true })

        if (receivedCountError) console.error('Erro ao contar PIX recebidos:', receivedCountError)
        if (receivedVolumeError) console.error('Erro ao somar volume PIX recebido:', receivedVolumeError)
        if (sentCountError) console.error('Erro ao contar PIX enviados:', sentCountError)
        if (sentVolumeError) console.error('Erro ao somar volume PIX enviado:', sentVolumeError)
        if (pendingError) console.error('Erro ao contar PIX pendentes:', pendingError)
        if (failedError) console.error('Erro ao contar PIX falhados:', failedError)
        if (totalError) console.error('Erro ao contar total de PIX:', totalError)

        const completedPixCount = (pixReceivedCount || 0) + (pixSentCount || 0)
        const successRate = (totalPixCount || 0) > 0 
          ? (completedPixCount / (totalPixCount || 1)) * 100 
          : 0
        
        const transactionsToday = allTransactions?.filter(t => {
          if (!t.created_at) return false
          const transDate = new Date(t.created_at)
          const todayLocal = new Date()
          return transDate.toDateString() === todayLocal.toDateString()
        }).length || 0

        const { data: adminWallet } = await supabase
          .from('wallets')
          .select('balance, id')
          .eq('wallet_name', 'Conta Mãe - Taxas Gateway')
          .single()
        
        const totalFeesCollected = adminWallet?.balance || 0

        // Obter início do dia atual no horário de Brasília (UTC-3)
        const now = new Date()
        const todayBrasilia = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
        todayBrasilia.setHours(0, 0, 0, 0)
        
        // Converter para UTC para a query no Supabase
        const startOfDayUTC = new Date(todayBrasilia.getTime() + (3 * 60 * 60 * 1000))
        
        const { data: adminTodayTransactions } = await supabase
          .from('wallet_transactions')
          .select('amount, created_at')
          .eq('wallet_id', adminWallet?.id)
          .eq('transaction_type', 'credit')
          .gte('created_at', startOfDayUTC.toISOString())
        
        const todayFees = (adminTodayTransactions || []).reduce((sum, t) => sum + Number(t.amount || 0), 0)
        
        const totalTxCount = allTransactions?.length || 0
        const averageTicket = totalTxCount > 0
          ? (allTransactions || []).reduce((sum, t) => sum + Number(t.amount || 0), 0) / totalTxCount
          : 0

        setStats({
          totalUsers: nonAdminUsers.length,
          activeUsers,
          suspendedUsers,
          totalBalance,
          totalTransactions: allTransactions?.length || 0,
          pendingKYC,
          openTickets: tickets?.length || 0,
          lockedBalance,
          pixSentVolume,
          pixReceivedVolume,
          pixSentCount: pixSentCount || 0,
          pixReceivedCount: pixReceivedCount || 0,
          totalFeesCollected,
          newUsersToday,
          transactionsToday,
          gatewayBalance: adminWallet?.balance || 0,
          gatewayAvailableBalance: adminWallet?.balance || 0,
          gatewayFeesToday: todayFees,
          pendingPixTransactions: pendingPixTransactions || 0,
          failedPixTransactions: failedPixTransactions || 0,
          averageTicket,
          successRate
        })
      }

      const { data: pixRecentTransactions } = await supabase
        .from('pix_transactions')
        .select('*')
        .neq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (pixRecentTransactions && pixRecentTransactions.length > 0) {
        const formatted = await Promise.all(
          pixRecentTransactions.map(async (t) => {
            const { data: user } = await supabase
              .from('users')
              .select('name, email')
              .eq('id', t.user_id)
              .single()

            return {
              id: t.id,
              user_name: user?.name || user?.email?.split('@')[0] || 'Usuário',
              type: t.transaction_type === 'deposit' ? 'credit' : 'debit',
              amount: Number(t.amount || 0),
              status: t.status || 'pending',
              created_at: t.created_at,
              description: t.description || undefined,
              payment_method: 'pix'
            }
          })
        )
        setRecentTransactions(formatted)
      } else {
        setRecentTransactions([])
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar dashboard:', error)
      setError(error.message || 'Erro desconhecido ao carregar dashboard')
    } finally {
      console.log('✅ Loading finalizado')
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    toast.info('Atualizando dados do dashboard...')
    await loadDashboardData()
    toast.success('Dashboard atualizado!')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="text-green-500 text-xs">✓ Concluída</span>
      case 'pending':
        return <span className="text-yellow-500 text-xs">⏳ Pendente</span>
      case 'failed':
        return <span className="text-red-500 text-xs">✗ Falhou</span>
      case 'cancelled':
        return <span className="text-gray-500 text-xs">🚫 Cancelada</span>
      default:
        return <span className="text-gray-500 text-xs">{status}</span>
    }
  }

  const getTransactionIcon = (type: string) => {
    return type === 'credit' ? (
      <TrendingUp className="text-green-500" size={16} />
    ) : (
      <TrendingDown className="text-red-500" size={16} />
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const handleOpenDeleteModal = (transaction: RecentTransaction) => {
    setTransactionToDelete(transaction)
    setShowDeleteModal(true)
  }

  const confirmDeleteTransaction = async () => {
    if (!transactionToDelete) return
    const { id: transactionId } = transactionToDelete
    setShowDeleteModal(false)

    try {
      const { error } = await supabase
        .from('pix_transactions')
        .delete()
        .eq('id', transactionId)

      if (error) throw error

      setRecentTransactions(prev => prev.filter(t => t.id !== transactionId))
      alert('✅ Transação excluída com sucesso!')
    } catch (error: any) {
      alert('Erro ao deletar transação: ' + (error?.message || 'Erro desconhecido'))
    } finally {
      setTransactionToDelete(null)
    }
  }

  const handleOpenCancelModal = (transaction: RecentTransaction) => {
    if (transaction.status === 'completed' || transaction.status === 'cancelled') {
      alert('Apenas transações pendentes ou em processamento podem ser canceladas.');
      return;
    }
    setTransactionToCancel(transaction);
    setShowCancelModal(true);
  }

  const confirmCancelTransaction = async () => {
    if (!transactionToCancel) return;
    try {
      const { error } = await supabase
        .from('pix_transactions')
        .update({ status: 'cancelled' })
        .eq('id', transactionToCancel.id);
      if (error) throw error;
      alert('Transação cancelada com sucesso!');
      loadDashboardData();
    } catch (error) {
      alert('Erro ao cancelar transação.');
    } finally {
      setShowCancelModal(false);
      setTransactionToCancel(null);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center max-w-md px-4">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-primary/20 border-b-primary rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
            </div>
          </div>
          <h2 className="text-foreground text-xl font-semibold mb-2">
            {authLoading ? 'Verificando autenticação...' : 'Carregando Dashboard Admin...'}
          </h2>
          <p className="text-muted-foreground text-sm">
            {authLoading ? 'Aguarde enquanto validamos suas credenciais' : 'Carregando estatísticas e dados do sistema'}
          </p>
          <div className="mt-6 flex items-center justify-center gap-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center max-w-md">
          <AlertCircle className="text-red-500 w-16 h-16 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Sessão Inválida</h2>
          <p className="text-muted-foreground mb-4">
            Sua sessão expirou ou é inválida. Faça login novamente.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-primary text-black rounded-lg hover:bg-primary/90"
          >
            Ir para Login
          </button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center max-w-md">
          <AlertCircle className="text-red-500 w-16 h-16 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Erro ao Carregar Dashboard</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-black rounded-lg hover:bg-primary/90"
          >
            Recarregar Página
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 bg-gradient-to-br from-background via-background to-primary/5 min-h-screen p-3 sm:p-4 md:p-6">
      {/* Header Moderno */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-1 sm:mb-2">
            Dashboard Administrativo
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">Visão geral do sistema em tempo real</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary/10 rounded-lg border border-primary/20 self-start sm:self-auto">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Sistema Online</span>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Cards Principais - Grid Responsivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {/* Total de Usuários */}
        <Card 
          className="bg-card border-border cursor-pointer transition-all hover:shadow-lg hover:scale-105 hover:border-primary/50"
          onClick={() => navigate('/admin')}
        >
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs">Total de Usuários</p>
                <p className="text-lg sm:text-xl font-bold text-foreground">{stats.totalUsers}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.activeUsers} ativos
                </p>
              </div>
              <Users className="text-primary" size={28} />
            </div>
          </CardContent>
        </Card>

        {/* Saldo Total */}
        <Card className="bg-card border-border transition-all hover:shadow-lg hover:scale-105">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs">Saldo Total</p>
                <p className="text-lg sm:text-xl font-bold text-primary">
                  {formatCurrency(stats.totalBalance)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Em todas as contas
                </p>
              </div>
              <DollarSign className="text-primary" size={28} />
            </div>
          </CardContent>
        </Card>

        {/* KYC Pendentes */}
        <Card 
          className="bg-card border-border cursor-pointer transition-all hover:shadow-lg hover:scale-105 hover:border-yellow-500/50"
          onClick={() => navigate('/kyc')}
        >
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs">KYC Pendentes</p>
                <p className="text-lg sm:text-xl font-bold text-yellow-500">{stats.pendingKYC}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Aguardando aprovação
                </p>
              </div>
              <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <AlertCircle className="text-yellow-500" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gerenciar Faturas */}
        <Card 
          className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/30 transition-all hover:shadow-lg hover:scale-105 cursor-pointer"
          onClick={() => setShowInvoicesModal(true)}
        >
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs">Gerenciar Faturas</p>
                <p className="text-lg sm:text-xl font-bold text-blue-500">Painel</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Cliente
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <FileText className="text-blue-500" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MEDs Pendentes - NOVO */}
        <Card 
          className={`bg-card border-border cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
            pendingMEDs > 0 ? 'border-orange-500 border-2 animate-pulse' : 'hover:border-orange-500/50'
          }`}
          onClick={() => navigate('/admin/med')}
        >
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-muted-foreground text-xs">MEDs Pendentes</p>
                <p className="text-lg sm:text-xl font-bold text-orange-500">{pendingMEDs}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalMEDAmount > 0 
                    ? `R$ ${totalMEDAmount.toFixed(2)} em disputa`
                    : 'Nenhum MED pendente'
                  }
                </p>
                {pendingMEDs > 0 && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                    <AlertCircle className="w-3 h-3" />
                    <span>Requer atenção</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                )}
              </div>
              <RefreshCw className={`text-orange-500 ${pendingMEDs > 0 ? 'animate-spin' : ''}`} size={28} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas PIX - Grid Compacto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="bg-card border-border transition-all hover:shadow-lg hover:scale-105">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <TrendingUp className="text-green-500" size={20} />
              <div>
                <p className="text-muted-foreground text-xs">PIX Recebidos</p>
                <p className="text-sm sm:text-base font-bold text-green-500">
                  {formatCurrency(stats.pixReceivedVolume)}
                </p>
                <p className="text-xs text-muted-foreground">{stats.pixReceivedCount} transações</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border transition-all hover:shadow-lg hover:scale-105">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <TrendingDown className="text-red-500" size={20} />
              <div>
                <p className="text-muted-foreground text-xs">PIX Enviados</p>
                <p className="text-sm sm:text-base font-bold text-red-500">
                  {formatCurrency(stats.pixSentVolume)}
                </p>
                <p className="text-xs text-muted-foreground">{stats.pixSentCount} transações</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border transition-all hover:shadow-lg hover:scale-105">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <DollarSign className="text-primary" size={20} />
              <div>
                <p className="text-muted-foreground text-xs">Taxas Coletadas</p>
                <p className="text-sm sm:text-base font-bold text-primary">
                  {formatCurrency(stats.totalFeesCollected)}
                </p>
                <p className="text-xs text-muted-foreground">1% de envio</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border transition-all hover:shadow-lg hover:scale-105">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <CheckCircle className="text-blue-500" size={20} />
              <div>
                <p className="text-muted-foreground text-xs">Hoje</p>
                <p className="text-sm sm:text-base font-bold text-foreground">
                  {stats.newUsersToday} novos
                </p>
                <p className="text-xs text-muted-foreground">{stats.transactionsToday} transações</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gateway Metrics - Conta Mãe */}
      <div className="mt-4 sm:mt-6 lg:mt-8">
        <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-400 rounded-lg flex items-center justify-center">
            <DollarSign className="text-black" size={16} />
          </div>
          Gateway PIX - Conta Mãe
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/30 transition-all hover:shadow-lg hover:scale-105">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="text-blue-500" size={18} />
              </div>
              <div>
                <p className="text-muted-foreground text-xs sm:text-sm">Conta Mãe - Saldo</p>
                <p className="text-base sm:text-xl font-bold text-blue-500">
                  {formatCurrency(stats.gatewayBalance)}
                </p>
                <p className="text-xs text-muted-foreground">Total disponível</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/30 transition-all hover:shadow-lg hover:scale-105">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-green-500" size={18} />
              </div>
              <div>
                <p className="text-muted-foreground text-xs sm:text-sm">FEEs Hoje</p>
                <p className="text-base sm:text-xl font-bold text-green-500">
                  {formatCurrency(stats.gatewayFeesToday)}
                </p>
                <p className="text-xs text-muted-foreground">Receita do dia</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/30 transition-all hover:shadow-lg hover:scale-105 cursor-pointer"
          onClick={() => setShowPixPendingModal(true)}
        >
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Clock className="text-orange-500" size={18} />
              </div>
              <div>
                <p className="text-muted-foreground text-xs sm:text-sm">PIX Pendentes</p>
                <p className="text-base sm:text-xl font-bold text-orange-500">
                  {stats.pendingPixTransactions}
                </p>
                <p className="text-xs text-muted-foreground">Clique para gerenciar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30 transition-all hover:shadow-lg hover:scale-105">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-purple-500" size={18} />
              </div>
              <div>
                <p className="text-muted-foreground text-xs sm:text-sm">Taxa de Sucesso</p>
                <p className="text-base sm:text-xl font-bold text-purple-500">
                  {stats.successRate.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">Transações aprovadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Secundárias */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        <Card className="bg-card border-border transition-all hover:shadow-lg hover:scale-105">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <CheckCircle className="text-green-500" size={20} />
              <div>
                <p className="text-muted-foreground text-xs sm:text-sm">Usuários Ativos</p>
                <p className="text-base sm:text-xl font-bold text-foreground">{stats.activeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border transition-all hover:shadow-lg hover:scale-105">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <Ban className="text-red-500" size={20} />
              <div>
                <p className="text-muted-foreground text-xs sm:text-sm">Contas Suspensas</p>
                <p className="text-base sm:text-xl font-bold text-foreground">{stats.suspendedUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border transition-all hover:shadow-lg hover:scale-105">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <AlertCircle className="text-yellow-500" size={20} />
              <div>
                <p className="text-muted-foreground text-xs sm:text-sm">Saldo Bloqueado</p>
                <p className="text-base sm:text-xl font-bold text-foreground">
                  {formatCurrency(stats.lockedBalance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas e Ações Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {/* Tickets Abertos */}
        <Card 
          className="bg-card border-border cursor-pointer transition-all hover:shadow-lg hover:scale-105 hover:border-orange-500/50"
          onClick={() => navigate('/admin/tickets')}
        >
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs sm:text-sm">Tickets Abertos</p>
                <p className="text-xl sm:text-2xl font-bold text-orange-500">{stats.openTickets}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Requer atenção
                </p>
              </div>
              <AlertCircle className="text-orange-500" size={28} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transações Recentes */}
      <Card className="bg-card border-border transition-all hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-foreground">Transações Recentes</CardTitle>
          <span className="text-xs text-muted-foreground">
            {recentTransactions.length} transações
          </span>
        </CardHeader>
        <CardContent>
          <div className="max-h-[500px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {recentTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Clock className="text-gray-600 mb-3" size={48} />
                <p className="text-muted-foreground text-center">Nenhuma transação encontrada</p>
              </div>
            ) : (
              recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-accent/50 rounded-lg hover:bg-accent transition-all duration-200 border border-border hover:border-primary/50 hover:shadow-md"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg ${
                      transaction.type === 'credit' 
                        ? 'bg-green-500/10' 
                        : 'bg-red-500/10'
                    }`}>
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium truncate">{transaction.user_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock size={12} />
                        <span>{new Date(transaction.created_at).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={`font-bold text-sm ${
                        transaction.type === 'credit' ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {transaction.type === 'credit' ? '+' : '-'} {formatCurrency(transaction.amount)}
                      </p>
                      <div className="mt-1">
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Ver" onClick={() => { setTransactionToView(transaction); setShowViewModal(true); }}>
                        <Eye size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Editar" onClick={() => { setShowEditModal(true); }}>
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Cancelar" onClick={() => handleOpenCancelModal(transaction)}>
                        <XCircle size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" title="Excluir" onClick={() => handleOpenDeleteModal(transaction)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {recentTransactions.length > 5 && (
            <div className="mt-3 pt-3 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">
                ↕️ Role para ver mais transações
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="text-red-500" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Excluir Transação?
                </h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false)
                      setTransactionToDelete(null)
                    }}
                    className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmDeleteTransaction}
                    className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-all flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Cancelamento */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCancelModal(false)}>
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Cancelar Transação?</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Tem certeza que deseja cancelar esta transação?
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowCancelModal(false)}>Não</Button>
              <Button variant="destructive" onClick={confirmCancelTransaction}>Sim, Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização */}
      {showViewModal && transactionToView && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowViewModal(false)}>
          <div className="bg-card border border-border rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Detalhes da Transação</h3>
            <div className="mt-4 space-y-2 text-sm">
              <p><strong>ID:</strong> {transactionToView.id}</p>
              <p><strong>Usuário:</strong> {transactionToView.user_name}</p>
              <p><strong>Valor:</strong> {formatCurrency(transactionToView.amount)}</p>
              <p><strong>Status:</strong> {transactionToView.status}</p>
              <p><strong>Data:</strong> {new Date(transactionToView.created_at).toLocaleString('pt-BR')}</p>
              <p><strong>Descrição:</strong> {transactionToView.description || 'N/A'}</p>
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setShowViewModal(false)}>Fechar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowEditModal(false)}>
          <div className="bg-card border border-border rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Editar Transação</h3>
            <p className="text-sm text-muted-foreground mt-4">
              Funcionalidade de edição em desenvolvimento.
            </p>
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>Fechar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <PixPendingModal 
        open={showPixPendingModal}
        onOpenChange={setShowPixPendingModal}
        onRefresh={loadDashboardData}
      />

      <InvoicesManagementModal 
        open={showInvoicesModal}
        onOpenChange={setShowInvoicesModal}
        onRefresh={loadDashboardData}
      />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(107, 114, 128, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(107, 114, 128, 0.8);
        }
      `}</style>
    </div>
  )
}