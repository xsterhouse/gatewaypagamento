import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { SelectNative } from '@/components/ui/select-native'
import { toast } from 'sonner'
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Star,
  CheckCircle,
  XCircle,
  TrendingUp
} from 'lucide-react'
import { bankAcquirerService, BankAcquirer } from '@/services/bankAcquirerService'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function BankAcquirers() {
  const [acquirers, setAcquirers] = useState<BankAcquirer[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedAcquirer, setSelectedAcquirer] = useState<BankAcquirer | null>(null)
  const [statistics, setStatistics] = useState<{ [key: string]: any }>({})
  const [activeTab, setActiveTab] = useState('basic')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    bank_code: '',
    client_id: '',
    client_secret: '',
    pix_key: '',
    pix_key_type: 'cnpj' as 'cpf' | 'cnpj' | 'email' | 'phone' | 'random',
    account_number: '',
    account_digit: '',
    agency: '',
    agency_digit: '',
    api_base_url: '',
    api_auth_url: '',
    api_pix_url: '',
    environment: 'production' as 'sandbox' | 'production',
    daily_limit: '',
    transaction_limit: '',
    fee_percentage: '',
    fee_fixed: '',
    description: '',
    logo_url: '',
    // Webhook fields
    webhook_url: '',
    webhook_secret: '',
    webhook_events: [] as string[],
    webhook_enabled: false
  })

  useEffect(() => {
    loadAcquirers()
  }, [])

  const loadAcquirers = async () => {
    try {
      console.log('🏦 Carregando adquirentes...')
      setLoading(true)
      const data = await bankAcquirerService.getAllAcquirers()
      console.log('📊 Adquirentes carregados:', data)
      setAcquirers(data)
      
      // Carregar estatísticas para cada adquirente
      const stats: { [key: string]: any } = {}
      for (const acquirer of data) {
        const stat = await bankAcquirerService.getAcquirerStatistics(acquirer.id)
        if (stat) stats[acquirer.id] = stat
      }
      setStatistics(stats)
      console.log('✅ Adquirentes carregados com sucesso!')
    } catch (error: any) {
      console.error('❌ Erro ao carregar adquirentes:', error)
      
      // Verificar se é erro de tabela não existente
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        toast.error('⚠️ Tabela bank_acquirers não encontrada! Execute a migration SQL primeiro.')
      } else {
        toast.error('Erro ao carregar adquirentes: ' + error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (acquirer?: BankAcquirer) => {
    if (acquirer) {
      setEditMode(true)
      setSelectedAcquirer(acquirer)
      setFormData({
        name: acquirer.name,
        bank_code: acquirer.bank_code,
        client_id: acquirer.client_id || '',
        client_secret: acquirer.client_secret || '',
        pix_key: acquirer.pix_key || '',
        pix_key_type: acquirer.pix_key_type || 'cnpj',
        account_number: acquirer.account_number || '',
        account_digit: acquirer.account_digit || '',
        agency: acquirer.agency || '',
        agency_digit: acquirer.agency_digit || '',
        api_base_url: acquirer.api_base_url || '',
        api_auth_url: acquirer.api_auth_url || '',
        api_pix_url: acquirer.api_pix_url || '',
        environment: acquirer.environment,
        daily_limit: acquirer.daily_limit?.toString() || '',
        transaction_limit: acquirer.transaction_limit?.toString() || '',
        fee_percentage: acquirer.fee_percentage?.toString() || '',
        fee_fixed: acquirer.fee_fixed?.toString() || '',
        description: acquirer.description || '',
        logo_url: acquirer.logo_url || '',
        // Webhook fields
        webhook_url: acquirer.webhook_url || '',
        webhook_secret: acquirer.webhook_secret || '',
        webhook_events: acquirer.webhook_events || [],
        webhook_enabled: acquirer.webhook_enabled || false
      })
    } else {
      setEditMode(false)
      setSelectedAcquirer(null)
      setFormData({
        name: '',
        bank_code: '',
        client_id: '',
        client_secret: '',
        pix_key: '',
        pix_key_type: 'cnpj',
        account_number: '',
        account_digit: '',
        agency: '',
        agency_digit: '',
        api_base_url: '',
        api_auth_url: '',
        api_pix_url: '',
        environment: 'production',
        daily_limit: '',
        transaction_limit: '',
        fee_percentage: '',
        fee_fixed: '',
        description: '',
        logo_url: '',
        // Webhook fields
        webhook_url: '',
        webhook_secret: '',
        webhook_events: [],
        webhook_enabled: false
      })
    }
    setActiveTab('basic') // Resetar para primeira aba
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('🔄 Salvando adquirente...', editMode ? 'Edição' : 'Novo')

    try {
      const acquirerData: Partial<BankAcquirer> = {
        name: formData.name,
        bank_code: formData.bank_code,
        client_id: formData.client_id || undefined,
        client_secret: formData.client_secret || undefined,
        pix_key: formData.pix_key || undefined,
        pix_key_type: formData.pix_key_type,
        account_number: formData.account_number || undefined,
        account_digit: formData.account_digit || undefined,
        agency: formData.agency || undefined,
        agency_digit: formData.agency_digit || undefined,
        api_base_url: formData.api_base_url || undefined,
        api_auth_url: formData.api_auth_url || undefined,
        api_pix_url: formData.api_pix_url || undefined,
        environment: formData.environment,
        daily_limit: formData.daily_limit ? parseFloat(formData.daily_limit) : undefined,
        transaction_limit: formData.transaction_limit ? parseFloat(formData.transaction_limit) : undefined,
        fee_percentage: formData.fee_percentage ? parseFloat(formData.fee_percentage) : undefined,
        fee_fixed: formData.fee_fixed ? parseFloat(formData.fee_fixed) : undefined,
        description: formData.description || undefined,
        logo_url: formData.logo_url || undefined,
        // Webhook fields
        webhook_url: formData.webhook_url || undefined,
        webhook_secret: formData.webhook_secret || undefined,
        webhook_events: formData.webhook_events || undefined,
        webhook_enabled: formData.webhook_enabled,
        is_active: true,
        status: 'active'
      }

      if (editMode && selectedAcquirer) {
        await bankAcquirerService.updateAcquirer(selectedAcquirer.id, acquirerData)
        toast.success('Adquirente atualizado com sucesso!')
      } else {
        await bankAcquirerService.createAcquirer(acquirerData)
        toast.success('Adquirente criado com sucesso!')
      }

      setModalOpen(false)
      loadAcquirers()
    } catch (error: any) {
      toast.error('Erro ao salvar adquirente: ' + error.message)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await bankAcquirerService.setDefaultAcquirer(id)
      toast.success('Adquirente padrão definido!')
      loadAcquirers()
    } catch (error: any) {
      toast.error('Erro ao definir adquirente padrão: ' + error.message)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus
      await bankAcquirerService.updateAcquirer(id, { 
        is_active: newStatus,
        status: newStatus ? 'active' : 'inactive'
      })
      toast.success(`Adquirente ${newStatus ? 'ativado' : 'desativado'} com sucesso!`)
      loadAcquirers()
    } catch (error: any) {
      toast.error('Erro ao alterar status: ' + error.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este adquirente?')) return

    try {
      await bankAcquirerService.deleteAcquirer(id)
      toast.success('Adquirente excluído com sucesso!')
      loadAcquirers()
    } catch (error: any) {
      toast.error('Erro ao excluir adquirente: ' + error.message)
    }
  }

  const formatCurrency = (value?: number) => {
    if (!value) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            🏦 Gateway PIX - Adquirentes
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure e gerencie adquirentes bancários, webhooks e integrações PIX
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Adquirente
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold">{acquirers.length}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ativos</p>
                <p className="text-2xl font-bold">
                  {acquirers.filter(a => a.is_active && a.status === 'active').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Padrão</p>
                <p className="text-2xl font-bold">
                  {acquirers.find(a => a.is_default)?.name.substring(0, 10) || 'N/A'}
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Volume Total</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    Object.values(statistics).reduce((sum: number, stat: any) => 
                      sum + (stat?.total_volume || 0), 0
                    )
                  )}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        {/* Webhooks Ativos */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">🪝 Webhooks Ativos</p>
                <p className="text-2xl font-bold text-green-600">
                  {acquirers.filter(a => a.webhook_enabled).length}
                </p>
                <p className="text-xs text-gray-500">
                  {acquirers.length > 0 ? 
                    `${((acquirers.filter(a => a.webhook_enabled).length / acquirers.length) * 100).toFixed(0)}% do total` 
                    : '0% do total'
                  }
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Adquirentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {acquirers.length === 0 && !loading && (
          <div className="col-span-full">
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-2 border-dashed">
              <CardContent className="pt-12 pb-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <Building2 className="w-10 h-10 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Nenhum Adquirente Cadastrado
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                      Comece criando seu primeiro adquirente bancário para processar transações PIX via Gateway.
                    </p>
                    <Button onClick={() => handleOpenModal()} size="lg" className="gap-2">
                      <Plus className="w-5 h-5" />
                      Criar Primeiro Adquirente
                    </Button>
                  </div>
                  <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg max-w-2xl">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>⚠️ Importante:</strong> Se você está vendo esta mensagem e a tabela não existe no banco de dados, 
                      execute a migration SQL localizada em <code className="bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">supabase_migrations/create_bank_acquirers_table.sql</code>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {acquirers.map((acquirer) => {
          const stat = statistics[acquirer.id]
          
          return (
            <Card key={acquirer.id} className={acquirer.is_default ? 'border-2 border-yellow-500' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {acquirer.logo_url ? (
                      <img src={acquirer.logo_url} alt={acquirer.name} className="w-12 h-12 rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-blue-600" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {acquirer.name}
                        {acquirer.is_default && (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </CardTitle>
                      <CardDescription>
                        Código: {acquirer.bank_code} • {acquirer.environment}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {acquirer.is_active && acquirer.status === 'active' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Estatísticas */}
                {stat && (
                  <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Transações</p>
                      <p className="text-lg font-bold">{stat.total_transactions || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Volume</p>
                      <p className="text-lg font-bold">{formatCurrency(stat.total_volume)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Taxas</p>
                      <p className="text-lg font-bold">{formatCurrency(stat.total_fees)}</p>
                    </div>
                  </div>
                )}

                {/* Informações */}
                <div className="space-y-2 text-sm">
                  {acquirer.pix_key && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Chave PIX:</span>
                      <span className="font-medium">{acquirer.pix_key}</span>
                    </div>
                  )}
                  
                  {/* Status do Webhook */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Webhook:</span>
                    <div className="flex items-center gap-1">
                      {acquirer.webhook_enabled ? (
                        <>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="font-medium text-green-600">Ativo</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <span className="font-medium text-gray-500">Inativo</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {acquirer.transaction_limit && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Limite/Transação:</span>
                      <span className="font-medium">{formatCurrency(acquirer.transaction_limit)}</span>
                    </div>
                  )}
                  
                  {acquirer.fee_percentage && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Taxa:</span>
                      <span className="font-medium">{(acquirer.fee_percentage * 100).toFixed(2)}%</span>
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="flex gap-2 pt-4 border-t">
                  {/* Botão Ligar/Desligar */}
                  <Button
                    variant={acquirer.is_active ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleStatus(acquirer.id, acquirer.is_active)}
                    className={`flex-1 gap-2 ${
                      acquirer.is_active 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    {acquirer.is_active ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Ativo
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        Inativo
                      </>
                    )}
                  </Button>
                  
                  {!acquirer.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(acquirer.id)}
                      className="gap-2"
                    >
                      <Star className="w-4 h-4" />
                      Padrão
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenModal(acquirer)}
                    className="gap-2"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(acquirer.id)}
                    className="gap-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Modal de Criar/Editar */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editMode ? 'Editar Adquirente' : 'Novo Adquirente'}
            </DialogTitle>
            <DialogDescription>
              Configure os dados do adquirente bancário para processamento de PIX
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic">Básico</TabsTrigger>
                <TabsTrigger value="bank">Dados Bancários</TabsTrigger>
                <TabsTrigger value="api">API</TabsTrigger>
                <TabsTrigger value="webhooks">🪝 Webhooks</TabsTrigger>
                <TabsTrigger value="fees">Taxas</TabsTrigger>
              </TabsList>

              {/* Aba Básico */}
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome do Banco *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Banco Inter"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="bank_code">Código do Banco *</Label>
                    <Input
                      id="bank_code"
                      value={formData.bank_code}
                      onChange={(e) => setFormData({ ...formData, bank_code: e.target.value })}
                      placeholder="Ex: 077"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição do adquirente"
                  />
                </div>

                <div>
                  <Label htmlFor="logo_url">URL do Logo</Label>
                  <Input
                    id="logo_url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    placeholder="https://exemplo.com/logo.png"
                  />
                </div>

                <div>
                  <Label htmlFor="environment">Ambiente</Label>
                  <SelectNative
                    id="environment"
                    value={formData.environment}
                    onChange={(e) => setFormData({ ...formData, environment: e.target.value as any })}
                  >
                    <option value="sandbox">Sandbox (Testes)</option>
                    <option value="production">Produção</option>
                  </SelectNative>
                </div>
              </TabsContent>

              {/* Aba Dados Bancários */}
              <TabsContent value="bank" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pix_key">Chave PIX</Label>
                    <Input
                      id="pix_key"
                      value={formData.pix_key}
                      onChange={(e) => setFormData({ ...formData, pix_key: e.target.value })}
                      placeholder="Chave PIX do adquirente"
                    />
                  </div>

                  <div>
                    <Label htmlFor="pix_key_type">Tipo de Chave</Label>
                    <SelectNative
                      id="pix_key_type"
                      value={formData.pix_key_type}
                      onChange={(e) => setFormData({ ...formData, pix_key_type: e.target.value as any })}
                    >
                      <option value="cpf">CPF</option>
                      <option value="cnpj">CNPJ</option>
                      <option value="email">E-mail</option>
                      <option value="phone">Telefone</option>
                      <option value="random">Aleatória</option>
                    </SelectNative>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="agency">Agência</Label>
                    <Input
                      id="agency"
                      value={formData.agency}
                      onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                      placeholder="0001"
                    />
                  </div>

                  <div>
                    <Label htmlFor="agency_digit">Dígito</Label>
                    <Input
                      id="agency_digit"
                      value={formData.agency_digit}
                      onChange={(e) => setFormData({ ...formData, agency_digit: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="account_number">Conta</Label>
                    <Input
                      id="account_number"
                      value={formData.account_number}
                      onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                      placeholder="123456"
                    />
                  </div>

                  <div>
                    <Label htmlFor="account_digit">Dígito</Label>
                    <Input
                      id="account_digit"
                      value={formData.account_digit}
                      onChange={(e) => setFormData({ ...formData, account_digit: e.target.value })}
                      placeholder="7"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Aba API */}
              <TabsContent value="api" className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>💡 Dica:</strong> Obtenha as credenciais da API no portal de desenvolvedores do banco.
                    Para o Banco Inter: <a href="https://developers.bancointer.com.br/" target="_blank" rel="noopener noreferrer" className="underline">developers.bancointer.com.br</a>
                  </p>
                </div>

                <div>
                  <Label htmlFor="client_id">Client ID</Label>
                  <Input
                    id="client_id"
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    placeholder="Client ID da API"
                  />
                </div>

                <div>
                  <Label htmlFor="client_secret">Client Secret</Label>
                  <Input
                    id="client_secret"
                    type="password"
                    value={formData.client_secret}
                    onChange={(e) => setFormData({ ...formData, client_secret: e.target.value })}
                    placeholder="Client Secret da API"
                  />
                </div>

                <div>
                  <Label htmlFor="api_base_url">URL Base da API</Label>
                  <Input
                    id="api_base_url"
                    value={formData.api_base_url}
                    onChange={(e) => setFormData({ ...formData, api_base_url: e.target.value })}
                    placeholder="https://api.banco.com.br"
                  />
                </div>

                <div>
                  <Label htmlFor="api_auth_url">URL de Autenticação</Label>
                  <Input
                    id="api_auth_url"
                    value={formData.api_auth_url}
                    onChange={(e) => setFormData({ ...formData, api_auth_url: e.target.value })}
                    placeholder="https://api.banco.com.br/oauth/token"
                  />
                </div>

                <div>
                  <Label htmlFor="api_pix_url">URL PIX</Label>
                  <Input
                    id="api_pix_url"
                    value={formData.api_pix_url}
                    onChange={(e) => setFormData({ ...formData, api_pix_url: e.target.value })}
                    placeholder="https://api.banco.com.br/pix"
                  />
                </div>
              </TabsContent>

              {/* Aba Webhooks */}
              <TabsContent value="webhooks" className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    <strong>🪝 Webhooks:</strong> Configure os webhooks para receber notificações em tempo real das transações PIX.
                    URL do seu sistema: <code className="bg-green-100 px-2 py-1 rounded">https://seusistema.com/api/webhooks/{formData.name.toLowerCase().replace(/\s+/g, '-')}</code>
                  </p>
                </div>

                {/* Habilitar/Desabilitar Webhooks */}
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <input
                    type="checkbox"
                    id="webhook_enabled"
                    checked={formData.webhook_enabled}
                    onChange={(e) => setFormData({ ...formData, webhook_enabled: e.target.checked })}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <Label htmlFor="webhook_enabled" className="text-sm font-medium">
                    Habilitar Webhooks para este adquirente
                  </Label>
                </div>

                {formData.webhook_enabled && (
                  <>
                    <div>
                      <Label htmlFor="webhook_url">URL do Webhook *</Label>
                      <Input
                        id="webhook_url"
                        value={formData.webhook_url}
                        onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                        placeholder="https://seusistema.com/api/webhooks/mercadopago"
                        required={formData.webhook_enabled}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        URL onde o adquirente enviará as notificações das transações
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="webhook_secret">Segredo do Webhook (Webhook Secret)</Label>
                      <Input
                        id="webhook_secret"
                        type="password"
                        value={formData.webhook_secret}
                        onChange={(e) => setFormData({ ...formData, webhook_secret: e.target.value })}
                        placeholder="whsec_1234567890abcdef"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Chave secreta para verificar a autenticidade dos webhooks recebidos
                      </p>
                    </div>

                    <div>
                      <Label>Eventos de Webhook</Label>
                      <div className="mt-2 space-y-2">
                        {[
                          { id: 'pix.created', label: 'PIX Criado', description: 'Quando um PIX é iniciado' },
                          { id: 'pix.completed', label: 'PIX Completado', description: 'Quando um PIX é aprovado' },
                          { id: 'pix.failed', label: 'PIX Falhou', description: 'Quando um PIX é rejeitado' },
                          { id: 'pix.reversed', label: 'PIX Estornado', description: 'Quando um PIX é estornado' }
                        ].map((event) => (
                          <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                            <input
                              type="checkbox"
                              id={event.id}
                              checked={formData.webhook_events.includes(event.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({ 
                                    ...formData, 
                                    webhook_events: [...formData.webhook_events, event.id] 
                                  })
                                } else {
                                  setFormData({ 
                                    ...formData, 
                                    webhook_events: formData.webhook_events.filter(e => e !== event.id) 
                                  })
                                }
                              }}
                              className="w-4 h-4 text-green-600 rounded focus:ring-green-500 mt-1"
                            />
                            <div className="flex-1">
                              <Label htmlFor={event.id} className="text-sm font-medium">
                                {event.label}
                              </Label>
                              <p className="text-xs text-gray-500">{event.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Botão de Teste */}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          toast.info('Enviando webhook de teste...')
                          // Simular envio de webhook de teste
                          setTimeout(() => {
                            toast.success('Webhook de teste enviado com sucesso!')
                          }, 2000)
                        }}
                        className="gap-2"
                      >
                        🧪 Testar Webhook
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(formData.webhook_url || '')
                          toast.success('URL do webhook copiada!')
                        }}
                        className="gap-2"
                      >
                        📋 Copiar URL
                      </Button>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Aba Taxas */}
              <TabsContent value="fees" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="transaction_limit">Limite por Transação (R$)</Label>
                    <Input
                      id="transaction_limit"
                      type="number"
                      step="0.01"
                      value={formData.transaction_limit}
                      onChange={(e) => setFormData({ ...formData, transaction_limit: e.target.value })}
                      placeholder="5000.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="daily_limit">Limite Diário (R$)</Label>
                    <Input
                      id="daily_limit"
                      type="number"
                      step="0.01"
                      value={formData.daily_limit}
                      onChange={(e) => setFormData({ ...formData, daily_limit: e.target.value })}
                      placeholder="50000.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fee_percentage">Taxa Percentual (%)</Label>
                    <Input
                      id="fee_percentage"
                      type="number"
                      step="0.0001"
                      value={formData.fee_percentage}
                      onChange={(e) => setFormData({ ...formData, fee_percentage: e.target.value })}
                      placeholder="0.035 (3.5%)"
                    />
                  </div>

                  <div>
                    <Label htmlFor="fee_fixed">Taxa Fixa (R$)</Label>
                    <Input
                      id="fee_fixed"
                      type="number"
                      step="0.01"
                      value={formData.fee_fixed}
                      onChange={(e) => setFormData({ ...formData, fee_fixed: e.target.value })}
                      placeholder="0.60"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="flex gap-2">
                {activeTab !== 'basic' && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      const tabs = ['basic', 'bank', 'api', 'webhooks', 'fees']
                      const currentIndex = tabs.indexOf(activeTab)
                      if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1])
                    }}
                  >
                    ← Anterior
                  </Button>
                )}
                {activeTab !== 'fees' && (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      const tabs = ['basic', 'bank', 'api', 'webhooks', 'fees']
                      const currentIndex = tabs.indexOf(activeTab)
                      if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1])
                    }}
                  >
                    Próximo →
                  </Button>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editMode ? 'Atualizar' : 'Criar'} Adquirente
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
