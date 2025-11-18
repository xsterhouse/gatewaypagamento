import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Wallet, 
  TrendingUp, 
  Lock, 
  DollarSign,
  QrCode,
  CreditCard,
  FileText,
  Code,
  Repeat,
  Banknote,
  Ticket,
  ArrowRight,
  AlertCircle,
  Upload,
  RefreshCw,
  CheckCircle
} from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { GerarPixModal } from '@/components/GerarPixModal'
import { SaquePixModal } from '@/components/SaquePixModal'

interface DashboardMetrics {
  availableBalance: number
  receivedToday: number
  blockedBalance: number
  totalInvoicing: number
  averageTicket: number
  dailyAverage: number
  transactionsCount: number
  pendingAmount: number
}

export function Dashboard() {
  const navigate = useNavigate()
  const { effectiveUserId, userData } = useAuth()
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    availableBalance: 0,
    receivedToday: 0,
    blockedBalance: 0,
    totalInvoicing: 0,
    averageTicket: 0,
    dailyAverage: 0,
    transactionsCount: 0,
    pendingAmount: 0,
  })

  const [chartData, setChartData] = useState<any[]>([])
  const [isPixModalOpen, setIsPixModalOpen] = useState(false)
  const [isSaqueModalOpen, setIsSaqueModalOpen] = useState(false)
  const [hasPendingMED, setHasPendingMED] = useState(false)
  const [medCount, setMedCount] = useState(0)

  useEffect(() => {
    if (effectiveUserId) {
      loadMetrics()
      loadChartData()
      calculateConversionRates()
      checkPendingMED()
    }
  }, [effectiveUserId])

  const loadMetrics = async () => {
    if (!effectiveUserId) return
    
    try {
      // Buscar saldo da carteira BRL
      const { data: wallets, error: walletError } = await supabase
        .from('wallets')
        .select('balance, available_balance, blocked_balance')
        .eq('user_id', effectiveUserId)
        .eq('currency_code', 'BRL')
        .eq('is_active', true)
        .limit(1)

      if (walletError) {
        console.error('Erro ao buscar carteira:', walletError)
      }
      
      // Pegar a primeira carteira (ou null se não houver)
      const wallet = wallets?.[0] || null

      // Buscar transações da carteira
      const { data: transactions, error: transError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', effectiveUserId)

      if (transError) {
        console.error('Erro ao buscar transações:', transError)
      }

      const today = new Date().toISOString().split('T')[0]
      // wallet_transactions não tem 'status', considerar todas as transações como aprovadas
      const approvedTransactions = transactions || []
      const pendingTransactions: any[] = [] // wallet_transactions não tem status pending
      
      const todayTransactions = approvedTransactions.filter(t => 
        t.created_at && t.created_at.startsWith(today)
      )
      
      // Total de vendas aprovadas
      const total = approvedTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0)
      
      // Recebido hoje (apenas créditos)
      const todayTotal = todayTransactions
        .filter(t => t.transaction_type === 'credit')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0)

      // Saldo a receber (não aplicável para wallet_transactions)
      const pendingAmount = 0

      // Calcular média diária dos últimos 30 dias
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const last30Days = approvedTransactions.filter(t => 
        t.created_at && new Date(t.created_at) >= thirtyDaysAgo
      )
      const dailyAverage = last30Days.length > 0 
        ? last30Days.reduce((sum, t) => sum + Number(t.amount || 0), 0) / 30
        : todayTotal

      // Ticket médio (média de valor por transação)
      const averageTicket = approvedTransactions.length > 0 
        ? total / approvedTransactions.length 
        : 0

      setMetrics(prev => ({
        ...prev,
        availableBalance: wallet?.available_balance || 0,
        receivedToday: todayTotal,
        // blockedBalance será atualizado por checkPendingMED()
        totalInvoicing: total,
        averageTicket: averageTicket,
        dailyAverage: dailyAverage,
        transactionsCount: approvedTransactions.length,
        pendingAmount: pendingAmount,
      }))

      console.log('📊 Métricas carregadas:', {
        wallet,
        transactionsCount: transactions?.length,
        approvedCount: approvedTransactions.length,
        pendingCount: pendingTransactions.length,
        ticketMedio: averageTicket.toFixed(2),
        mediaDiaria: dailyAverage.toFixed(2),
        saldoAReceber: pendingAmount.toFixed(2)
      })
    } catch (error) {
      console.error('Erro ao carregar métricas:', error)
    }
  }

  const checkPendingMED = async () => {
    if (!effectiveUserId) return

    try {
      // Buscar apenas MEDs pendentes para o card
      const { data: pendingData, error: pendingError } = await supabase
        .from('med_requests')
        .select('id, status, amount')
        .eq('user_id', effectiveUserId)
        .eq('status', 'pending')

      // Buscar MEDs pendentes e aprovados para calcular blockedBalance
      const { data: allData, error: allError } = await supabase
        .from('med_requests')
        .select('id, status, amount')
        .eq('user_id', effectiveUserId)
        .in('status', ['pending', 'approved'])

      if (pendingError || allError) {
        console.error('Erro ao verificar MED:', pendingError || allError)
        return
      }

      const pendingCount = pendingData?.length || 0
      const hasPendingMED = pendingCount > 0
      
      setMedCount(pendingCount)
      setHasPendingMED(hasPendingMED)
      
      // Calcular valor total em disputa (apenas MEDs pendentes e aprovados)
      const totalMEDAmount = allData?.reduce((sum, med) => sum + Number(med.amount || 0), 0) || 0
      
      // Atualizar o blockedBalance com o valor dos MEDs
      setMetrics(prev => ({
        ...prev,
        blockedBalance: totalMEDAmount
      }))
      
      console.log('🔄 MED Status:', {
        pendingCount,
        hasPendingMED,
        totalAmount: totalMEDAmount,
        pendingData,
        allData
      })
    } catch (error) {
      console.error('Erro ao verificar MED:', error)
    }
  }

  const loadChartData = async () => {
    if (!effectiveUserId) return
    
    try {
      const today = new Date()
      const fiveDaysAgo = new Date(today)
      fiveDaysAgo.setDate(today.getDate() - 5)

      // Buscar transações dos últimos 5 dias
      const { data: transactions, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', effectiveUserId)
        .gte('created_at', fiveDaysAgo.toISOString())

      if (error) {
        console.error('Erro ao buscar transações:', error)
        return
      }

      // Agrupar por dia e separar entradas/saídas
      const dataByDay: { [key: string]: { entradas: number; saidas: number } } = {}
      
      // Inicializar últimos 5 dias
      for (let i = 4; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(today.getDate() - i)
        const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
        dataByDay[dateStr] = { entradas: 0, saidas: 0 }
      }

      // Processar transações
      transactions?.forEach(transaction => {
        const date = new Date(transaction.created_at)
        const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
        
        if (dataByDay[dateStr]) {
          const amount = Number(transaction.amount) / 1000 // Converter para milhares
          
          // Entradas: credit (depósitos)
          if (transaction.transaction_type === 'credit') {
            dataByDay[dateStr].entradas += amount
          }
          // Saídas: debit (saques, transferências)
          if (transaction.transaction_type === 'debit') {
            dataByDay[dateStr].saidas += amount
          }
        }
      })

      // Converter para array
      const chartDataArray = Object.entries(dataByDay).map(([date, values]) => ({
        date,
        entradas: Number(values.entradas.toFixed(2)),
        saidas: Number(values.saidas.toFixed(2)),
      }))

      setChartData(chartDataArray)
      console.log('📊 Gráfico de faturamento carregado:', chartDataArray)
    } catch (error) {
      console.error('Erro ao carregar dados do gráfico:', error)
    }
  }

  const [conversionRates, setConversionRates] = useState([
    { name: 'Conversão Geral', rate: 0, icon: Repeat, color: 'text-emerald-400' },
    { name: 'Pix', rate: 0, icon: QrCode, color: 'text-cyan-400' },
    { name: 'Cartão de Crédito', rate: 0, icon: CreditCard, color: 'text-emerald-400' },
    { name: 'Boleto', rate: 0, icon: FileText, color: 'text-emerald-400' },
    { name: 'Taxa de retorno', rate: 0, icon: Repeat, color: 'text-emerald-400' },
  ])

  const calculateConversionRates = async () => {
    if (!effectiveUserId) return
    
    try {
      const { data: allTransactions, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', effectiveUserId)

      if (error) {
        console.error('Erro ao buscar transações para conversão:', error)
        return
      }

      if (allTransactions && allTransactions.length > 0) {
        // wallet_transactions não tem status, considerar todas aprovadas
        const approved = allTransactions
        const pending: any[] = []
        const rejected: any[] = []
        const refunded: any[] = []
        
        const generalRate = 100 // Todas aprovadas

        // Calcular por método (extrair de metadata)
        const pixRate = allTransactions.some(t => t.metadata?.payment_method === 'pix') ? 100 : 0

        const cardTransactions = allTransactions.filter(t => 
          t.metadata?.payment_method === 'credit_card' || 
          t.metadata?.payment_method === 'debit_card'
        )
        const cardRate = cardTransactions.length > 0 ? 100 : 0

        const boletoTransactions = allTransactions.filter(t => t.metadata?.payment_method === 'boleto')
        const boletoRate = boletoTransactions.length > 0 ? 100 : 0

        const returnRate = 0 // Sem reembolsos em wallet_transactions

        setConversionRates([
          { name: 'Conversão Geral', rate: Math.round(generalRate), icon: Repeat, color: 'text-emerald-400' },
          { name: 'Pix', rate: Math.round(pixRate), icon: QrCode, color: 'text-cyan-400' },
          { name: 'Cartão de Crédito', rate: Math.round(cardRate), icon: CreditCard, color: 'text-emerald-400' },
          { name: 'Boleto', rate: Math.round(boletoRate), icon: FileText, color: 'text-emerald-400' },
          { name: 'Taxa de retorno', rate: Math.round(returnRate), icon: Repeat, color: 'text-red-400' },
        ])

        console.log('📈 Conversão calculada:', {
          total: allTransactions.length,
          aprovadas: approved.length,
          pendentes: pending.length,
          rejeitadas: rejected.length,
          reembolsadas: refunded.length,
          taxaGeral: `${Math.round(generalRate)}%`
        })
      } else {
        // Sem transações, manter em 0
        setConversionRates([
          { name: 'Conversão Geral', rate: 0, icon: Repeat, color: 'text-emerald-400' },
          { name: 'Pix', rate: 0, icon: QrCode, color: 'text-cyan-400' },
          { name: 'Cartão de Crédito', rate: 0, icon: CreditCard, color: 'text-emerald-400' },
          { name: 'Boleto', rate: 0, icon: FileText, color: 'text-emerald-400' },
          { name: 'Taxa de retorno', rate: 0, icon: Repeat, color: 'text-red-400' },
        ])
      }
    } catch (error) {
      console.error('Erro ao calcular conversão:', error)
    }
  }

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Banner KYC Pendente */}
      {userData?.kyc_status === 'pending' && (
        <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/50">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="text-yellow-500" size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm sm:text-base text-foreground font-semibold mb-1">
                  Documentos Pendentes de Análise
                </h3>
                <p className="text-muted-foreground text-xs sm:text-sm mb-2 sm:mb-3">
                  Seus documentos estão sendo analisados pela nossa equipe. Enquanto isso, você já pode usar algumas funcionalidades do sistema.
                </p>
                <button
                  onClick={() => navigate('/documents')}
                  className="flex items-center gap-2 text-yellow-500 hover:text-yellow-400 font-medium text-xs sm:text-sm transition-colors"
                >
                  <Upload size={16} />
                  Ver Status dos Documentos
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {userData?.kyc_status === 'rejected' && (
        <Card className="bg-gradient-to-r from-red-500/10 to-pink-500/10 border-red-500/50">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="text-red-500" size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm sm:text-base text-foreground font-semibold mb-1">
                  Documentos Rejeitados
                </h3>
                <p className="text-muted-foreground text-xs sm:text-sm mb-2">
                  {userData.kyc_rejection_reason || 'Seus documentos foram rejeitados. Por favor, envie novos documentos.'}
                </p>
                <button
                  onClick={() => navigate('/documents')}
                  className="flex items-center gap-2 text-red-500 hover:text-red-400 font-medium text-xs sm:text-sm transition-colors"
                >
                  <Upload size={16} />
                  Enviar Novos Documentos
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-card border-border transition-all hover:shadow-lg hover:scale-105">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Saldo Disponível</p>
                <h3 className="text-base sm:text-lg font-bold text-foreground">{formatCurrency(metrics.availableBalance)}</h3>
                <p className="text-xs text-muted-foreground mt-1">Saldo disponível para saque</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <Wallet className="text-emerald-400" size={18} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border transition-all hover:shadow-lg hover:scale-105">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Recebido Hoje</p>
                <h3 className="text-base sm:text-lg font-bold text-foreground">{formatCurrency(metrics.receivedToday)}</h3>
                <p className="text-xs text-muted-foreground mt-1">Total recebido no dia</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-emerald-400" size={18} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={cn(
            "bg-card border-border transition-all hover:shadow-lg cursor-pointer",
            hasPendingMED && "border-orange-500 border-2"
          )}
          onClick={() => navigate('/med')}
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-muted-foreground text-xs mb-1">Bloqueio Cautelar (MED)</p>
                <h3 className="text-base sm:text-lg font-bold text-foreground">{formatCurrency(metrics.blockedBalance)}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {hasPendingMED ? 'Valor em disputa' : 'Nenhum valor bloqueado'}
                </p>
                
                <div className="mt-3">
                  {hasPendingMED ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 rounded-md">
                        <RefreshCw className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                        <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                          {medCount} MED {medCount === 1 ? 'aberto' : 'abertos'}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle className="w-3 h-3" />
                      <span>Nenhum MED aberto</span>
                    </div>
                  )}
                </div>
              </div>
              <div className={cn(
                "w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center",
                hasPendingMED ? "bg-orange-500/10" : "bg-yellow-500/10"
              )}>
                {hasPendingMED ? (
                  <RefreshCw className="text-orange-400" size={18} />
                ) : (
                  <Lock className="text-yellow-400" size={18} />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border transition-all hover:shadow-lg hover:scale-105">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Faturamento Total</p>
                <h3 className="text-base sm:text-lg font-bold text-foreground">{formatCurrency(metrics.totalInvoicing)}</h3>
                <p className="text-xs text-muted-foreground mt-1">Valor total de vendas</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <DollarSign className="text-emerald-400" size={18} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card 
          className="bg-card border-border hover:border-emerald-500/50 transition-all hover:shadow-lg hover:scale-105 cursor-pointer"
          onClick={() => setIsPixModalOpen(true)}
        >
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <QrCode className="text-emerald-400" size={18} />
                </div>
                <div>
                  <p className="text-foreground font-medium text-xs">Gerar PIX</p>
                  <p className="text-muted-foreground text-xs">QR Code para receber</p>
                </div>
              </div>
              <ArrowRight className="text-muted-foreground" size={16} />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-card border-border hover:border-emerald-500/50 transition-all hover:shadow-lg hover:scale-105 cursor-pointer"
          onClick={() => setIsSaqueModalOpen(true)}
        >
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                  <CreditCard className="text-cyan-400" size={18} />
                </div>
                <div>
                  <p className="text-foreground font-medium text-xs">Solicitar Saque</p>
                  <p className="text-muted-foreground text-xs">Transferir via PIX</p>
                </div>
              </div>
              <ArrowRight className="text-muted-foreground" size={16} />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-card border-border hover:border-emerald-500/50 transition-all hover:shadow-lg hover:scale-105 cursor-pointer"
          onClick={() => navigate('/extrato')}
        >
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <FileText className="text-emerald-400" size={18} />
                </div>
                <div>
                  <p className="text-foreground font-medium text-xs">Transações</p>
                  <p className="text-muted-foreground text-xs">Ver histórico completo</p>
                </div>
              </div>
              <ArrowRight className="text-muted-foreground" size={16} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hover:border-emerald-500/50 transition-all hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Code className="text-purple-400" size={18} />
                </div>
                <div>
                  <p className="text-foreground font-medium text-xs">Credenciais API</p>
                  <p className="text-muted-foreground text-xs">Gerencie suas credenciais</p>
                </div>
              </div>
              <ArrowRight className="text-muted-foreground" size={16} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Conversion */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {/* Faturamento Chart */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                <Banknote className="text-muted-foreground" size={16} />
              </div>
              <div>
                <CardTitle className="text-foreground text-sm">Faturamento</CardTitle>
                <p className="text-xs text-muted-foreground hidden sm:block">Compare entradas e saídas diárias para acompanhamento do fluxo de caixa.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3e" />
                <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1f2e', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Line type="monotone" dataKey="entradas" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
                <Line type="monotone" dataKey="saidas" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conversion Rates */}
        <Card className="bg-card border-border transition-all hover:shadow-lg hover:scale-105">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                <Repeat className="text-muted-foreground" size={16} />
              </div>
              <div>
                <CardTitle className="text-foreground text-sm">Conversão</CardTitle>
                <p className="text-xs text-muted-foreground hidden sm:block">Relação entre pagamentos gerados e concluídos.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {conversionRates.map((item, index) => {
              const Icon = item.icon
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className={item.color} size={18} />
                      <span className="text-sm text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">{item.rate}%</span>
                  </div>
                  {/* Barra de Progresso */}
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500 ease-out",
                        item.name === 'Taxa de retorno' 
                          ? "bg-gradient-to-r from-red-500 to-red-400"
                          : item.name === 'Pix'
                          ? "bg-gradient-to-r from-cyan-500 to-cyan-400"
                          : "bg-gradient-to-r from-emerald-500 to-emerald-400"
                      )}
                      style={{ width: `${item.rate}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-card border-border transition-all hover:shadow-lg hover:scale-105">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Saldo à Receber</p>
                <h3 className="text-base sm:text-lg font-bold text-foreground">{formatCurrency(metrics.pendingAmount)}</h3>
                <p className="text-xs text-muted-foreground mt-1">Depósitos pendentes</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-cyan-400" size={18} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border transition-all hover:shadow-lg hover:scale-105">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Ticket Médio</p>
                <h3 className="text-base sm:text-lg font-bold text-foreground">{formatCurrency(metrics.averageTicket)}</h3>
                <p className="text-xs text-muted-foreground mt-1">Valor médio por venda</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <Ticket className="text-emerald-400" size={18} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border transition-all hover:shadow-lg hover:scale-105">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Média diária</p>
                <h3 className="text-base sm:text-lg font-bold text-foreground">{formatCurrency(metrics.dailyAverage)}</h3>
                <p className="text-xs text-muted-foreground mt-1">Faturamento médio diário</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-emerald-400" size={18} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border transition-all hover:shadow-lg hover:scale-105">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Quantidade de Transações</p>
                <h3 className="text-base sm:text-lg font-bold text-foreground">{metrics.transactionsCount}</h3>
                <p className="text-xs text-muted-foreground mt-1">Total de vendas aprovadas</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <FileText className="text-emerald-400" size={18} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modais */}
      <GerarPixModal open={isPixModalOpen} onOpenChange={setIsPixModalOpen} />
      <SaquePixModal 
        open={isSaqueModalOpen} 
        onOpenChange={setIsSaqueModalOpen}
        onSuccess={loadMetrics}
      />
    </div>
  )
}
