import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  QrCode, 
  FileText,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'

interface Invoice {
  id: string
  invoice_number?: string
  amount: number
  due_date: string
  paid_date?: string | null
  status: string
  description?: string
  created_at: string
}

interface InvoiceDetailsModalProps {
  isOpen: boolean
  invoice: Invoice | null
  onClose: () => void
  onPaymentInitiated?: () => void
}

export function InvoiceDetailsModal({ 
  isOpen, 
  invoice, 
  onClose,
  onPaymentInitiated 
}: InvoiceDetailsModalProps) {
  if (!invoice) return null

  const handleGeneratePix = () => {
    toast.info('Gerando código PIX...')
    // Aqui você integraria com sua API de pagamento PIX
    setTimeout(() => {
      toast.success('Código PIX gerado! Copie o código abaixo.')
      if (onPaymentInitiated) onPaymentInitiated()
    }, 1000)
  }

  const handleGenerateBoleto = () => {
    toast.info('Gerando boleto...')
    // Aqui você integraria com sua API de boleto
    setTimeout(() => {
      toast.success('Boleto gerado com sucesso!')
      if (onPaymentInitiated) onPaymentInitiated()
    }, 1000)
  }

  const handleDownloadInvoice = () => {
    toast.success('Download iniciado!')
    // Aqui você geraria um PDF específico desta fatura
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500/10 text-green-400 border-green-500/20">✅ Pago</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">⏳ Pendente</Badge>
      case 'overdue':
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/20">❌ Vencido</Badge>
      case 'cancelled':
        return <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20">⚫ Cancelado</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const isPaid = invoice.status === 'paid'
  const canPay = invoice.status === 'pending' || invoice.status === 'overdue'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes da Fatura
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Principais */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Número da Fatura</label>
              <p className="text-lg font-mono font-semibold text-foreground">
                {invoice.invoice_number || invoice.id.slice(0, 8)}
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Status</label>
              <div className="mt-1">
                {getStatusBadge(invoice.status)}
              </div>
            </div>
          </div>

          {/* Valor */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Valor Total</p>
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(invoice.amount)}
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-primary/30" />
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 bg-accent/30 rounded-lg">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Vencimento</p>
                <p className="text-sm font-medium text-foreground">
                  {formatDate(invoice.due_date)}
                </p>
              </div>
            </div>

            {invoice.paid_date ? (
              <div className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Pago em</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(invoice.paid_date)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-3 bg-accent/30 rounded-lg">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Criado em</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(invoice.created_at)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Descrição */}
          {invoice.description && (
            <div>
              <label className="text-sm text-muted-foreground">Descrição</label>
              <p className="text-sm text-foreground mt-1 p-3 bg-accent/30 rounded-lg">
                {invoice.description}
              </p>
            </div>
          )}

          {/* Ações */}
          <div className="space-y-3 pt-4 border-t border-border">
            {canPay && (
              <>
                <p className="text-sm font-medium text-foreground mb-2">
                  Formas de Pagamento:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={handleGeneratePix}
                    className="w-full"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Pagar com PIX
                  </Button>
                  <Button 
                    onClick={handleGenerateBoleto}
                    variant="outline"
                    className="w-full"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Gerar Boleto
                  </Button>
                </div>
              </>
            )}

            {isPaid && (
              <Button 
                onClick={handleDownloadInvoice}
                variant="outline"
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar Comprovante
              </Button>
            )}

            <Button 
              onClick={onClose}
              variant="ghost"
              className="w-full"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
