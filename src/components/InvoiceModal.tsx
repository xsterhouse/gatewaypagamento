import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Download, Send, FileText, Plus } from 'lucide-react'
import { CustomerForm } from './CustomerForm'
import { generateInvoicePDF } from './InvoicePDF'
import { InvoiceWithCustomer } from '@/types/invoice'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

interface InvoiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InvoiceModal({ open, onOpenChange }: InvoiceModalProps) {
  const { effectiveUserId } = useAuth()
  const [invoices, setInvoices] = useState<InvoiceWithCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [showCustomerForm, setShowCustomerForm] = useState(false)

  useEffect(() => {
    if (open && effectiveUserId) {
      loadInvoices()
    }
  }, [open, effectiveUserId])

  const loadInvoices = async () => {
    try {
      if (!effectiveUserId) return

      const { data: invoicesData, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao carregar faturas:', error)
        toast.error('Erro ao carregar faturas')
        return
      }

      // Buscar dados dos customers separadamente
      const invoicesWithCustomers = await Promise.all(
        (invoicesData || []).map(async (invoice) => {
          const { data: customerData } = await supabase
            .from('customers')
            .select('*')
            .eq('id', invoice.customer_id)
            .single()
          
          return {
            ...invoice,
            customers: customerData
          }
        })
      )

      setInvoices(invoicesWithCustomers)
    } catch (error) {
      console.error('Erro ao carregar faturas:', error)
      toast.error('Erro ao carregar faturas')
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePDF = async (invoice: InvoiceWithCustomer) => {
    try {
      const pdfBlob = await generateInvoicePDF({
        customer: invoice.customers,
        invoice: invoice
      })
      
      // Criar URL temporária para download
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fatura-${invoice.id.slice(0, 8)}-${invoice.customers.name.replace(/\s+/g, '-').toLowerCase()}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('PDF gerado com sucesso!')
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      toast.error('Erro ao gerar PDF')
    }
  }

  const handleSendInvoice = async (_invoice: InvoiceWithCustomer) => {
    try {
      // Aqui você implementaria o envio por email
      toast.success('Funcionalidade de envio por email em desenvolvimento')
    } catch (error) {
      console.error('Erro ao enviar fatura:', error)
      toast.error('Erro ao enviar fatura')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'Pendente', variant: 'secondary' },
      paid: { label: 'Pago', variant: 'default' },
      overdue: { label: 'Vencido', variant: 'destructive' },
      cancelled: { label: 'Cancelado', variant: 'outline' },
    }

    const { label, variant } = statusMap[status] || { label: status, variant: 'outline' }
    return <Badge variant={variant}>{label}</Badge>
  }

  const handleCustomerFormSuccess = () => {
    setShowCustomerForm(false)
    loadInvoices()
  }

  if (showCustomerForm) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <CustomerForm
            onSuccess={handleCustomerFormSuccess}
            onCancel={() => setShowCustomerForm(false)}
          />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gerenciar Faturas
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="list" value="list" onValueChange={() => {}} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Minhas Faturas</TabsTrigger>
            <TabsTrigger value="new">Nova Fatura</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Faturas Cadastradas</h3>
              <Button onClick={() => setShowCustomerForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Fatura
              </Button>
            </div>

            <ScrollArea className="h-[400px] w-full rounded-md border">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-gray-500">Carregando faturas...</div>
                </div>
              ) : invoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                  <FileText className="h-12 w-12 mb-2 opacity-50" />
                  <p>Nenhuma fatura encontrada</p>
                  <p className="text-sm">Crie sua primeira fatura para começar</p>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {invoices.map((invoice) => (
                    <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base">{invoice.description}</CardTitle>
                            <p className="text-sm text-gray-500 mt-1">
                              Cliente: {invoice.customers.name}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {getStatusBadge(invoice.status)}
                            <p className="text-sm font-semibold">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              }).format(Number(invoice.amount))}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-500">
                            <p>Vencimento: {new Date(invoice.due_date).toLocaleDateString('pt-BR')}</p>
                            <p>CPF: {invoice.customers.cpf}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGeneratePDF(invoice)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              PDF
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendInvoice(invoice)}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Enviar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="new" className="space-y-4">
            <div className="text-center py-8">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Criar Nova Fatura</h3>
              <p className="text-gray-500 mb-4">
                Cadastre um cliente e crie uma fatura personalizada
              </p>
              <Button onClick={() => setShowCustomerForm(true)} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Começar Cadastro
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
