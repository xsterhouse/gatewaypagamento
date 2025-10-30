import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Wallet, TrendingUp, TrendingDown, Plus, Send, RefreshCw, AlertCircle, Trash2, Grid, List, ArrowUpCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { CreateWalletModal } from '@/components/CreateWalletModal'
import { DepositWalletModal } from '@/components/DepositWalletModal'
import { SendWalletModal } from '@/components/SendWalletModal'
import { DeleteWalletModal } from '@/components/DeleteWalletModal'

interface WalletData {
  id: string
  user_id: string
  currency_code: string
  currency_type: string
  wallet_name?: string
  balance: number
  available_balance: number
  blocked_balance: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export function Wallets() {
  const { effectiveUserId } = useAuth()
  const [wallets, setWallets] = useState<WalletData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false)
  const [isSendModalOpen, setIsSendModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  useEffect(() => {
    if (effectiveUserId) {
      loadWallets()
    }
  }, [effectiveUserId])

  const loadWallets = async () => {
    try {
      setError(null)
      
      if (!effectiveUserId) {
        setError('Usuário não autenticado')
        return
      }

      const { data, error: dbError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', effectiveUserId)
        .eq('is_active', true)
        .order('currency_type', { ascending: true })
        .order('currency_code', { ascending: true })

      if (dbError) throw dbError
      
      setWallets(data || [])
      
      if (data && data.length === 0) {
        console.log('Nenhuma carteira encontrada para o usuário')
      }
    } catch (error: any) {
      console.error('Erro ao carregar carteiras:', error)
      setError(error.message || 'Erro ao carregar carteiras')
      toast.error('Erro ao carregar carteiras. Tente novamente.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadWallets()
    toast.success('Carteiras atualizadas!')
  }

  const formatCurrency = (value: number, currencyCode: string) => {
    if (currencyCode === 'BRL') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value)
    }
    return `${value.toFixed(8)} ${currencyCode}`
  }

  const getCurrencyIcon = (currencyType: string) => {
    return currencyType === 'fiat' ? '💵' : '₿'
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        <div className="text-gray-400">Carregando carteiras...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Erro ao carregar carteiras</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <Button onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Minhas Carteiras</h1>
          <p className="text-gray-500 mt-1">Gerencie suas carteiras de criptomoedas e reais</p>
        </div>
        <div className="flex gap-2">
          {/* Botões de visualização */}
          <div className="flex border border-border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Carteira
          </Button>
        </div>
      </div>

      {/* Resumo Total */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="transition-all hover:shadow-lg hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total (BRL)</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                wallets
                  .filter(w => w.currency_code === 'BRL')
                  .reduce((acc, w) => acc + Number(w.balance), 0),
                'BRL'
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-lg hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Disponível</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(
                wallets
                  .filter(w => w.currency_code === 'BRL')
                  .reduce((acc, w) => acc + Number(w.available_balance), 0),
                'BRL'
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-lg hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bloqueado</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(
                wallets
                  .filter(w => w.currency_code === 'BRL')
                  .reduce((acc, w) => acc + Number(w.blocked_balance), 0),
                'BRL'
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Carteiras */}
      {wallets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center">
              Você ainda não possui carteiras criadas.<br />
              Clique em "Criar Carteira" para começar.
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        /* Visualização em Tabela/Lista */
        <Card>
          <CardHeader>
            <CardTitle>Minhas Carteiras ({wallets.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Nome</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Moeda</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Saldo Total</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Disponível</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Bloqueado</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.map((wallet) => (
                    <tr key={wallet.id} className="border-b border-border hover:bg-accent/50 transition-all">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-primary" />
                          <span className="font-medium">{wallet.wallet_name || wallet.currency_code}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getCurrencyIcon(wallet.currency_type)}</span>
                          <span className="font-semibold">{wallet.currency_code}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">
                        {formatCurrency(Number(wallet.balance), wallet.currency_code)}
                      </td>
                      <td className="py-3 px-4 text-right text-green-600 font-medium">
                        {formatCurrency(Number(wallet.available_balance), wallet.currency_code)}
                      </td>
                      <td className="py-3 px-4 text-right text-red-600 font-medium">
                        {formatCurrency(Number(wallet.blocked_balance), wallet.currency_code)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* Botão Depositar */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedWallet(wallet)
                              setIsDepositModalOpen(true)
                            }}
                            className="h-8 w-8 p-0 hover:bg-green-500/10 hover:text-green-500"
                            title="Depositar"
                          >
                            <ArrowUpCircle className="h-4 w-4" />
                          </Button>

                          {/* Botão Enviar */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedWallet(wallet)
                              setIsSendModalOpen(true)
                            }}
                            className="h-8 w-8 p-0 hover:bg-blue-500/10 hover:text-blue-500"
                            title="Enviar"
                          >
                            <Send className="h-4 w-4" />
                          </Button>

                          {/* Botão Excluir */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedWallet(wallet)
                              setIsDeleteModalOpen(true)
                            }}
                            className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-500"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Visualização em Grid/Cards */
        <div className="grid gap-6 md:grid-cols-2">
          {wallets.map((wallet) => (
            <Card key={wallet.id} className="transition-all hover:shadow-xl hover:scale-105 hover:border-primary/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{getCurrencyIcon(wallet.currency_type)}</div>
                    <div>
                      <CardTitle className="text-xl">{wallet.currency_code}</CardTitle>
                      <p className="text-sm text-gray-500">
                        {wallet.currency_type === 'fiat' ? 'Real Brasileiro' : 'Criptomoeda'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-500/10"
                    onClick={() => {
                      setSelectedWallet(wallet)
                      setIsDeleteModalOpen(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Saldo Total</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(Number(wallet.balance), wallet.currency_code)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Disponível</p>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(Number(wallet.available_balance), wallet.currency_code)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Bloqueado</p>
                    <p className="font-semibold text-red-600">
                      {formatCurrency(Number(wallet.blocked_balance), wallet.currency_code)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedWallet(wallet)
                      setIsDepositModalOpen(true)
                    }}
                  >
                    <ArrowUpCircle className="h-4 w-4 mr-2" />
                    Depositar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedWallet(wallet)
                      setIsSendModalOpen(true)
                    }}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Criar Carteira */}
      <CreateWalletModal 
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onWalletCreated={loadWallets}
      />

      {/* Modal de Depositar */}
      <DepositWalletModal
        open={isDepositModalOpen}
        onOpenChange={setIsDepositModalOpen}
        wallet={selectedWallet}
        onDepositSuccess={loadWallets}
      />

      {/* Modal de Enviar */}
      <SendWalletModal
        open={isSendModalOpen}
        onOpenChange={setIsSendModalOpen}
        wallet={selectedWallet}
        onSendSuccess={loadWallets}
      />

      {/* Modal de Excluir */}
      <DeleteWalletModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        wallet={selectedWallet}
        onDeleteSuccess={loadWallets}
      />
    </div>
  )
}
