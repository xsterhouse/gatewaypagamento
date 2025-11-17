import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { QrCode, Plus, Copy, Share2, Check, RefreshCw, Clock, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { bankAcquirerService } from '@/services/bankAcquirerService'

interface GerarPixModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GerarPixModal({ open, onOpenChange }: GerarPixModalProps) {
  const { effectiveUserId } = useAuth()
  const [valor, setValor] = useState('')
  const [descricao, setDescricao] = useState('')
  const [pixCode, setPixCode] = useState('')
  const [showQRCode, setShowQRCode] = useState(false)
  const [copied, setCopied] = useState(false)
  const [transactionId, setTransactionId] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'expired'>('pending')
  const [isChecking, setIsChecking] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const quickValues = [
    { label: '+R$ 10,00', value: 10 },
    { label: '+R$ 25,00', value: 25 },
    { label: '+R$ 50,00', value: 50 },
    { label: '+R$ 100,00', value: 100 },
  ]

  const formatCurrency = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    
    // Converte para número e divide por 100 para ter os centavos
    const amount = Number(numbers) / 100
    
    // Formata como moeda brasileira
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value)
    setValor(formatted)
  }

  // Função para verificar status do pagamento
  const checkPaymentStatus = async () => {
    if (!transactionId) return

    try {
      setIsChecking(true)
      const response = await fetch('/api/check_pix_status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactionId }),
      })

      const result = await response.json()

      if (result.success && result.transaction) {
        const newStatus = result.transaction.status
        
        if (newStatus !== paymentStatus) {
          setPaymentStatus(newStatus)
          
          if (newStatus === 'paid') {
            toast.success('Pagamento recebido com sucesso! 💰')
            // Limpar polling
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
            // Fechar modal após 3 segundos
            setTimeout(() => {
              handleClose()
            }, 3000)
          } else if (newStatus === 'expired') {
            toast.error('QR Code expirado. Por favor, gere um novo.')
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error)
    } finally {
      setIsChecking(false)
    }
  }

  // Iniciar polling quando QR Code é gerado
  useEffect(() => {
    if (showQRCode && transactionId && paymentStatus === 'pending') {
      // Verificar imediatamente
      checkPaymentStatus()
      
      // Configurar polling a cada 10 segundos
      intervalRef.current = setInterval(checkPaymentStatus, 10000)
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    }
  }, [showQRCode, transactionId, paymentStatus])

  // Limpar polling ao desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

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
    const tax = amount * 0.035 // 3.5%
    return Math.max(tax, 0.60) // Mínimo de R$ 0,60
  }

  const handleGerarQRCode = async () => {
    if (!valor || Number(valor.replace(/\./g, '').replace(',', '.')) === 0) {
      toast.error('Por favor, insira um valor válido')
      return
    }

    if (!descricao.trim()) {
      toast.error('Por favor, adicione uma descrição')
      return
    }

    if (!effectiveUserId) {
      toast.error('Usuário não autenticado')
      return
    }

    try {
      const amount = Number(valor.replace(/\./g, '').replace(',', '.'))
      
      // Usar o serviço de adquirentes para criar o pagamento PIX
      const result = await bankAcquirerService.createPixPayment({
        amount,
        description: descricao,
        user_id: effectiveUserId,
        expires_in_minutes: 30
      })

      if (!result.success) {
        toast.error(result.error || 'Erro ao gerar PIX')
        return
      }

      setPixCode(result.pix_code || '')
      setTransactionId(result.transaction_id || '')
      setPaymentStatus('pending')
      setShowQRCode(true)
      toast.success('QR Code gerado com sucesso!')
      console.log('💵 Pagamento PIX criado via adquirente:', result.transaction_id)
    } catch (error) {
      console.error('Erro ao gerar PIX:', error)
      toast.error('Erro ao processar solicitação')
    }
  }

  const handleCopyPixCode = async () => {
    try {
      await navigator.clipboard.writeText(pixCode)
      setCopied(true)
      toast.success('Código PIX copiado!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Erro ao copiar código')
    }
  }

  const handleShareLink = async () => {
    const amount = Number(valor.replace(/\./g, '').replace(',', '.'))
    const shareUrl = `${window.location.origin}/pix?code=${encodeURIComponent(pixCode)}&amount=${amount}&desc=${encodeURIComponent(descricao)}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Pagamento PIX',
          text: `Pagamento de R$ ${valor} - ${descricao}`,
          url: shareUrl,
        })
        toast.success('Link compartilhado!')
      } catch (error) {
        // Usuário cancelou ou erro
      }
    } else {
      // Fallback: copiar link
      try {
        await navigator.clipboard.writeText(shareUrl)
        toast.success('Link copiado!')
      } catch (error) {
        toast.error('Erro ao copiar link')
      }
    }
  }

  const handleClose = () => {
    // Limpar polling
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    onOpenChange(false)
    setTimeout(() => {
      setValor('')
      setDescricao('')
      setPixCode('')
      setTransactionId('')
      setPaymentStatus('pending')
      setShowQRCode(false)
      setCopied(false)
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent onClose={handleClose} className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="text-primary" size={24} />
            {showQRCode ? 'QR Code PIX Gerado' : 'Adicionar Saldo'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!showQRCode ? (
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
                className="bg-background border-border text-foreground pl-10 text-lg"
              />
            </div>
          </div>

          {/* Botões de Valores Rápidos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {quickValues.map((item) => (
              <Button
                key={item.value}
                variant="outline"
                size="sm"
                onClick={() => addQuickValue(item.value)}
                className="border-border hover:border-primary hover:bg-primary/10"
              >
                <Plus size={14} className="mr-1" />
                {item.label.replace('+', '')}
              </Button>
            ))}
          </div>

          {/* Informações de Taxa */}
          <div className="bg-accent/50 rounded-lg p-3 space-y-1">
            <p className="text-xs text-muted-foreground">
              <span className="text-foreground">Taxa de transferência:</span> 3,5%
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="text-foreground">Taxa mínima:</span> R$ 0,60
            </p>
            {valor && Number(valor.replace(/\./g, '').replace(',', '.')) > 0 && (
              <p className="text-xs text-primary font-medium mt-2">
                Taxa calculada: R$ {calculateTax().toFixed(2).replace('.', ',')}
              </p>
            )}
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
              placeholder="Do que se trata?"
              className="bg-background border-border text-foreground"
            />
          </div>

              {/* Botão Gerar QR Code */}
              <Button
                onClick={handleGerarQRCode}
                className="w-full bg-primary hover:bg-primary/90 text-black font-medium"
                size="lg"
              >
                <QrCode size={20} className="mr-2" />
                Gerar QR Code
              </Button>
            </>
          ) : (
            // Exibição do QR Code
            <>
              {/* Informações do Pagamento */}
              <div className="bg-accent/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Valor:</span>
                  <span className="text-lg font-bold text-foreground">R$ {valor}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Descrição:</span>
                  <span className="text-sm text-foreground">{descricao}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Taxa:</span>
                  <span className="text-sm text-yellow-400">R$ {calculateTax().toFixed(2).replace('.', ',')}</span>
                </div>
              </div>

              {/* Status do Pagamento */}
              <div className="flex flex-col items-center space-y-3">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                  paymentStatus === 'paid' 
                    ? 'bg-green-100 text-green-800' 
                    : paymentStatus === 'expired'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {paymentStatus === 'paid' ? (
                    <>
                      <CheckCircle size={16} />
                      <span className="text-sm font-medium">Pago ✅</span>
                    </>
                  ) : paymentStatus === 'expired' ? (
                    <>
                      <Clock size={16} />
                      <span className="text-sm font-medium">Expirado</span>
                    </>
                  ) : (
                    <>
                      <Clock size={16} className={isChecking ? 'animate-spin' : ''} />
                      <span className="text-sm font-medium">
                        {isChecking ? 'Verificando...' : 'Aguardando pagamento'}
                      </span>
                    </>
                  )}
                </div>

                {/* QR Code */}
                <div className={`bg-white p-6 rounded-lg ${
                  paymentStatus === 'paid' ? 'opacity-50' : ''
                }`}>
                  <QRCodeSVG
                    value={pixCode}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>

              {/* Código PIX Copia e Cola */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Código PIX (Copia e Cola)
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={pixCode}
                    readOnly
                    className="bg-background border-border text-foreground pr-10 text-xs font-mono"
                  />
                  <button
                    onClick={handleCopyPixCode}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Clique no ícone para copiar o código
                </p>
              </div>

              {/* Botões de Ação */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleCopyPixCode}
                  variant="outline"
                  className="border-border hover:border-primary"
                >
                  {copied ? (
                    <>
                      <Check size={18} className="mr-2 text-green-400" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy size={18} className="mr-2" />
                      Copiar Código
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleShareLink}
                  variant="outline"
                  className="border-border hover:border-primary"
                >
                  <Share2 size={18} className="mr-2" />
                  Compartilhar
                </Button>
              </div>

              {/* Botão de Verificação Manual */}
              {paymentStatus === 'pending' && (
                <Button
                  onClick={checkPaymentStatus}
                  disabled={isChecking}
                  variant="outline"
                  className="w-full border-border hover:border-primary"
                >
                  {isChecking ? (
                    <>
                      <RefreshCw size={18} className="mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={18} className="mr-2" />
                      Verificar Pagamento
                    </>
                  )}
                </Button>
              )}
              
              {/* Botão Novo PIX */}
              <Button
                onClick={() => {
                  setShowQRCode(false)
                  setValor('')
                  setDescricao('')
                  setPixCode('')
                  setTransactionId('')
                  setPaymentStatus('pending')
                }}
                className="w-full bg-muted hover:bg-muted/80 text-foreground"
              >
                Gerar Novo PIX
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
