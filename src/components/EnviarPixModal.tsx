import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SelectNative } from '@/components/ui/select-native'
import { toast } from 'sonner'
import { pixSendService } from '@/services/pixSendService'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2, Send, AlertCircle } from 'lucide-react'

interface EnviarPixModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function EnviarPixModal({ open, onClose, onSuccess }: EnviarPixModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'confirm'>('form')
  
  const [formData, setFormData] = useState({
    amount: '',
    pix_key: '',
    pix_key_type: 'cpf' as 'cpf' | 'cnpj' | 'email' | 'phone' | 'random',
    receiver_name: '',
    description: ''
  })
  
  const [limits, setLimits] = useState<any>(null)

  // Carregar limites ao abrir
  useState(() => {
    if (open && user) {
      loadLimits()
    }
  })

  const loadLimits = async () => {
    if (!user) return
    const data = await pixSendService.getAvailableLimits(user.id)
    setLimits(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (step === 'form') {
      // Validar e ir para confirmação
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        toast.error('Digite um valor válido')
        return
      }
      
      if (!formData.pix_key) {
        toast.error('Digite a chave PIX')
        return
      }
      
      setStep('confirm')
      return
    }
    
    // Enviar PIX
    if (!user) return
    
    setLoading(true)
    
    try {
      const result = await pixSendService.sendPix({
        user_id: user.id,
        amount: parseFloat(formData.amount),
        pix_key: formData.pix_key,
        pix_key_type: formData.pix_key_type,
        receiver_name: formData.receiver_name || undefined,
        description: formData.description || 'Transferência PIX'
      })
      
      if (!result.success) {
        toast.error(result.error || 'Erro ao enviar PIX')
        return
      }
      
      toast.success('PIX enviado com sucesso!')
      
      // Resetar form
      setFormData({
        amount: '',
        pix_key: '',
        pix_key_type: 'cpf',
        receiver_name: '',
        description: ''
      })
      setStep('form')
      
      onSuccess?.()
      onClose()
      
    } catch (error: any) {
      console.error('Erro:', error)
      toast.error('Erro ao enviar PIX')
    } finally {
      setLoading(false)
    }
  }

  const calculateTotal = () => {
    const amount = parseFloat(formData.amount) || 0
    const fee = limits ? (amount * limits.fee_percentage + limits.fee_fixed) : 0
    return amount + fee
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            {step === 'form' ? 'Enviar PIX' : 'Confirmar Envio'}
          </DialogTitle>
          <DialogDescription>
            {step === 'form' 
              ? 'Preencha os dados para enviar PIX'
              : 'Revise os dados antes de confirmar'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 'form' ? (
            <>
              {/* Saldo Disponível */}
              {limits && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Saldo Disponível</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    R$ {limits.available_balance.toFixed(2)}
                  </p>
                </div>
              )}

              {/* Valor */}
              <div>
                <Label htmlFor="amount">Valor *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
                {limits && formData.amount && (
                  <p className="text-xs text-gray-400 mt-1">
                    Taxa: R$ {(parseFloat(formData.amount) * limits.fee_percentage + limits.fee_fixed).toFixed(2)} | 
                    Total: R$ {calculateTotal().toFixed(2)}
                  </p>
                )}
              </div>

              {/* Tipo de Chave */}
              <div>
                <Label htmlFor="pix_key_type">Tipo de Chave *</Label>
                <SelectNative
                  id="pix_key_type"
                  value={formData.pix_key_type}
                  onChange={(e) => setFormData({ ...formData, pix_key_type: e.target.value as any })}
                >
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="email">Email</option>
                  <option value="phone">Telefone</option>
                  <option value="random">Chave Aleatória</option>
                </SelectNative>
              </div>

              {/* Chave PIX */}
              <div>
                <Label htmlFor="pix_key">Chave PIX *</Label>
                <Input
                  id="pix_key"
                  type="text"
                  placeholder={
                    formData.pix_key_type === 'cpf' ? '000.000.000-00' :
                    formData.pix_key_type === 'cnpj' ? '00.000.000/0000-00' :
                    formData.pix_key_type === 'email' ? 'email@exemplo.com' :
                    formData.pix_key_type === 'phone' ? '(00) 00000-0000' :
                    'Chave aleatória'
                  }
                  value={formData.pix_key}
                  onChange={(e) => setFormData({ ...formData, pix_key: e.target.value })}
                  required
                />
              </div>

              {/* Nome do Destinatário (Opcional) */}
              <div>
                <Label htmlFor="receiver_name">Nome do Destinatário (Opcional)</Label>
                <Input
                  id="receiver_name"
                  type="text"
                  placeholder="João Silva"
                  value={formData.receiver_name}
                  onChange={(e) => setFormData({ ...formData, receiver_name: e.target.value })}
                />
              </div>

              {/* Descrição */}
              <div>
                <Label htmlFor="description">Descrição (Opcional)</Label>
                <Input
                  id="description"
                  type="text"
                  placeholder="Pagamento, transferência, etc"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </>
          ) : (
            <>
              {/* Confirmação */}
              <div className="space-y-3 bg-gray-800/50 rounded-lg p-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Valor:</span>
                  <span className="font-semibold">R$ {parseFloat(formData.amount).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Taxa:</span>
                  <span className="text-sm">
                    R$ {limits ? (parseFloat(formData.amount) * limits.fee_percentage + limits.fee_fixed).toFixed(2) : '0.00'}
                  </span>
                </div>
                
                <div className="border-t border-gray-700 pt-2 flex justify-between">
                  <span className="text-gray-400 font-semibold">Total:</span>
                  <span className="font-bold text-emerald-400">R$ {calculateTotal().toFixed(2)}</span>
                </div>
                
                <div className="border-t border-gray-700 pt-2">
                  <p className="text-sm text-gray-400">Chave PIX:</p>
                  <p className="font-mono text-sm break-all">{formData.pix_key}</p>
                </div>
                
                {formData.receiver_name && (
                  <div>
                    <p className="text-sm text-gray-400">Destinatário:</p>
                    <p className="font-semibold">{formData.receiver_name}</p>
                  </div>
                )}
                
                {formData.description && (
                  <div>
                    <p className="text-sm text-gray-400">Descrição:</p>
                    <p className="text-sm">{formData.description}</p>
                  </div>
                )}
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-200">
                  <p className="font-semibold">Atenção!</p>
                  <p>Verifique os dados antes de confirmar. Esta operação não pode ser desfeita.</p>
                </div>
              </div>
            </>
          )}

          <div className="flex gap-2 pt-4">
            {step === 'confirm' && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('form')}
                className="flex-1"
                disabled={loading}
              >
                Voltar
              </Button>
            )}
            
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : step === 'form' ? (
                'Continuar'
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Confirmar Envio
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
