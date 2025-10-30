import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { Search, Wallet, TrendingUp, Users } from 'lucide-react'

interface WalletWithUser {
  id: string
  user_id: string
  currency_code: string
  currency_type: string
  balance: number
  available_balance: number
  blocked_balance: number
  user_name: string
  user_email: string
}

export function AdminWallets() {
  const [wallets, setWallets] = useState<WalletWithUser[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
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
      const { data, error } = await supabase
        .from('wallets')
        .select(`
          *,
          users (
            name,
            email
          )
        `)
        .order('balance', { ascending: false })

      if (error) throw error

      const walletsWithUser = data?.map(wallet => ({
        ...wallet,
        user_name: wallet.users?.name || 'N/A',
        user_email: wallet.users?.email || 'N/A'
      })) || []

      setWallets(walletsWithUser)
    } catch (error) {
      console.error('Erro ao carregar wallets:', error)
    } finally {
      setLoading(false)
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gerenciar Carteiras</h1>
        <p className="text-gray-500 mt-1">Visualize e gerencie todas as carteiras dos usuários</p>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-6 md:grid-cols-3">
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
                  <th className="text-left p-3">Usuário</th>
                  <th className="text-left p-3">Moeda</th>
                  <th className="text-right p-3">Saldo Total</th>
                  <th className="text-right p-3">Disponível</th>
                  <th className="text-right p-3">Bloqueado</th>
                  <th className="text-center p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredWallets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      Nenhuma carteira encontrada
                    </td>
                  </tr>
                ) : (
                  filteredWallets.map((wallet) => (
                    <tr key={wallet.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div>
                          <p className="font-semibold">{wallet.user_name}</p>
                          <p className="text-sm text-gray-500">{wallet.user_email}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">
                            {wallet.currency_type === 'fiat' ? '💵' : '₿'}
                          </span>
                          <span className="font-semibold">{wallet.currency_code}</span>
                        </div>
                      </td>
                      <td className="p-3 text-right font-semibold">
                        {formatCurrency(Number(wallet.balance), wallet.currency_code)}
                      </td>
                      <td className="p-3 text-right text-green-600">
                        {formatCurrency(Number(wallet.available_balance), wallet.currency_code)}
                      </td>
                      <td className="p-3 text-right text-red-600">
                        {formatCurrency(Number(wallet.blocked_balance), wallet.currency_code)}
                      </td>
                      <td className="p-3 text-center">
                        <Button variant="outline" size="sm">
                          Gerenciar
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
