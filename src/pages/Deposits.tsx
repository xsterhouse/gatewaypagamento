import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { Plus, CheckCircle, Clock, XCircle, RefreshCw, FileText } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { GerarPixModal } from '@/components/GerarPixModal'
import { GerarBoletoModal } from '@/components/GerarBoletoModal'

interface Deposit {
  id: string
  amount: number
  method: string
  status: string
  created_at: string
  processed_at: string | null
}

export function Deposits() {
  const { effectiveUserId } = useAuth()
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [loading, setLoading] = useState(true)
  const [isPixModalOpen, setIsPixModalOpen] = useState(false)
  const [isBoletoModalOpen, setIsBoletoModalOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (effectiveUserId) {
      loadDeposits()
    }
  }, [effectiveUserId])

  const loadDeposits = async () => {
    try {
      if (!effectiveUserId) return

      const { data, error } = await supabase
        .from('deposits')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar depósitos:', error)
      }
      
      setDeposits(data || [])
      console.log('💰 Depósitos carregados:', data?.length || 0)
    } catch (error) {
      console.error('Erro ao carregar depósitos:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadDeposits()
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'Pendente', variant: 'secondary' },
      approved: { label: 'Aprovado', variant: 'default' },
      rejected: { label: 'Rejeitado', variant: 'destructive' },
    }

    const { label, variant } = statusMap[status] || { label: status, variant: 'outline' }
    return <Badge variant={variant}>{label}</Badge>
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      pix: 'PIX',
      ted: 'TED',
      boleto: 'Boleto',
      card: 'Cartão'
    }
    return methods[method] || method
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando depósitos...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Depósitos</h1>
          <p className="text-gray-500 mt-1">Histórico de depósitos em reais</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={() => setIsPixModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            PIX
          </Button>
          <Button onClick={() => setIsBoletoModalOpen(true)} variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Boleto
          </Button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="transition-all hover:shadow-lg hover:scale-105">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Depositado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(deposits.reduce((acc, d) => acc + Number(d.amount), 0))}
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-lg hover:scale-105">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {deposits.filter(d => d.status === 'approved').length}
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-lg hover:scale-105">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {deposits.filter(d => d.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Depósitos */}
      <Card className="transition-all hover:shadow-lg">
        <CardHeader>
          <CardTitle>Histórico de Depósitos</CardTitle>
        </CardHeader>
        <CardContent>
          {deposits.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Nenhum depósito encontrado
            </div>
          ) : (
            <div className="space-y-4">
              {deposits.map((deposit) => (
                <div
                  key={deposit.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 hover:shadow-md transition-all hover:scale-[1.02]"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(deposit.status)}
                    <div>
                      <p className="font-semibold">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(Number(deposit.amount))}
                      </p>
                      <p className="text-sm text-gray-500">
                        {getMethodLabel(deposit.method)} • {new Date(deposit.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(deposit.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Novo Depósito */}
      <GerarPixModal
        open={isPixModalOpen}
        onOpenChange={setIsPixModalOpen}
      />
      
      {/* Modal de Boleto */}
      <GerarBoletoModal
        open={isBoletoModalOpen}
        onOpenChange={setIsBoletoModalOpen}
      />
    </div>
  )
}
