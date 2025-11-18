import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { FileText, Copy, Check, Download } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { boletoService } from '@/services/boletoService'
import { validateDocument, formatDocument, formatCEP, validateEmail } from '@/utils/documentValidation'

export function Faturas() {
  const { effectiveUserId } = useAuth()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'generated'>('form')
  const [copied, setCopied] = useState(false)
  
  const [formData, setFormData] = useState({
    payer_name: '', payer_email: '', payer_document: '', payer_phone: '',
    street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip_code: '',
    amount: 0, description: '', due_date: ''
  })
  
  const [boleto, setBoleto] = useState<any>(null)

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

    setLoading(true)
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

      setBoleto({
        id: result.boleto_id,
        barcode: result.barcode,
        digitable_line: result.digitable_line,
        pdf_url: result.pdf_url,
        due_date: result.due_date,
        amount: formData.amount,
        payer_name: formData.payer_name,
        payer_document: formatDocument(formData.payer_document),
        description: formData.description
      })

      setStep('generated')
      toast.success('Boleto gerado com sucesso!')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao gerar boleto')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success(`${label} copiado!`)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleNew = () => {
    setFormData({
      payer_name: '', payer_email: '', payer_document: '', payer_phone: '',
      street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip_code: '',
      amount: 0, description: '', due_date: ''
    })
    setBoleto(null)
    setStep('form')
  }

  if (step === 'generated' && boleto) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card className="p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-full mb-4">
              <Check className="text-green-500" size={32} />
            </div>
            <h1 className="text-2xl font-bold">Boleto Gerado com Sucesso!</h1>
            <p className="text-muted-foreground mt-2">Compartilhe os dados abaixo com o pagador</p>
          </div>

          <div className="space-y-6">
            {/* Informações do Boleto */}
            <div className="bg-muted/30 p-4 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Beneficiário</span>
                  <p className="font-medium">{boleto.payer_name}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">CPF/CNPJ</span>
                  <p className="font-medium">{boleto.payer_document}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Valor</span>
                  <p className="font-bold text-lg">R$ {boleto.amount.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Vencimento</span>
                  <p className="font-medium">{new Date(boleto.due_date).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-sm text-muted-foreground">Descrição</span>
                  <p className="font-medium">{boleto.description}</p>
                </div>
              </div>
            </div>

            {/* Linha Digitável */}
            <div>
              <label className="text-sm font-medium mb-2 block">Linha Digitável</label>
              <div className="relative">
                <Input value={boleto.digitable_line} readOnly className="font-mono text-xs pr-10" />
                <button
                  onClick={() => handleCopy(boleto.digitable_line, 'Linha digitável')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 hover:text-primary"
                >
                  {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            {/* Código de Barras */}
            {boleto.barcode && (
              <div>
                <label className="text-sm font-medium mb-2 block">Código de Barras</label>
                <div className="relative">
                  <Input value={boleto.barcode} readOnly className="font-mono text-xs pr-10" />
                  <button
                    onClick={() => handleCopy(boleto.barcode, 'Código de barras')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 hover:text-primary"
                  >
                    {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* Resumo Financeiro */}
            <div className="bg-primary/10 p-4 rounded-lg space-y-2">
              <h4 className="font-semibold">Resumo Financeiro</h4>
              <div className="flex justify-between text-sm">
                <span>Valor do Boleto:</span>
                <span className="font-medium">R$ {boleto.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Taxa (2.5%):</span>
                <span className="text-yellow-500">- R$ {Math.max(boleto.amount * 0.025, 2.00).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Você receberá:</span>
                <span className="text-green-500">R$ {(boleto.amount - Math.max(boleto.amount * 0.025, 2.00)).toFixed(2)}</span>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-4">
              {boleto.pdf_url && (
                <Button onClick={() => window.open(boleto.pdf_url, '_blank')} className="flex-1">
                  <Download className="mr-2" size={18} />
                  Baixar PDF
                </Button>
              )}
              <Button onClick={handleNew} variant="outline" className="flex-1">
                Gerar Novo Boleto
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="text-primary" />
          Geração de Faturas e Boletos
        </h1>
        <p className="text-muted-foreground mt-2">Gere boletos bancários com todos os dados obrigatórios</p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          {/* Dados do Pagador */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Dados do Pagador</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 block">Nome Completo <span className="text-red-500">*</span></label>
                <Input value={formData.payer_name} onChange={(e) => setFormData({...formData, payer_name: e.target.value})} placeholder="João da Silva" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">CPF/CNPJ <span className="text-red-500">*</span></label>
                <Input value={formatDocument(formData.payer_document)} onChange={(e) => setFormData({...formData, payer_document: e.target.value})} placeholder="000.000.000-00" maxLength={18} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Email <span className="text-red-500">*</span></label>
                <Input type="email" value={formData.payer_email} onChange={(e) => setFormData({...formData, payer_email: e.target.value})} placeholder="email@exemplo.com" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 block">Telefone <span className="text-red-500">*</span></label>
                <Input value={formData.payer_phone} onChange={(e) => setFormData({...formData, payer_phone: e.target.value})} placeholder="(11) 98765-4321" maxLength={15} />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">CEP <span className="text-red-500">*</span></label>
                <Input value={formatCEP(formData.zip_code)} onChange={(e) => setFormData({...formData, zip_code: e.target.value})} placeholder="00000-000" maxLength={9} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 block">Endereço <span className="text-red-500">*</span></label>
                <Input value={formData.street} onChange={(e) => setFormData({...formData, street: e.target.value})} placeholder="Rua, Avenida, etc" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Número <span className="text-red-500">*</span></label>
                <Input value={formData.number} onChange={(e) => setFormData({...formData, number: e.target.value})} placeholder="123" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Complemento</label>
                <Input value={formData.complement} onChange={(e) => setFormData({...formData, complement: e.target.value})} placeholder="Apto, Sala" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Bairro <span className="text-red-500">*</span></label>
                <Input value={formData.neighborhood} onChange={(e) => setFormData({...formData, neighborhood: e.target.value})} placeholder="Centro" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Cidade <span className="text-red-500">*</span></label>
                <Input value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} placeholder="São Paulo" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Estado (UF) <span className="text-red-500">*</span></label>
                <Input value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value.toUpperCase()})} placeholder="SP" maxLength={2} />
              </div>
            </div>
          </div>

          {/* Dados do Boleto */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Dados do Boleto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Valor (R$) <span className="text-red-500">*</span></label>
                <Input type="number" step="0.01" min="5" value={formData.amount || ''} onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} placeholder="100.00" />
                <p className="text-xs text-muted-foreground mt-1">Valor mínimo: R$ 5,00</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Data de Vencimento <span className="text-red-500">*</span></label>
                <Input type="date" value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.target.value})} min={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 block">Descrição/Finalidade <span className="text-red-500">*</span></label>
                <Input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Pagamento de serviços, produtos, etc" />
              </div>
            </div>
          </div>

          {/* Resumo */}
          {formData.amount > 0 && (
            <div className="bg-primary/10 p-4 rounded-lg space-y-2">
              <h4 className="font-semibold">Resumo</h4>
              <div className="flex justify-between text-sm">
                <span>Valor do Boleto:</span>
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

          {/* Botão */}
          <Button onClick={handleGenerate} disabled={loading} className="w-full" size="lg">
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Gerando Boleto...
              </>
            ) : (
              <>
                <FileText className="mr-2" size={18} />
                Gerar Boleto
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
}
