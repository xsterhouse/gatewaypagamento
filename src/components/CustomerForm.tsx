import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { generateInvoicePayment } from '@/services/invoicePaymentService'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

const customerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  address: z.string().min(1, 'Endereço é obrigatório'),
  cep: z.string().min(1, 'CEP é obrigatório'),
  phone: z.string().min(1, 'Telefone é obrigatório'),
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos'),
})

const invoiceSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.string().min(1, 'Valor é obrigatório'),
  due_date: z.date({
    required_error: 'Data de vencimento é obrigatória',
  }),
  has_interest: z.boolean().default(false),
  interest_rate: z.string().optional(),
})

type CustomerFormData = z.infer<typeof customerSchema>
type InvoiceFormData = z.infer<typeof invoiceSchema>

interface CustomerFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function CustomerForm({ onSuccess, onCancel }: CustomerFormProps) {
  const { effectiveUserId } = useAuth()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  const customerForm = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
  })

  const invoiceForm = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
  })

  const hasInterest = invoiceForm.watch('has_interest')

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }

  const formatCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1')
  }

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1')
  }

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    const number = parseInt(numbers) / 100
    return number.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  const handleCustomerSubmit = async (data: CustomerFormData) => {
    try {
      setLoading(true)
      
      if (!effectiveUserId) {
        toast.error('Usuário não autenticado')
        return
      }

      const { error } = await supabase
        .from('customers')
        .insert({
          ...data,
          user_id: effectiveUserId,
        })

      if (error) {
        toast.error('Erro ao cadastrar cliente: ' + error.message)
        return
      }

      toast.success('Cliente cadastrado com sucesso!')
      setCurrentStep(2)
    } catch (error) {
      console.error('Erro ao cadastrar cliente:', error)
      toast.error('Erro ao cadastrar cliente')
    } finally {
      setLoading(false)
    }
  }

  const handleInvoiceSubmit = async (data: InvoiceFormData) => {
    try {
      setLoading(true)
      
      if (!effectiveUserId) {
        toast.error('Usuário não autenticado')
        return
      }

      // Primeiro, obter o cliente recém-criado
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id, name, cpf, email')
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (customerError || !customer) {
        toast.error('Erro ao encontrar cliente cadastrado')
        return
      }

      // Converter valor para número
      const amountValue = parseFloat(data.amount.replace(/[R$\s.]/g, '').replace(',', '.'))

      // Criar fatura no banco primeiro
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          customer_id: customer.id,
          user_id: effectiveUserId,
          description: data.description,
          amount: amountValue,
          due_date: data.due_date.toISOString().split('T')[0],
          has_interest: data.has_interest,
          interest_rate: data.has_interest ? parseFloat(data.interest_rate || '0') : 0,
          status: 'pending'
        })
        .select()
        .single()

      if (invoiceError || !invoice) {
        toast.error('Erro ao criar fatura: ' + (invoiceError?.message || 'Erro desconhecido'))
        return
      }

      console.log('🧾 Fatura criada, gerando pagamento via MercadoPago...')

      // Gerar QR code e código de barras via API MercadoPago
      const paymentResult = await generateInvoicePayment({
        amount: amountValue,
        description: data.description,
        invoiceId: invoice.id,
        customerName: customer.name,
        customerCpf: customer.cpf,
        customerEmail: customer.email,
        dueDate: data.due_date.toISOString().split('T')[0]
      })

      if (!paymentResult.success) {
        toast.error('Erro ao gerar pagamento: ' + (paymentResult.error || 'Erro na API MercadoPago'))
        return
      }

      console.log('✅ Pagamento gerado via MercadoPago:', paymentResult)

      toast.success('Fatura criada com QR code e código de barras reais!')
      onSuccess?.()
    } catch (error) {
      console.error('Erro ao criar fatura:', error)
      toast.error('Erro ao criar fatura')
    } finally {
      setLoading(false)
    }
  }

  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {currentStep === 1 ? 'Cadastrar Cliente' : 'Criar Fatura'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {currentStep === 1 ? (
          <form onSubmit={customerForm.handleSubmit(handleCustomerSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  {...customerForm.register('name')}
                  placeholder="João da Silva"
                />
                {customerForm.formState.errors.name && (
                  <p className="text-sm text-red-500">
                    {customerForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...customerForm.register('email')}
                  placeholder="joao@exemplo.com"
                />
                {customerForm.formState.errors.email && (
                  <p className="text-sm text-red-500">
                    {customerForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  {...customerForm.register('cpf')}
                  placeholder="000.000.000-00"
                  onChange={(e) => {
                    e.target.value = formatCPF(e.target.value)
                    customerForm.register('cpf').onChange(e)
                  }}
                  maxLength={14}
                />
                {customerForm.formState.errors.cpf && (
                  <p className="text-sm text-red-500">
                    {customerForm.formState.errors.cpf.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  {...customerForm.register('phone')}
                  placeholder="(00) 00000-0000"
                  onChange={(e) => {
                    e.target.value = formatPhone(e.target.value)
                    customerForm.register('phone').onChange(e)
                  }}
                  maxLength={15}
                />
                {customerForm.formState.errors.phone && (
                  <p className="text-sm text-red-500">
                    {customerForm.formState.errors.phone.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cep">CEP *</Label>
                <Input
                  id="cep"
                  {...customerForm.register('cep')}
                  placeholder="00000-000"
                  onChange={(e) => {
                    e.target.value = formatCEP(e.target.value)
                    customerForm.register('cep').onChange(e)
                  }}
                  maxLength={9}
                />
                {customerForm.formState.errors.cep && (
                  <p className="text-sm text-red-500">
                    {customerForm.formState.errors.cep.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço Completo *</Label>
              <Textarea
                id="address"
                {...customerForm.register('address')}
                placeholder="Rua, número, bairro, cidade, estado"
                rows={3}
              />
              {customerForm.formState.errors.address && (
                <p className="text-sm text-red-500">
                  {customerForm.formState.errors.address.message}
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancelar
                </Button>
              )}
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Avançar para Fatura'}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={invoiceForm.handleSubmit(handleInvoiceSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição da Cobrança *</Label>
              <Textarea
                id="description"
                {...invoiceForm.register('description')}
                placeholder="Descrição detalhada do produto ou serviço"
                rows={3}
              />
              {invoiceForm.formState.errors.description && (
                <p className="text-sm text-red-500">
                  {invoiceForm.formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Valor *</Label>
                <Input
                  id="amount"
                  {...invoiceForm.register('amount')}
                  placeholder="R$ 0,00"
                  onChange={(e) => {
                    e.target.value = formatCurrency(e.target.value)
                    invoiceForm.register('amount').onChange(e)
                  }}
                />
                {invoiceForm.formState.errors.amount && (
                  <p className="text-sm text-red-500">
                    {invoiceForm.formState.errors.amount.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Data de Vencimento *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !invoiceForm.getValues('due_date') && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {invoiceForm.getValues('due_date') ? (
                        format(invoiceForm.getValues('due_date')!, "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        "Selecione uma data"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={invoiceForm.getValues('due_date')}
                      onSelect={(date) => {
                        if (date) {
                          invoiceForm.setValue('due_date', date)
                        }
                      }}
                      locale={ptBR}
                      initialFocus
                      className="rounded-md border"
                      formatters={{
                        formatWeekdayName: (date) => format(date, 'EEEEEE', { locale: ptBR }),
                      }}
                    />
                  </PopoverContent>
                </Popover>
                {invoiceForm.formState.errors.due_date && (
                  <p className="text-sm text-red-500">
                    {invoiceForm.formState.errors.due_date.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="has_interest"
                checked={hasInterest}
                onCheckedChange={(checked) => invoiceForm.setValue('has_interest', checked)}
              />
              <Label htmlFor="has_interest">Aplicar juros por atraso</Label>
            </div>

            {hasInterest && (
              <div className="space-y-2">
                <Label htmlFor="interest_rate">Taxa de Juros (%)</Label>
                <Input
                  id="interest_rate"
                  type="number"
                  step="0.01"
                  {...invoiceForm.register('interest_rate')}
                  placeholder="2.00"
                />
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(1)}
                disabled={loading}
              >
                Voltar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Criando...' : 'Criar Fatura'}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
