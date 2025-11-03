import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { QRCodeSVG } from 'qrcode.react'
import { 
  ShoppingCart, 
  Copy, 
  Check, 
  Loader2,
  AlertCircle,
  CheckCircle2,
  Package,
  CreditCard
} from 'lucide-react'
import { toast } from 'sonner'
import { checkoutService, PaymentLink } from '@/services/checkoutService'

export function PaymentPage() {
  const { slug } = useParams<{ slug: string }>()
  const [link, setLink] = useState<PaymentLink | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [pixGenerated, setPixGenerated] = useState(false)
  const [pixCode, setPixCode] = useState('')
  const [copied, setCopied] = useState(false)
  
  const [quantity, setQuantity] = useState(1)
  const [customAmount, setCustomAmount] = useState('')
  const [payerName, setPayerName] = useState('')
  const [payerEmail, setPayerEmail] = useState('')
  const [payerPhone, setPayerPhone] = useState('')

  useEffect(() => {
    if (slug) {
      loadPaymentLink()
    }
  }, [slug])

  const loadPaymentLink = async () => {
    try {
      setLoading(true)
      const data = await checkoutService.getPaymentLinkBySlug(slug!)
      
      if (!data) {
        toast.error('Link de pagamento não encontrado')
        return
      }

      setLink(data)
      
      // Definir valor inicial se for preço variável
      if (data.price_type === 'variable' && data.min_amount) {
        setCustomAmount(data.min_amount.toString())
      }
    } catch (error: any) {
      toast.error('Erro ao carregar link de pagamento')
    } finally {
      setLoading(false)
    }
  }

  const calculateTotal = () => {
    if (!link) return 0
    
    if (link.price_type === 'fixed') {
      return (link.amount || 0) * quantity
    } else {
      return parseFloat(customAmount || '0') * quantity
    }
  }

  const handleGeneratePix = async () => {
    if (!link) return

    // Validações
    if (link.price_type === 'variable') {
      const amount = parseFloat(customAmount)
      if (!amount || amount < (link.min_amount || 0)) {
        toast.error(`Valor mínimo: R$ ${link.min_amount?.toFixed(2)}`)
        return
      }
      if (link.max_amount && amount > link.max_amount) {
        toast.error(`Valor máximo: R$ ${link.max_amount?.toFixed(2)}`)
        return
      }
    }

    if (!payerEmail) {
      toast.error('Informe seu email')
      return
    }

    try {
      setProcessing(true)

      const result = await checkoutService.createCheckout({
        payment_link_id: link.id,
        quantity,
        custom_amount: link.price_type === 'variable' ? parseFloat(customAmount) : undefined,
        payer_name: payerName || undefined,
        payer_email: payerEmail,
        payer_phone: payerPhone || undefined
      })

      if (!result.success) {
        toast.error(result.error || 'Erro ao gerar pagamento')
        return
      }

      setPixCode(result.pix_code || '')
      setPixGenerated(true)
      toast.success('PIX gerado com sucesso!')
    } catch (error: any) {
      toast.error('Erro ao processar pagamento')
    } finally {
      setProcessing(false)
    }
  }

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode)
    setCopied(true)
    toast.success('Código PIX copiado!')
    setTimeout(() => setCopied(false), 2000)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!link) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Link não encontrado
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Este link de pagamento não existe ou foi desativado.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (pixGenerated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle>PIX Gerado com Sucesso!</CardTitle>
            <CardDescription>
              Escaneie o QR Code ou copie o código abaixo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* QR Code */}
            <div className="bg-white p-6 rounded-lg flex justify-center">
              <QRCodeSVG value={pixCode} size={200} />
            </div>

            {/* Código PIX */}
            <div>
              <Label>Código PIX Copia e Cola</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={pixCode}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button onClick={handleCopyPix} variant="outline">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Valor */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Valor a pagar
              </p>
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(calculateTotal())}
              </p>
            </div>

            {/* Instruções */}
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p className="font-semibold">Como pagar:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Abra o app do seu banco</li>
                <li>Escolha pagar com PIX</li>
                <li>Escaneie o QR Code ou cole o código</li>
                <li>Confirme o pagamento</li>
              </ol>
            </div>

            {/* Mensagem de sucesso personalizada */}
            {link.success_message && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-800 dark:text-green-200">
                  {link.success_message}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            {link.image_url && (
              <img
                src={link.image_url}
                alt={link.title}
                className="w-full h-64 object-cover rounded-lg mb-4"
              />
            )}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center shrink-0">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{link.title}</CardTitle>
                {link.description && (
                  <CardDescription className="text-base">
                    {link.description}
                  </CardDescription>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Preço */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {link.price_type === 'fixed' ? 'Preço' : 'Valor'}
                  </p>
                  {link.price_type === 'fixed' ? (
                    <p className="text-3xl font-bold text-blue-600">
                      {formatCurrency(link.amount || 0)}
                    </p>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        min={link.min_amount}
                        max={link.max_amount}
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="w-32 text-xl font-bold"
                        placeholder="0,00"
                      />
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p>Mín: {formatCurrency(link.min_amount || 0)}</p>
                        <p>Máx: {formatCurrency(link.max_amount || 0)}</p>
                      </div>
                    </div>
                  )}
                </div>
                <CreditCard className="w-12 h-12 text-blue-600 opacity-20" />
              </div>
            </div>

            {/* Quantidade */}
            {link.allow_quantity && (
              <div>
                <Label htmlFor="quantity">Quantidade</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={link.max_quantity}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Máximo: {link.max_quantity} unidades
                </p>
              </div>
            )}

            {/* Total */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {formatCurrency(calculateTotal())}
                </span>
              </div>
            </div>

            {/* Dados do Pagador */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="font-semibold text-lg">Seus Dados</h3>
              
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={payerEmail}
                  onChange={(e) => setPayerEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={payerPhone}
                  onChange={(e) => setPayerPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="mt-2"
                />
              </div>
            </div>

            {/* Botão de Pagamento */}
            <Button
              onClick={handleGeneratePix}
              disabled={processing}
              className="w-full h-14 text-lg"
              size="lg"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Gerando PIX...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Gerar PIX - {formatCurrency(calculateTotal())}
                </>
              )}
            </Button>

            {/* Informações adicionais */}
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              <p>🔒 Pagamento seguro via PIX</p>
              <p className="mt-1">Confirmação instantânea</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
