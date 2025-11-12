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
  Trash2
} from 'lucide-react'

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
  const [error, setError] = useState<string | null>(null)
  const [pendingMEDs, setPendingMEDs] = useState(0)
  const [totalMEDAmount, setTotalMEDAmount] = useState(0)
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<{ id: string; status: string } | null>(null)

  useEffect(() => {
    console.log('🔵 AdminDashboard montado')
    console.log('authLoading:', authLoading, 'user:', !!user)
    
    // Timeout de segurança para evitar tela preta infinita
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ Timeout de segurança atingido, forçando carregamento')
        if (user) {
          loadDashboardData()
        } else {
          setLoading(false)
        }
      }
    }, 3000) // 3 segundos de timeout
    
    // Só tenta carregar quando authLoading terminar E user existir
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
      const today = new Date().toISOString().split('T')[0]

      // Carregar estatísticas de usuários (sem cache)
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, status, kyc_status, created_at, name, email, role')
        .order('created_at', { ascending: false })

      if (usersError) {
        console.error('Erro ao carregar usuários:', usersError)
      }

      // Carregar todas as carteiras para calcular saldos
      const { data: wallets, error: walletsError } = await supabase
        .from('wallets')
        .select('user_id, currency_code, balance, available_balance, blocked_balance, is_active')
        .eq('is_active', true)

      if (walletsError) {
        console.error('Erro ao carregar carteiras:', walletsError)
      }

      
      // Carregar todas as transações para estatísticas (se a tabela existir)
      const { data: allTransactions, error: allTransError } = await supabase
        .from('transactions')
        .select('*')
        .limit(1000)

      if (allTransError && !allTransError.message.includes('does not exist')) {
        console.error('Erro ao carregar transações:', allTransError)
      }
      
      // Carregar MEDs pendentes
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
      
      console.log('🔄 MEDs Pendentes:', pendingMEDsCount, 'Valor total:', totalMED)

      // Carregar tickets abertos (se a tabela existir)
      const { data: tickets, error: ticketsError } = await supabase
        .from('support_tickets')
        .select('id')
        .in('status', ['open', 'in_progress'])

      if (ticketsError && !ticketsError.message.includes('does not exist')) {
        console.error('Erro ao carregar tickets:', ticketsError)
      }

      // Calcular saldo total em BRL das carteiras
      const brlWallets = wallets?.filter(w => w.currency_code === 'BRL') || []
      const totalBalance = brlWallets.reduce((sum, w) => sum + Number(w.balance || 0), 0)
      const lockedBalance = brlWallets.reduce((sum, w) => sum + Number(w.blocked_balance || 0), 0)

      // Debug: Mostrar dados carregados
      console.log('📊 Dashboard Stats:', {
        users: users?.length,
        wallets: wallets?.length,
        brlWallets: brlWallets.length,
        totalBalance,
        lockedBalance,
        transactions: allTransactions?.length,
        tickets: tickets?.length
      })

      if (users) {
        // Filtrar apenas clientes (excluir admin e manager)
        const clientUsers = users.filter(u => u.role === 'user')
        
        // Debug: Mostrar status KYC de todos os clientes
        console.log('📋 Total de clientes:', clientUsers.length)
        console.log('📋 Status KYC dos clientes:', clientUsers.map(u => ({
          name: u.name,
          email: u.email,
          kyc_status: u.kyc_status
        })))
        
        // Filtrar clientes com KYC pendente (apenas role = 'user')
        const usersWithPendingKYC = clientUsers.filter(u => 
          u.kyc_status === 'pending' || u.kyc_status === 'awaiting_verification'
        )
        console.log('⚠️ Clientes com KYC PENDENTE:', usersWithPendingKYC.map(u => ({
          name: u.name,
          email: u.email,
          kyc_status: u.kyc_status
        })))
        
        // Contar usuários por status (excluindo admins e managers)
        const nonAdminUsers = clientUsers.filter(u => u.id)
        const activeUsers = clientUsers.filter(u => u.status === 'active').length
        const suspendedUsers = clientUsers.filter(u => u.status === 'suspended').length
        const pendingKYC = usersWithPendingKYC.length
        
        console.log('🔢 Total KYC Pendentes (apenas clientes):', pendingKYC)
        
        const newUsersToday = users.filter(u => {
          if (!u.created_at) return false
          
          // Handle different date formats and timezones
          const userDate = new Date(u.created_at)
          const todayLocal = new Date()
          
          // Compare dates in local timezone
          return userDate.toDateString() === todayLocal.toDateString()
        }).length
        
        console.log('🆕 Novos usuários hoje:', newUsersToday, 'de', users.length, 'total')
        console.log('📅 Data de hoje (local):', new Date().toDateString())
        console.log('📅 Data de hoje (ISO):', today)
        
        // Debug: Show recent user creation dates
        const recentUsers = users.slice(0, 5).map(u => ({
          name: u.name,
          created_at: u.created_at,
          date_string: u.created_at ? new Date(u.created_at).toDateString() : 'null'
        }))
        console.log('📋 Usuários recentes e datas:', recentUsers)

        // ==================================================================
        // CORREÇÃO: Buscar estatísticas de PIX diretamente do banco de dados
        // ==================================================================

        // ANTES (Ineficiente): Buscava tudo e filtrava no frontend
        // const { data: allPixTransactions } = await supabase.from('pix_transactions').select('amount, status, created_at')
        // const pixCompleted = allPixTransactions?.filter(t => t.status === 'completed') || []
        // const pixReceivedVolume = pixCompleted.reduce((sum, t) => sum + Number(t.amount || 0), 0)
        // const pixReceivedCount = pixCompleted.length

        // DEPOIS (Corrigido e Eficiente): Calcula diretamente no banco
        const { count: pixReceivedCount, error: countError } = await supabase
          .from('pix_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed')
          .eq('transaction_type', 'deposit')

        const { data: pixReceivedData, error: volumeError } = await supabase
          .from('pix_transactions')
          .select('amount')
          .eq('status', 'completed')
          .eq('transaction_type', 'deposit')

        if (countError) console.error('Erro ao contar PIX recebidos:', countError)
        if (volumeError) console.error('Erro ao somar volume PIX:', volumeError)

        const pixReceivedVolume = pixReceivedData?.reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0
        
        // Para PIX enviados, buscar de wallet_transactions tipo debit
        const pixSent = allTransactions?.filter(t => 
          t.transaction_type === 'debit'
        ) || []
        const pixSentVolume = pixSent.reduce((sum, t) => sum + Number(t.amount || 0), 0)
        
        console.log('📊 PIX Stats (Corrigido):', {
          receivedVolume: pixReceivedVolume,
          receivedCount: pixReceivedCount,
          sentVolume: pixSentVolume,
          sentCount: pixSent.length
        })

        // Transações de hoje - improved date handling
        const transactionsToday = allTransactions?.filter(t => {
          if (!t.created_at) return false
          
          // Handle different date formats and timezones
          const transDate = new Date(t.created_at)
          const todayLocal = new Date()
          
          // Compare dates in local timezone
          return transDate.toDateString() === todayLocal.toDateString()
        }).length || 0

        console.log('📈 Transações hoje:', transactionsToday, 'de', allTransactions?.length || 0, 'total')
        
        // Debug: Show recent transaction dates
        const recentTransactions = allTransactions?.slice(0, 5).map(t => ({
          id: t.id,
          amount: t.amount,
          created_at: t.created_at,
          date_string: t.created_at ? new Date(t.created_at).toDateString() : 'null'
        }))
        console.log('📋 Transações recentes e datas:', recentTransactions)

        // Buscar taxas reais da carteira Conta Mãe
        const { data: adminWallet, error: adminWalletError } = await supabase
          .from('wallets')
          .select('balance, id')
          .eq('wallet_name', 'Conta Mãe - Taxas Gateway')
          .single()
        
        console.log('💰 Admin Wallet:', adminWallet, adminWalletError)
        
        const totalFeesCollected = adminWallet?.balance || 0

        // Calcular métricas de Gateway
        // Buscar taxas de hoje da carteira admin (últimas 24h)
        const now = new Date()
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1)
        
        const { data: adminTodayTransactions, error: adminTodayError } = await supabase
          .from('wallet_transactions')
          .select('amount, created_at')
          .eq('wallet_id', adminWallet?.id)
          .gte('created_at', yesterday.toISOString())
        
        console.log('📅 Admin Today Transactions:', adminTodayTransactions, adminTodayError)
        console.log('📅 Today filter (últimas 24h):', yesterday.toISOString())
        
        const todayFees = (adminTodayTransactions || []).reduce((sum, t) => sum + Number(t.amount || 0), 0)
        
        // Buscar estatísticas de pix_transactions
        const { data: pixTransactions } = await supabase
          .from('pix_transactions')
          .select('status')
        
        const pendingTransactions = pixTransactions?.filter(t => t.status === 'pending').length || 0
        const failedTransactions = pixTransactions?.filter(t => t.status === 'failed').length || 0
        const completedTransactions = pixTransactions?.filter(t => t.status === 'completed').length || 0
        
        const totalPixCount = pixTransactions?.length || 0
        const successRate = totalPixCount > 0 
          ? (completedTransactions / totalPixCount) * 100 
          : 0
        
        console.log('📊 Taxa de Sucesso:', {
          completed: completedTransactions,
          total: totalPixCount,
          rate: successRate
        })
        
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
          pixSentCount: pixSent.length,
          pixReceivedCount: pixReceivedCount || 0,
          totalFeesCollected,
          newUsersToday,
          transactionsToday,
          // Gateway específicos:
          gatewayBalance: adminWallet?.balance || 0,
          gatewayAvailableBalance: adminWallet?.balance || 0,
          gatewayFeesToday: todayFees,
          pendingPixTransactions: pendingTransactions,
          failedPixTransactions: failedTransactions,
          averageTicket,
          successRate
        })
      }

      // Buscar transações recentes de PIX
      const { data: pixRecentTransactions } = await supabase
        .from('pix_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      
      // Formatar transações recentes
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
              type: 'pix', // PIX sempre é tipo pix
              amount: Number(t.amount || 0),
              status: t.status || 'pending',
              created_at: t.created_at,
            }
          })
        )
        setRecentTransactions(formatted)
        console.log('📋 Transações Recentes:', formatted.length)
      } else {
        setRecentTransactions([])
        console.log('📋 Nenhuma transação recente encontrada')
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar dashboard:', error)
      setError(error.message || 'Erro desconhecido ao carregar dashboard')
    } finally {
      console.log('✅ Loading finalizado')
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="text-green-500 text-xs">✓ Concluída</span>
      case 'pending':
        return <span className="text-yellow-500 text-xs">⏳ Pendente</span>
      case 'failed':
        return <span className="text-red-500 text-xs">✗ Falhou</span>
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

  const handleDeleteTransaction = (transactionId: string, status: string) => {
    console.log('🗑️ Tentando deletar transação:', { transactionId, status })
    
    // Só permite deletar transações falhadas
    if (status !== 'failed') {
      console.warn('⚠️ Tentativa de deletar transação não falhada')
      alert('Apenas transações falhadas podem ser excluídas!')
      return
    }

    // Abrir modal de confirmação
    setTransactionToDelete({ id: transactionId, status })
    setShowDeleteModal(true)
  }

  const confirmDeleteTransaction = async () => {
    if (!transactionToDelete) {
      console.error('❌ Nenhuma transação selecionada para deletar')
      return
    }

    const { id: transactionId } = transactionToDelete
    
    console.log('🔄 Confirmação recebida! Iniciando exclusão da transação:', transactionId)
    
    setDeletingTransactionId(transactionId)
    setShowDeleteModal(false)

    try {
      console.log('📡 Método 1: Tentando DELETE direto no Supabase...')
      console.log('Tabela: pix_transactions')
      console.log('ID:', transactionId)
      
      // Primeiro, verificar se a transação existe
      const { data: existingTransaction, error: existError } = await supabase
        .from('pix_transactions')
        .select('*')
        .eq('id', transactionId)
        .single()

      console.log('🔍 Verificação da transação:', { existingTransaction, existError })

      if (existError || !existingTransaction) {
        console.error('❌ Transação não encontrada:', existError)
        alert('Erro: Transação não encontrada no banco de dados.')
        return
      }

      console.log('✅ Transação encontrada:', existingTransaction)
      console.log('Status:', existingTransaction.status)
      
      // Tentar deletar
      const { error, data, count } = await supabase
        .from('pix_transactions')
        .delete()
        .eq('id', transactionId)
        .select()

      console.log('📥 Resposta completa do DELETE:', { 
        error, 
        data, 
        count,
        hasError: !!error,
        dataLength: data?.length 
      })

      if (error) {
        console.error('❌ Erro ao deletar transação (Método 1):', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        
        // Se falhar, tentar método alternativo usando SQL direto
        console.log('🔄 Tentando Método 2: SQL direto via RPC...')
        
        const { data: rpcData, error: rpcError } = await supabase.rpc('delete_failed_transaction', {
          transaction_id: transactionId
        })
        
        if (rpcError) {
          console.error('❌ Método 2 também falhou:', rpcError)
          alert(`Erro ao deletar transação: ${error.message}\n\nPermissões insuficientes. Execute o SQL: FIX_DELETE_PERMISSIONS_URGENT.sql`)
          return
        }
        
        console.log('✅ Método 2 funcionou!', rpcData)
      }

      if (!error && (!data || data.length === 0)) {
        console.warn('⚠️ Nenhum registro foi deletado. Problema de permissão RLS.')
        alert('Aviso: Nenhum registro foi deletado. Execute o SQL: FIX_DELETE_PERMISSIONS_URGENT.sql no Supabase.')
        return
      }

      // Remover da lista local IMEDIATAMENTE
      setRecentTransactions(prev => {
        const filtered = prev.filter(t => t.id !== transactionId)
        console.log('📋 Lista atualizada:', {
          antes: prev.length,
          depois: filtered.length,
          removido: transactionId
        })
        return filtered
      })
      
      console.log('✅ Transação deletada com sucesso!', data)
      
      // Verificar se realmente foi deletada do banco
      const { data: verifyData, error: verifyError } = await supabase
        .from('pix_transactions')
        .select('id')
        .eq('id', transactionId)
        .maybeSingle()
      
      console.log('🔍 Verificação pós-exclusão:', { verifyData, verifyError })
      
      if (verifyData) {
        console.error('❌ ERRO: Transação ainda existe no banco!', verifyData)
        alert('❌ Erro: A transação não foi excluída do banco de dados. Verifique as permissões RLS.')
        // Recarregar para mostrar o estado real
        await loadDashboardData()
        return
      }
      
      console.log('✅ Confirmado: Transação removida do banco de dados!')
      alert('✅ Transação excluída com sucesso!')
      
      // NÃO recarregar automaticamente para evitar que a transação "volte"
      // await loadDashboardData()
    } catch (error: any) {
      console.error('❌ Exceção ao deletar transação:', {
        error,
        message: error?.message,
        stack: error?.stack
      })
      alert('Erro ao deletar transação: ' + (error?.message || 'Erro desconhecido'))
    } finally {
      setDeletingTransactionId(null)
      setTransactionToDelete(null)
      console.log('🏁 Processo de exclusão finalizado')
    }
  }

  // Aguardar tanto a autenticação quanto o carregamento dos dados
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

  // Se não tem usuário após loading, algo está errado
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
        <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary/10 rounded-lg border border-primary/20 self-start sm:self-auto">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Sistema Online</span>
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
              <Clock className="text-yellow-500" size={28} />
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

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/30 transition-all hover:shadow-lg hover:scale-105">
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
                <p className="text-xs text-muted-foreground">Aguardando processamento</p>
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
          {/* Container com scroll e altura máxima */}
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
                    
                    {/* Botão de exclusão - apenas para transações falhadas */}
                    {transaction.status === 'failed' && (
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          console.log('🖱️ Botão de exclusão clicado para:', transaction.id)
                          handleDeleteTransaction(transaction.id, transaction.status)
                        }}
                        disabled={deletingTransactionId === transaction.id}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110"
                        title="Excluir transação falhada"
                        type="button"
                      >
                        {deletingTransactionId === transaction.id ? (
                          <RefreshCw className="animate-spin" size={16} />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Indicador de scroll */}
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
                  Excluir Transação Falhada?
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