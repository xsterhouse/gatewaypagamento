import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { Search, Wallet, TrendingUp, Users, RefreshCw, Eye, Lock, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ViewWalletModal } from '@/components/ViewWalletModal'

interface WalletWithUser {
  id: string
  user_id: string
  currency_code: string
  currency_type: string
  wallet_name: string
  balance: number
  available_balance: number
  blocked_balance: number
  is_active: boolean
  user_name: string
  user_email: string
  created_at: string
}

export function AdminWallets() {
  const [wallets, setWallets] = useState<WalletWithUser[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<WalletWithUser | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [stats, setStats] = useState({
    total_wallets: 0,
    total_balance_brl: 0,
    active_users: 0
  })

  useEffect(() => {
    loadWallets()
    loadStats()
  }, [])

  const loadWallets = async () => {
    try {
      console.log('🔍 Carregando carteiras no admin...')
      
      // Tentar carregar com join primeiro (TODAS as carteiras, ativas e bloqueadas)
      const { data: walletsData, error: walletsError } = await supabase
        .from('wallets')
        .select(`
          *,
          users (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      // Se o join falhar (sem foreign key), carregar separadamente
      if (walletsError && walletsError.code === 'PGRST200') {
        console.log('⚠️ Foreign key não encontrada, carregando dados separadamente...')
        
        // Carregar carteiras (TODAS, ativas e bloqueadas)
        const { data: wallets, error: walletsFetchError } = await supabase
          .from('wallets')
          .select('*')
          .order('created_at', { ascending: false })

        if (walletsFetchError) throw walletsFetchError

        // Carregar usuários
        const userIds = [...new Set(wallets?.map(w => w.user_id) || [])]
        const { data: users } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', userIds)

        const usersMap = new Map(users?.map(u => [u.id, u]) || [])

        const walletsWithUser = wallets?.map(wallet => ({
          ...wallet,
          user_name: usersMap.get(wallet.user_id)?.name || 'N/A',
          user_email: usersMap.get(wallet.user_id)?.email || 'N/A'
        })) || []

        console.log('✅ Carteiras carregadas (sem join):', walletsWithUser.length)
        setWallets(walletsWithUser)
        return
      }

      if (walletsError) throw walletsError

      console.log('✅ Carteiras carregadas (com join):', walletsData?.length || 0)
      if (walletsData && walletsData.length > 0) {
        console.log('📋 Primeira carteira:', walletsData[0])
      }

      const walletsWithUser = walletsData?.map(wallet => ({
        ...wallet,
        user_name: wallet.users?.name || 'N/A',
        user_email: wallet.users?.email || 'N/A'
      })) || []

      setWallets(walletsWithUser)
    } catch (error) {
      console.error('❌ Erro ao carregar wallets:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadWallets()
    await loadStats()
  }

  const handleViewWallet = (wallet: WalletWithUser) => {
    setSelectedWallet(wallet)
    setIsViewModalOpen(true)
  }

  const handleBlockWallet = async (wallet: WalletWithUser) => {
    const action = wallet.is_active ? 'bloquear' : 'desbloquear'
    
    if (!confirm(`Tem certeza que deseja ${action} a carteira "${wallet.wallet_name}"?`)) {
      return
    }

    try {
      const newStatus = !wallet.is_active
      
      console.log('🔒 Bloqueando/Desbloqueando carteira:', {
        id: wallet.id,
        wallet_name: wallet.wallet_name,
        current_status: wallet.is_active,
        new_status: newStatus
      })
      
      const { error } = await supabase
        .from('wallets')
        .update({ is_active: newStatus })
        .eq('id', wallet.id)

      if (error) {
        console.error('❌ Erro ao atualizar:', error)
        throw error
      }

      console.log('✅ Carteira atualizada com sucesso')

      toast.success(
        `${wallet.wallet_name} foi ${newStatus ? 'desbloqueada' : 'bloqueada'} com sucesso`
      )
      
      await loadWallets()
      await loadStats()
    } catch (error: any) {
      console.error('❌ Erro ao bloquear/desbloquear carteira:', error)
      toast.error(`Erro ao atualizar carteira: ${error.message}`)
    }
  }

  const handleDeleteWallet = async (wallet: WalletWithUser) => {
    if (!confirm(`Tem certeza que deseja excluir a carteira "${wallet.wallet_name}"?\n\nEsta ação não pode ser desfeita!`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('wallets')
        .delete()
        .eq('id', wallet.id)

      if (error) throw error

      toast.success(`${wallet.wallet_name} foi excluída com sucesso`)
      
      await loadWallets()
      await loadStats()
    } catch (error: any) {
      console.error('Erro ao excluir carteira:', error)
      toast.error(`Erro ao excluir carteira: ${error.message}`)
    }
  }

  const loadStats = async () => {
    try {
      // Total de wallets (todas as ativas)
      const { count: total_wallets, error: countError } = await supabase
        .from('wallets')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      if (countError) {
        console.error('Erro ao contar wallets:', countError)
      }

      // Saldo total em BRL
      const { data: brlWallets, error: balanceError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('currency_code', 'BRL')
        .eq('is_active', true)

      if (balanceError) {
        console.error('Erro ao buscar saldo BRL:', balanceError)
      }

      const total_balance_brl = brlWallets?.reduce((acc, w) => acc + Number(w.balance), 0) || 0

      // Usuários com wallets ativas (único)
      const { data: activeUsers, error: usersError } = await supabase
        .from('wallets')
        .select('user_id')
        .eq('is_active', true)

      if (usersError) {
        console.error('Erro ao buscar usuários:', usersError)
      }

      const uniqueUsers = new Set(activeUsers?.map(w => w.user_id) || [])

      const newStats = {
        total_wallets: total_wallets || 0,
        total_balance_brl,
        active_users: uniqueUsers.size
      }

      console.log('Stats carregadas:', newStats)
      setStats(newStats)
    } catch (error: any) {
      console.error('Erro ao carregar estatísticas:', error)
      // Mantém valores zerados em caso de erro
      setStats({
        total_wallets: 0,
        total_balance_brl: 0,
        active_users: 0
      })
    }
  }

  const filteredWallets = wallets.filter(wallet =>
    wallet.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wallet.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wallet.currency_code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatCurrency = (value: number, currencyCode: string) => {
    if (currencyCode === 'BRL') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value)
    }
    return `${value.toFixed(8)} ${currencyCode}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando dados...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Gerenciar Carteiras</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">Visualize e gerencie todas as carteiras dos usuários</p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Carteiras</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_wallets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total (BRL)</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(stats.total_balance_brl)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.active_users}</div>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Buscar por usuário ou moeda..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardHeader>
      </Card>

      {/* Lista de Wallets */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Carteiras ({filteredWallets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-medium">Usuário</th>
                  <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-medium">Nome da Carteira</th>
                  <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-medium">Moeda</th>
                  <th className="text-right p-2 sm:p-3 text-xs sm:text-sm font-medium">Saldo Total</th>
                  <th className="text-right p-2 sm:p-3 text-xs sm:text-sm font-medium">Disponível</th>
                  <th className="text-right p-2 sm:p-3 text-xs sm:text-sm font-medium">Bloqueado</th>
                  <th className="text-center p-2 sm:p-3 text-xs sm:text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredWallets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                      Nenhuma carteira encontrada
                    </td>
                  </tr>
                ) : (
                  filteredWallets.map((wallet) => (
                    <tr key={wallet.id} className={`border-b hover:bg-accent ${!wallet.is_active ? 'opacity-60 bg-red-50 dark:bg-red-950/20' : ''}`}>
                      <td className="p-2 sm:p-3">
                        <div>
                          <p className="font-medium text-xs sm:text-sm">{wallet.user_name}</p>
                          <p className="text-xs text-muted-foreground">{wallet.user_email}</p>
                        </div>
                      </td>
                      <td className="p-2 sm:p-3">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                          <span className="font-medium text-xs sm:text-sm">{wallet.wallet_name || 'Sem nome'}</span>
                          {!wallet.is_active && (
                            <span className="text-xs bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded border border-red-500/20 whitespace-nowrap">
                              🔒 Bloqueada
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-2 sm:p-3">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span className="text-lg sm:text-xl">
                            {wallet.currency_type === 'fiat' ? '💵' : '₿'}
                          </span>
                          <span className="font-semibold text-xs sm:text-sm">{wallet.currency_code}</span>
                        </div>
                      </td>
                      <td className="p-2 sm:p-3 text-right font-semibold text-xs sm:text-sm">
                        {formatCurrency(Number(wallet.balance), wallet.currency_code)}
                      </td>
                      <td className="p-2 sm:p-3 text-right text-green-600 text-xs sm:text-sm">
                        {formatCurrency(Number(wallet.available_balance), wallet.currency_code)}
                      </td>
                      <td className="p-2 sm:p-3 text-right text-red-600 text-xs sm:text-sm">
                        {formatCurrency(Number(wallet.blocked_balance), wallet.currency_code)}
                      </td>
                      <td className="p-2 sm:p-3">
                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                          {/* Botão Visualizar */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewWallet(wallet)}
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-blue-500/10 hover:text-blue-500"
                            title="Visualizar detalhes"
                          >
                            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>

                          {/* Botão Bloquear/Desbloquear */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleBlockWallet(wallet)}
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-yellow-500/10 hover:text-yellow-500"
                            title={wallet.is_active ? 'Bloquear carteira' : 'Desbloquear carteira'}
                          >
                            <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>

                          {/* Botão Excluir */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteWallet(wallet)}
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-red-500/10 hover:text-red-500"
                            title="Excluir carteira"
                          >
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Visualização */}
      <ViewWalletModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        wallet={selectedWallet}
      />
    </div>
  )
}
