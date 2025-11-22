import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { FileText, Plus, Copy, Check, Download } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { boletoService } from '@/services/boletoService'

interface GerarBoletoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GerarBoletoModal({ open, onOpenChange }: GerarBoletoModalProps) {
  const { effectiveUserId } = useAuth()
  const [valor, setValor] = useState('')
  const [descricao, setDescricao] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [boletoData, setBoletoData] = useState<any>(null)
  const [showBoleto, setShowBoleto] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const quickValues = [
    { label: '+R$ 10,00', value: 10 },
    { label: '+R$ 25,00', value: 25 },
    { label: '+R$ 50,00', value: 50 },
    { label: '+R$ 100,00', value: 100 },
  ]

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    const amount = Number(numbers) / 100
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value)
    setValor(formatted)
  }

  const addQuickValue = (value: number) => {
    const currentValue = Number(valor.replace(/\./g, '').replace(',', '.')) || 0
    const newValue = currentValue + value
    setValor(newValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }))
  }

  const calculateTax = () => {
    const amount = Number(valor.replace(/\./g, '').replace(',', '.')) || 0
    // Taxa padrão: 2.5% (mín: R$ 2,00)
    const percentageFee = amount * 0.025
    return Math.max(percentageFee, 2.00)
  }

  const generateBoleto = async () => {
    if (!effectiveUserId) {
      toast.error('Usuário não autenticado')
      return
    }

    if (!valor || Number(valor.replace(/\./g, '').replace(',', '.')) < 5) {
      toast.error('Valor mínimo é R$ 5,00')
      return
    }

    setIsGenerating(true)
    try {
      const amount = Number(valor.replace(/\./g, '').replace(',', '.'))
      
      // Calcular data de vencimento (padrão 3 dias)
      let dueDateObj: Date | undefined
      if (dueDate) {
        dueDateObj = new Date(dueDate)
      } else {
        dueDateObj = new Date()
        dueDateObj.setDate(dueDateObj.getDate() + 3)
      }

      // Usar o novo serviço de boletos
      const result = await boletoService.createBoleto({
        user_id: effectiveUserId,
        amount,
        description: descricao || 'Depósito via Boleto',
        due_date: dueDateObj
      })

      if (!result.success) {
        toast.error(result.error || 'Erro ao gerar boleto')
        return
      }

      // Formatar resultado para exibição
      setBoletoData({
        charge: {
          id: result.boleto_id,
          amount: amount,
          due_date: result.due_date,
          description: descricao || 'Depósito via Boleto'
        },
        payment_codes: {
          barcode: result.barcode,
          linha_digitavel: result.digitable_line
        },
        files: {
          pdf_url: result.pdf_url
        }
      })
      
      setShowBoleto(true)
      toast.success('Boleto gerado com sucesso!')
      console.log('🧾 Boleto criado via Mercado Pago:', result.boleto_id)
    } catch (error) {
      console.error('Erro ao gerar boleto:', error)
      toast.error('Erro ao processar solicitação')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyCode = async (code: string, type: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success(`${type} copiado!`)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Erro ao copiar código')
    }
  }

  const handleDownloadPDF = () => {
    if (!boletoData?.files?.pdf_base64) {
      toast.error('PDF não disponível')
      return
    }

    try {
      const binaryString = atob(boletoData.files.pdf_base64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      
      const blob = new Blob([bytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `boleto-${boletoData.charge.id}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('PDF baixado com sucesso!')
    } catch (error) {
      toast.error('Erro ao baixar PDF')
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setTimeout(() => {
      setValor('')
      setDescricao('')
      setDueDate('')
      setBoletoData(null)
      setShowBoleto(false)
      setCopied(false)
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent onClose={handleClose} className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="text-primary" size={24} />
            {showBoleto ? 'Boleto Gerado' : 'Gerar Boleto'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!showBoleto ? (
            // Formulário de geração
            <>
              {/* Campo de Valor */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Valor <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    R$
                  </span>
                  <Input
                    type="text"
                    value={valor}
                    onChange={handleValorChange}
                    placeholder="0,00"
                    className="pl-8 bg-background border-border text-foreground"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Valor mínimo: R$ 5,00
                </p>
              </div>

              {/* Valores Rápidos */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Valores Rápidos
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {quickValues.map((item) => (
                    <Button
                      key={item.value}
                      variant="outline"
                      onClick={() => addQuickValue(item.value)}
                      className="border-border hover:border-primary"
                    >
                      <Plus size={16} className="mr-1" />
                      {item.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Campo de Descrição */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Descrição
                </label>
                <Input
                  type="text"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descrição do pagamento"
                  className="bg-background border-border text-foreground"
                />
              </div>

              {/* Campo de Vencimento */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Data de Vencimento
                </label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="bg-background border-border text-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Padrão: 3 dias a partir de hoje
                </p>
              </div>

              {/* Resumo */}
              {valor && (
                <div className="bg-muted/30 p-3 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Valor:</span>
                    <span className="text-sm text-foreground">R$ {valor}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Taxa:</span>
                    <span className="text-sm text-yellow-400">R$ {calculateTax().toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Você receberá:</span>
                    <span className="text-sm text-green-400">
                      R$ {(Number(valor.replace(/\./g, '').replace(',', '.')) - calculateTax()).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              )}

              {/* Botão Gerar */}
              <Button
                onClick={generateBoleto}
                disabled={isGenerating || !valor || Number(valor.replace(/\./g, '').replace(',', '.')) < 5}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <FileText size={18} className="mr-2" />
                    Gerar Boleto
                  </>
                )}
              </Button>
            </>
          ) : (
            // Boleto gerado
            <>
              {/* Informações do Boleto */}
              <div className="bg-muted/30 p-3 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Valor:</span>
                  <span className="text-sm text-foreground">R$ {boletoData.charge.amount.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Vencimento:</span>
                  <span className="text-sm text-foreground">{new Date(boletoData.charge.due_date).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Descrição:</span>
                  <span className="text-sm text-foreground">{boletoData.charge.description}</span>
                </div>
              </div>

              {/* Linha Digitável */}
              {boletoData.payment_codes.linha_digitavel && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Linha Digitável
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={boletoData.payment_codes.linha_digitavel}
                      readOnly
                      className="bg-background border-border text-foreground pr-10 text-xs font-mono"
                    />
                    <button
                      onClick={() => handleCopyCode(boletoData.payment_codes.linha_digitavel, 'Linha digitável')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {/* QR Code PIX (se disponível) */}
              {boletoData.files?.qr_code && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    QR Code para Pagamento via PIX
                  </label>
                  <div className="bg-white p-4 rounded-lg flex justify-center">
                    <img 
                      src={boletoData.files.qr_code.qr_code_base64} 
                      alt="QR Code PIX" 
                      className="w-48 h-48"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Pague via PIX para compensação imediata
                  </p>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="space-y-2">
                {boletoData.files?.pdf_base64 && (
                  <Button
                    onClick={handleDownloadPDF}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Download size={18} className="mr-2" />
                    Baixar PDF do Boleto
                  </Button>
                )}

                {boletoData.payment_codes.linha_digitavel && (
                  <Button
                    onClick={() => handleCopyCode(boletoData.payment_codes.linha_digitavel, 'Linha digitável')}
                    variant="outline"
                    className="w-full border-border hover:border-primary"
                  >
                    {copied ? (
                      <>
                        <Check size={18} className="mr-2 text-green-400" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy size={18} className="mr-2" />
                        Copiar Linha Digitável
                      </>
                    )}
                  </Button>
                )}

                <Button
                  onClick={() => {
                    setShowBoleto(false)
                    setValor('')
                    setDescricao('')
                    setDueDate('')
                    setBoletoData(null)
                  }}
                  className="w-full bg-muted hover:bg-muted/80 text-foreground"
                >
                  Gerar Novo Boleto
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
