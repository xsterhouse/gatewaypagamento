import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { TrendingUp, TrendingDown, Clock, CheckCircle } from 'lucide-react'

interface OrderWithUser {
  id: string
  user_id: string
  order_type: string
  order_mode: string
  amount: number
  price: number
  total_value: number
  status: string
  created_at: string
  user_name: string
  user_email: string
  trading_pair: {
    base_currency: string
    quote_currency: string
  }
}

export function AdminExchange() {
  const [orders, setOrders] = useState<OrderWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [stats, setStats] = useState({
    total_orders: 0,
    pending_orders: 0,
    completed_orders: 0,
    total_volume: 0
  })

  useEffect(() => {
    loadOrders()
    loadStats()
  }, [])

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('exchange_orders')
        .select(`
          *,
          users (
            name,
            email
          ),
          trading_pairs (
            base_currency,
            quote_currency
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      const ordersWithUser = data?.map(order => ({
        ...order,
        user_name: order.users?.name || 'N/A',
        user_email: order.users?.email || 'N/A',
        trading_pair: order.trading_pairs || { base_currency: 'N/A', quote_currency: 'N/A' }
      })) || []

      setOrders(ordersWithUser)
    } catch (error) {
      console.error('Erro ao carregar ordens:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const { count: total_orders } = await supabase
        .from('exchange_orders')
        .select('*', { count: 'exact', head: true })

      const { count: pending_orders } = await supabase
        .from('exchange_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      const { count: completed_orders } = await supabase
        .from('exchange_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')

      const { data: allOrders } = await supabase
        .from('exchange_orders')
        .select('total_value')

      const total_volume = allOrders?.reduce((acc, order) => acc + Number(order.total_value || 0), 0) || 0

      setStats({
        total_orders: total_orders || 0,
        pending_orders: pending_orders || 0,
        completed_orders: completed_orders || 0,
        total_volume
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'Pendente', variant: 'secondary' },
      completed: { label: 'Concluído', variant: 'default' },
      cancelled: { label: 'Cancelado', variant: 'destructive' },
      partial: { label: 'Parcial', variant: 'outline' },
    }

    const { label, variant } = statusMap[status] || { label: status, variant: 'outline' }
    return <Badge variant={variant}>{label}</Badge>
  }

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.status === filter)

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
        <h1 className="text-3xl font-bold">Exchange & Ordens</h1>
        <p className="text-gray-500 mt-1">Gerencie todas as ordens de compra e venda</p>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Ordens</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_orders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending_orders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed_orders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Volume Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(stats.total_volume)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex gap-2">
            <Button 
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              Todas
            </Button>
            <Button 
              variant={filter === 'pending' ? 'default' : 'outline'}
              onClick={() => setFilter('pending')}
            >
              Pendentes
            </Button>
            <Button 
              variant={filter === 'completed' ? 'default' : 'outline'}
              onClick={() => setFilter('completed')}
            >
              Concluídas
            </Button>
            <Button 
              variant={filter === 'cancelled' ? 'default' : 'outline'}
              onClick={() => setFilter('cancelled')}
            >
              Canceladas
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Lista de Ordens */}
      <Card>
        <CardHeader>
          <CardTitle>Ordens Recentes ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Data</th>
                  <th className="text-left p-3">Usuário</th>
                  <th className="text-center p-3">Tipo</th>
                  <th className="text-left p-3">Par</th>
                  <th className="text-right p-3">Quantidade</th>
                  <th className="text-right p-3">Preço</th>
                  <th className="text-right p-3">Total</th>
                  <th className="text-center p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500">
                      Nenhuma ordem encontrada
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('pt-BR')}
                        <br />
                        {new Date(order.created_at).toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="font-semibold text-sm">{order.user_name}</p>
                          <p className="text-xs text-gray-500">{order.user_email}</p>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        {order.order_type === 'buy' ? (
                          <div className="flex items-center justify-center gap-1 text-green-600">
                            <TrendingUp className="h-4 w-4" />
                            <span className="font-semibold">Compra</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1 text-red-600">
                            <TrendingDown className="h-4 w-4" />
                            <span className="font-semibold">Venda</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3 font-semibold">
                        {order.trading_pair.base_currency}/{order.trading_pair.quote_currency}
                      </td>
                      <td className="p-3 text-right">
                        {Number(order.amount).toFixed(8)}
                      </td>
                      <td className="p-3 text-right">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(Number(order.price))}
                      </td>
                      <td className="p-3 text-right font-semibold">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(Number(order.total_value))}
                      </td>
                      <td className="p-3 text-center">
                        {getStatusBadge(order.status)}
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
