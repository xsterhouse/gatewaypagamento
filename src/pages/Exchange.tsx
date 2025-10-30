import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { TrendingUp, TrendingDown, ArrowUpDown, RefreshCw } from 'lucide-react'
import { useCryptoPrices } from '@/hooks/useCryptoPrices'
import { toast } from 'sonner'

interface TradingPair {
  id: string
  base_currency: string
  quote_currency: string
  fee_percentage: number
}

interface CryptoPrice {
  cryptocurrency_symbol: string
  price_brl: number
  change_24h: number
}

export function Exchange() {
  const [pairs, setPairs] = useState<TradingPair[]>([])
  const [selectedPair, setSelectedPair] = useState<TradingPair | null>(null)
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(true)
  
  // Hook para preços em tempo real da CoinGecko
  const { 
    prices, 
    loading: pricesLoading, 
    lastUpdate,
    updateFromAPI,
    isStale 
  } = useCryptoPrices({ 
    autoUpdate: true, 
    updateInterval: 5 // Atualiza a cada 5 minutos
  })

  useEffect(() => {
    loadData()
  }, [])

  // Log quando preços mudam
  useEffect(() => {
    console.log(`🪙 ${prices.length} preços disponíveis:`, prices.map(p => p.cryptocurrency_symbol).join(', '))
  }, [prices])

  const loadData = async () => {
    try {
      // Carregar pares de trading
      const { data: pairsData, error } = await supabase
        .from('trading_pairs')
        .select('*')
        .eq('is_active', true)

      if (error) {
        console.error('Erro ao carregar pares:', error)
        toast.error('Erro ao carregar pares de trading. Execute o SQL de criação.')
        return
      }

      console.log(`📊 ${pairsData?.length || 0} pares de trading carregados`)

      setPairs(pairsData || [])
      if (pairsData && pairsData.length > 0) {
        setSelectedPair(pairsData[0])
      } else {
        console.warn('⚠️ Nenhum par de trading encontrado no banco')
        toast.warning('Nenhum par de trading encontrado. Execute CRIAR_TABELAS_EXCHANGE.sql')
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshPrices = async () => {
    await updateFromAPI(true) // true = mostra toast
  }

  const getCurrentPrice = (symbol: string) => {
    const price = prices.find(p => p.cryptocurrency_symbol === symbol)
    return price?.price_brl || 0
  }

  const handleTrade = async () => {
    if (!selectedPair || !amount) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const price = getCurrentPrice(selectedPair.base_currency)
      const totalValue = Number(amount) * price

      const { error } = await supabase
        .from('exchange_orders')
        .insert({
          user_id: session.user.id,
          trading_pair_id: selectedPair.id,
          order_type: orderType,
          order_mode: 'market',
          amount: Number(amount),
          price: price,
          total_value: totalValue,
          status: 'pending'
        })

      if (error) throw error

      alert(`Ordem de ${orderType === 'buy' ? 'compra' : 'venda'} criada com sucesso!`)
      setAmount('')
    } catch (error) {
      console.error('Erro ao criar ordem:', error)
      alert('Erro ao criar ordem')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando exchange...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Exchange</h1>
          <p className="text-gray-500 mt-1">Compre e venda criptomoedas</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-sm text-gray-500">
              Atualizado: {lastUpdate.toLocaleTimeString('pt-BR')}
              {isStale && <span className="text-yellow-500 ml-2">⚠️ Desatualizado</span>}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshPrices}
            disabled={pricesLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${pricesLoading ? 'animate-spin' : ''}`} />
            Atualizar Preços
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lista de Preços */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Mercado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pairs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-2">⚠️ Nenhum par de trading encontrado</p>
                <p className="text-sm">Execute o SQL:</p>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  CRIAR_TABELAS_EXCHANGE.sql
                </code>
              </div>
            ) : (
              pairs.map((pair) => {
              const price = getCurrentPrice(pair.base_currency)
              const priceData = prices.find(p => p.cryptocurrency_symbol === pair.base_currency)
              const change = priceData?.change_24h || 0
              const isSelected = selectedPair?.id === pair.id
              const hasPrice = price > 0

              return (
                <div
                  key={pair.id}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-primary/10 border-2 border-primary shadow-md'
                      : 'bg-card hover:bg-accent border-2 border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedPair(pair)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className={`font-bold text-base ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                        {pair.base_currency}/{pair.quote_currency}
                      </p>
                      {hasPrice ? (
                        <p className="text-sm font-semibold text-foreground mt-1">
                          R$ {price.toLocaleString('pt-BR', { 
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2 
                          })}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">
                          {pricesLoading ? 'Carregando...' : 'Clique em "Atualizar Preços"'}
                        </p>
                      )}
                    </div>
                    {hasPrice && (
                      <div className={`flex items-center ml-2 ${change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {change >= 0 ? (
                          <TrendingUp className="h-4 w-4 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 mr-1" />
                        )}
                        <span className="text-sm font-bold">
                          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
            )}
          </CardContent>
        </Card>

        {/* Formulário de Trading */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedPair ? `${selectedPair.base_currency}/${selectedPair.quote_currency}` : 'Selecione um par'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedPair && (
              <>
                {/* Preço Atual */}
                <div className="bg-accent p-5 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground mb-2">Preço Atual</p>
                  {getCurrentPrice(selectedPair.base_currency) > 0 ? (
                    <p className="text-3xl font-bold text-foreground">
                      R$ {getCurrentPrice(selectedPair.base_currency).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 8
                      })}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-muted-foreground">R$ 0,00</p>
                      <p className="text-xs text-muted-foreground">
                        {pricesLoading ? '⏳ Carregando preço...' : '⚠️ Clique em "Atualizar Preços" acima'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Botões Comprar/Vender */}
                <div className="flex gap-2">
                  <Button
                    variant={orderType === 'buy' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setOrderType('buy')}
                  >
                    Comprar
                  </Button>
                  <Button
                    variant={orderType === 'sell' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setOrderType('sell')}
                  >
                    Vender
                  </Button>
                </div>

                {/* Formulário */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Quantidade ({selectedPair.base_currency})</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      step="0.00000001"
                    />
                  </div>

                  {amount && getCurrentPrice(selectedPair.base_currency) > 0 && (
                    <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Quantidade:</span>
                        <span className="font-semibold text-foreground">{amount} {selectedPair.base_currency}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Preço unitário:</span>
                        <span className="font-semibold text-foreground">
                          R$ {getCurrentPrice(selectedPair.base_currency).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Taxa ({selectedPair.fee_percentage}%):</span>
                        <span className="font-semibold text-foreground">
                          R$ {(Number(amount) * getCurrentPrice(selectedPair.base_currency) * Number(selectedPair.fee_percentage) / 100).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                      </div>
                      <div className="border-t border-primary/20 pt-3 flex justify-between items-center">
                        <span className="font-bold text-foreground">Total:</span>
                        <span className="font-bold text-xl text-primary">
                          R$ {(Number(amount) * getCurrentPrice(selectedPair.base_currency) * (1 + Number(selectedPair.fee_percentage) / 100)).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                      </div>
                    </div>
                  )}

                  {amount && getCurrentPrice(selectedPair.base_currency) === 0 && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        ⚠️ Aguarde o carregamento dos preços ou clique em "Atualizar Preços"
                      </p>
                    </div>
                  )}

                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleTrade}
                    disabled={!amount || Number(amount) <= 0}
                  >
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    {orderType === 'buy' ? 'Comprar' : 'Vender'} {selectedPair.base_currency}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
