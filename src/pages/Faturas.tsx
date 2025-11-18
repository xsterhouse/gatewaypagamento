import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  FileText, Plus, Copy, Check, Download, Trash2, Eye, 
  Calendar, DollarSign, User, MapPin, Clock, CheckCircle, 
  XCircle, AlertCircle, RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { boletoService } from '@/services/boletoService'
import { validateDocument, formatDocument, formatCEP, validateEmail } from '@/utils/documentValidation'
import { supabase } from '@/lib/supabase'

interface Invoice {
  id: string
  payer_name: string
  payer_email: string
  payer_document: string
  amount: number
  description: string
  due_date: string
  status: 'pending' | 'paid' | 'expired' | 'cancelled'
  barcode?: string
  digitable_line?: string
  pdf_url?: string
  created_at: string
  paid_at?: string
  fee_amount: number
  net_amount: number
}

export function Faturas() {
  const { effectiveUserId } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const [formData, setFormData] = useState({
    payer_name: '', payer_email: '', payer_document: '', payer_phone: '',
    street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip_code: '',
    amount: 0, description: '', due_date: ''
  })

  useEffect(() => {
    if (effectiveUserId) {
      loadInvoices()
    }
  }, [effectiveUserId])

  const loadInvoices = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('invoices_boletos')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setInvoices(data || [])
    } catch (error: any) {
      console.error('Erro ao carregar faturas:', error)
      toast.error('Erro ao carregar faturas')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadInvoices()
  }

  const validate = () => {
    if (!formData.payer_name || formData.payer_name.length < 3) return 'Nome completo obrigatório'
    if (!validateEmail(formData.payer_email)) return 'Email inválido'
    if (!validateDocument(formData.payer_document).valid) return 'CPF/CNPJ inválido'
    if (formData.payer_phone.replace(/\D/g, '').length < 10) return 'Telefone inválido'
    if (!formData.street || !formData.number || !formData.neighborhood || !formData.city) return 'Endereço incompleto'
    if (!formData.state || formData.state.length !== 2) return 'Estado (UF) inválido'
    if (formData.zip_code.replace(/\D/g, '').length !== 8) return 'CEP inválido'
    if (formData.amount < 5) return 'Valor mínimo R$ 5,00'
    if (!formData.description || formData.description.length < 5) return 'Descrição obrigatória'
    if (!formData.due_date) return 'Data de vencimento obrigatória'
    const dueDate = new Date(formData.due_date)
    if (dueDate < new Date()) return 'Data não pode ser no passado'
    return null
  }

  const handleGenerate = async () => {
    const error = validate()
    if (error) return toast.error(error)
    if (!effectiveUserId) return toast.error('Não autenticado')

    setGenerating(true)
    try {
      const result = await boletoService.createBoleto({
        user_id: effectiveUserId,
        amount: formData.amount,
        description: formData.description,
        payer_name: formData.payer_name,
        payer_email: formData.payer_email,
        payer_document: formData.payer_document.replace(/\D/g, ''),
        payer_address: {
          street: formData.street,
          number: formData.number,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state.toUpperCase(),
          zip_code: formData.zip_code.replace(/\D/g, '')
        },
        due_date: new Date(formData.due_date)
      })

      if (!result.success) return toast.error(result.error || 'Erro ao gerar boleto')

      // Salvar na tabela invoices_boletos
      const feeAmount = Math.max(formData.amount * 0.025, 2.00)
      const { error: dbError } = await supabase
        .from('invoices_boletos')
        .insert({
          user_id: effectiveUserId,
          payer_name: formData.payer_name,
          payer_email: formData.payer_email,
          payer_document: formData.payer_document.replace(/\D/g, ''),
          payer_phone: formData.payer_phone,
          payer_address: {
            street: formData.street,
            number: formData.number,
            complement: formData.complement,
            neighborhood: formData.neighborhood,
            city: formData.city,
            state: formData.state.toUpperCase(),
            zip_code: formData.zip_code.replace(/\D/g, '')
          },
          amount: formData.amount,
          description: formData.description,
          due_date: formData.due_date,
          fee_amount: feeAmount,
          net_amount: formData.amount - feeAmount,
          status: 'pending',
          mercadopago_payment_id: result.boleto_id,
          barcode: result.barcode,
          digitable_line: result.digitable_line,
          pdf_url: result.pdf_url,
          expires_at: result.due_date
        })

      if (dbError) throw dbError

      toast.success('Boleto gerado com sucesso!')
      setShowModal(false)
      resetForm()
      loadInvoices()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao gerar boleto')
    } finally {
      setGenerating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta fatura?')) return

    try {
      const { error } = await supabase
        .from('invoices_boletos')
        .delete()
        .eq('id', id)
        .eq('user_id', effectiveUserId)

      if (error) throw error
      toast.success('Fatura excluída')
      loadInvoices()
    } catch (error: any) {
      toast.error('Erro ao excluir fatura')
    }
  }

  const handleCopy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success(`${label} copiado!`)
    setTimeout(() => setCopied(false), 2000)
  }

  const resetForm = () => {
    setFormData({
      payer_name: '', payer_email: '', payer_document: '', payer_phone: '',
      street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip_code: '',
      amount: 0, description: '', due_date: ''
    })
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { icon: Clock, label: 'Pendente', class: 'bg-yellow-500/10 text-yellow-500' },
      paid: { icon: CheckCircle, label: 'Pago', class: 'bg-green-500/10 text-green-500' },
      expired: { icon: XCircle, label: 'Vencido', class: 'bg-red-500/10 text-red-500' },
      cancelled: { icon: AlertCircle, label: 'Cancelado', class: 'bg-gray-500/10 text-gray-500' }
    }
    const badge = badges[status as keyof typeof badges] || badges.pending
    const Icon = badge.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.class}`}>
        <Icon size={14} />
        {badge.label}
      </span>
    )
  }

  const stats = {
    total: invoices.length,
    pending: invoices.filter(i => i.status === 'pending').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    totalAmount: invoices.reduce((sum, i) => sum + i.amount, 0),
    paidAmount: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0)
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="text-primary" />
            Minhas Faturas
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie seus boletos e faturas</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" disabled={refreshing}>
            <RefreshCw className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} size={18} />
            Atualizar
          </Button>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="mr-2" size={18} />
            Novo Boleto
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Pendentes</div>
          <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Pagos</div>
          <div className="text-2xl font-bold text-green-500">{stats.paid}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Valor Total</div>
          <div className="text-xl font-bold">R$ {stats.totalAmount.toFixed(2)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Recebido</div>
          <div className="text-xl font-bold text-green-500">R$ {stats.paidAmount.toFixed(2)}</div>
        </Card>
      </div>

      {/* Lista de Faturas */}
      <Card className="p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando faturas...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto text-muted-foreground mb-4" size={48} />
            <h3 className="text-lg font-semibold mb-2">Nenhuma fatura encontrada</h3>
            <p className="text-muted-foreground mb-4">Crie seu primeiro boleto para começar</p>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="mr-2" size={18} />
              Criar Primeiro Boleto
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{invoice.payer_name}</h3>
                        <p className="text-sm text-muted-foreground">{invoice.description}</p>
                      </div>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mt-3">
                      <div>
                        <span className="text-muted-foreground">Valor:</span>
                        <p className="font-semibold">R$ {invoice.amount.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Vencimento:</span>
                        <p className="font-semibold">{new Date(invoice.due_date).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Criado em:</span>
                        <p className="font-semibold">{new Date(invoice.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Você recebe:</span>
                        <p className="font-semibold text-green-500">R$ {invoice.net_amount.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex md:flex-col gap-2">
                    <Button
                      onClick={() => {
                        setSelectedInvoice(invoice)
                        setShowDetailsModal(true)
                      }}
                      variant="outline"
                      size="sm"
                      className="flex-1 md:flex-none"
                    >
                      <Eye size={16} className="mr-1" />
                      Ver
                    </Button>
                    {invoice.status === 'pending' && (
                      <Button
                        onClick={() => handleDelete(invoice.id)}
                        variant="outline"
                        size="sm"
                        className="flex-1 md:flex-none text-red-500 hover:text-red-600"
                      >
                        <Trash2 size={16} className="mr-1" />
                        Excluir
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal Novo Boleto */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="text-primary" />
              Novo Boleto
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            {/* Dados do Pagador */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <User size={20} className="text-primary" />
                Dados do Pagador
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-2 block">Nome Completo *</label>
                  <Input value={formData.payer_name} onChange={(e) => setFormData({...formData, payer_name: e.target.value})} placeholder="João da Silva" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">CPF/CNPJ *</label>
                  <Input value={formatDocument(formData.payer_document)} onChange={(e) => setFormData({...formData, payer_document: e.target.value})} placeholder="000.000.000-00" maxLength={18} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Email *</label>
                  <Input type="email" value={formData.payer_email} onChange={(e) => setFormData({...formData, payer_email: e.target.value})} placeholder="email@exemplo.com" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-2 block">Telefone *</label>
                  <Input value={formData.payer_phone} onChange={(e) => setFormData({...formData, payer_phone: e.target.value})} placeholder="(11) 98765-4321" maxLength={15} />
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <MapPin size={20} className="text-primary" />
                Endereço
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">CEP *</label>
                  <Input value={formatCEP(formData.zip_code)} onChange={(e) => setFormData({...formData, zip_code: e.target.value})} placeholder="00000-000" maxLength={9} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-2 block">Endereço *</label>
                  <Input value={formData.street} onChange={(e) => setFormData({...formData, street: e.target.value})} placeholder="Rua, Avenida" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Número *</label>
                  <Input value={formData.number} onChange={(e) => setFormData({...formData, number: e.target.value})} placeholder="123" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Complemento</label>
                  <Input value={formData.complement} onChange={(e) => setFormData({...formData, complement: e.target.value})} placeholder="Apto" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Bairro *</label>
                  <Input value={formData.neighborhood} onChange={(e) => setFormData({...formData, neighborhood: e.target.value})} placeholder="Centro" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Cidade *</label>
                  <Input value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} placeholder="São Paulo" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Estado (UF) *</label>
                  <Input value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value.toUpperCase()})} placeholder="SP" maxLength={2} />
                </div>
              </div>
            </div>

            {/* Dados do Boleto */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <DollarSign size={20} className="text-primary" />
                Dados do Boleto
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Valor (R$) *</label>
                  <Input type="number" step="0.01" min="5" value={formData.amount || ''} onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} placeholder="100.00" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Vencimento *</label>
                  <Input type="date" value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.target.value})} min={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-2 block">Descrição *</label>
                  <Input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Descrição do boleto" />
                </div>
              </div>
            </div>

            {/* Resumo */}
            {formData.amount > 0 && (
              <div className="bg-primary/10 p-4 rounded-lg space-y-2">
                <h4 className="font-semibold">Resumo</h4>
                <div className="flex justify-between text-sm">
                  <span>Valor:</span>
                  <span className="font-medium">R$ {formData.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Taxa (2.5%):</span>
                  <span className="text-yellow-500">R$ {Math.max(formData.amount * 0.025, 2.00).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Você receberá:</span>
                  <span className="text-green-500">R$ {(formData.amount - Math.max(formData.amount * 0.025, 2.00)).toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-4">
              <Button onClick={() => setShowModal(false)} variant="outline" className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleGenerate} disabled={generating} className="flex-1">
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2" size={18} />
                    Gerar Boleto
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Detalhes */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="text-primary" />
              Detalhes do Boleto
            </DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{selectedInvoice.payer_name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedInvoice.description}</p>
                </div>
                {getStatusBadge(selectedInvoice.status)}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Valor:</span>
                  <p className="font-semibold text-lg">R$ {selectedInvoice.amount.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Vencimento:</span>
                  <p className="font-semibold">{new Date(selectedInvoice.due_date).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Taxa:</span>
                  <p className="font-semibold text-yellow-500">R$ {selectedInvoice.fee_amount.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Você recebe:</span>
                  <p className="font-semibold text-green-500">R$ {selectedInvoice.net_amount.toFixed(2)}</p>
                </div>
              </div>

              {selectedInvoice.digitable_line && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Linha Digitável</label>
                  <div className="relative">
                    <Input value={selectedInvoice.digitable_line} readOnly className="font-mono text-xs pr-10" />
                    <button
                      onClick={() => handleCopy(selectedInvoice.digitable_line!, 'Linha digitável')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 hover:text-primary"
                    >
                      {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {selectedInvoice.barcode && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Código de Barras</label>
                  <div className="relative">
                    <Input value={selectedInvoice.barcode} readOnly className="font-mono text-xs pr-10" />
                    <button
                      onClick={() => handleCopy(selectedInvoice.barcode!, 'Código de barras')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 hover:text-primary"
                    >
                      {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                {selectedInvoice.pdf_url && (
                  <Button onClick={() => window.open(selectedInvoice.pdf_url, '_blank')} className="flex-1">
                    <Download className="mr-2" size={18} />
                    Baixar PDF
                  </Button>
                )}
                <Button onClick={() => setShowDetailsModal(false)} variant="outline" className="flex-1">
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
