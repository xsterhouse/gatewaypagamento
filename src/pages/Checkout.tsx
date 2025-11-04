// ============================================
// NOVO CÓDIGO COMPLETO PARA Checkout.tsx
// ============================================
// Substitua TODO o conteúdo do arquivo src/pages/Checkout.tsx por este código

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingCart, 
  Plus, 
  Copy, 
  DollarSign,
  Eye,
  Edit,
  Trash2,
  Link as LinkIcon,
  BarChart3,
  Check,
  Power,
  PowerOff
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { checkoutService, PaymentLink } from '@/services/checkoutService'
import { CreatePaymentLinkModal } from '@/components/CreatePaymentLinkModal'

export function Checkout() {
  const { effectiveUserId } = useAuth()
  const [links, setLinks] = useState<PaymentLink[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedLink, setSelectedLink] = useState<PaymentLink | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [statistics, setStatistics] = useState<{
    total_links: number
    active_links: number
    total_revenue: number
    total_transactions: number
  }>({
    total_links: 0,
    active_links: 0,
    total_revenue: 0,
    total_transactions: 0
  })

  useEffect(() => {
    if (effectiveUserId) {
      loadLinks()
    }
  }, [effectiveUserId])

  const loadLinks = async () => {
    if (!effectiveUserId) return
    
    try {
      setLoading(true)
      const data = await checkoutService.getUserPaymentLinks(effectiveUserId)
      setLinks(data)
      
      // Calcular estatísticas
      const stats = {
        total_links: data.length,
        active_links: data.filter(l => l.is_active).length,
        total_revenue: data.reduce((sum, l) => sum + (l.total_amount || 0), 0),
        total_transactions: data.reduce((sum, l) => sum + (l.total_transactions || 0), 0)
      }
      setStatistics(stats)
    } catch (error: any) {
      toast.error('Erro ao carregar links: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = (link: PaymentLink) => {
    const url = `${window.location.origin}/pay/${link.slug}`
    navigator.clipboard.writeText(url)
    setCopiedId(link.id)
    toast.success('Link copiado!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleToggleActive = async (link: PaymentLink) => {
    try {
      await checkoutService.togglePaymentLink(link.id, !link.is_active)
      toast.success(link.is_active ? 'Link desativado' : 'Link ativado')
      loadLinks()
    } catch (error: any) {
      toast.error('Erro ao alterar status: ' + error.message)
    }
  }

  const handleDelete = async (link: PaymentLink) => {
    if (!confirm(`Tem certeza que deseja excluir "${link.title}"?`)) return
    
    try {
      await checkoutService.deletePaymentLink(link.id)
      toast.success('Link excluído com sucesso!')
      loadLinks()
    } catch (error: any) {
      toast.error('Erro ao excluir link: ' + error.message)
    }
  }

  const handleOpenModal = (link?: PaymentLink) => {
    setSelectedLink(link || null)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedLink(null)
    loadLinks()
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (date: string) => {
    // Adicionar 'Z' se não tiver timezone para forçar UTC
    const dateStr = date.includes('T') ? date : date + 'T00:00:00Z'
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Checkout & Links de Pagamento
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Crie links personalizados para receber pagamentos em sua loja virtual
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2">
          <Plus className="w-4 h-4" />
          Criar Link
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total de Links</p>
                <p className="text-2xl font-bold">{statistics.total_links}</p>
              </div>
              <LinkIcon className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Links Ativos</p>
                <p className="text-2xl font-bold">{statistics.active_links}</p>
              </div>
              <Power className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Receita Total</p>
                <p className="text-2xl font-bold">{formatCurrency(statistics.total_revenue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Transações</p>
                <p className="text-2xl font-bold">{statistics.total_transactions}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Links */}
      {links.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Nenhum link criado ainda
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Crie seu primeiro link de pagamento para começar a receber
              </p>
              <Button onClick={() => handleOpenModal()} className="gap-2">
                <Plus className="w-4 h-4" />
                Criar Primeiro Link
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {links.map((link) => (
            <Card key={link.id} className={!link.is_active ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{link.title}</CardTitle>
                      {link.is_active ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </div>
                    {link.description && (
                      <CardDescription className="line-clamp-2">
                        {link.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Informações de Preço */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {link.price_type === 'fixed' ? 'Preço Fixo' : 'Preço Variável'}
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {link.price_type === 'fixed' 
                        ? formatCurrency(link.amount || 0)
                        : `${formatCurrency(link.min_amount || 0)} - ${formatCurrency(link.max_amount || 0)}`
                      }
                    </p>
                  </div>
                  {link.allow_quantity && (
                    <Badge variant="outline">
                      Qtd: até {link.max_quantity}
                    </Badge>
                  )}
                </div>

                {/* Estatísticas */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Vendas</p>
                    <p className="text-lg font-bold">{link.total_transactions || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Receita</p>
                    <p className="text-lg font-bold">{formatCurrency(link.total_amount || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Usos</p>
                    <p className="text-lg font-bold">
                      {link.current_uses}/{link.max_uses || '∞'}
                    </p>
                  </div>
                </div>

                {/* Link */}
                <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                  <code className="flex-1 text-xs text-gray-700 dark:text-gray-300 truncate">
                    {window.location.origin}/pay/{link.slug}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopyLink(link)}
                    className="shrink-0"
                  >
                    {copiedId === link.id ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Ações */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`/pay/${link.slug}`, '_blank')}
                    className="flex-1 gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Visualizar
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleActive(link)}
                    className="gap-2"
                  >
                    {link.is_active ? (
                      <PowerOff className="w-4 h-4" />
                    ) : (
                      <Power className="w-4 h-4" />
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenModal(link)}
                    className="gap-2"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(link)}
                    className="gap-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Info adicional */}
                <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t">
                  Criado em {formatDate(link.created_at)}
                  {link.expires_at && ` • Expira em ${formatDate(link.expires_at)}`}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <CreatePaymentLinkModal
        open={modalOpen}
        onClose={handleCloseModal}
        link={selectedLink}
      />
    </div>
  )
}
