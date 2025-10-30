import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { CreditCard, QrCode, ArrowLeftRight, User } from 'lucide-react'
import { toast } from 'sonner'
import { FormField, FormLabel } from './ui/form'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface SolicitarSaqueModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type TransferType = 'pix' | 'interna'

interface UserSuggestion {
  id: string
  name: string
  email: string
}

export function SolicitarSaqueModal({ open, onOpenChange }: SolicitarSaqueModalProps) {
  const { effectiveUserId } = useAuth()
  const [transferType, setTransferType] = useState<TransferType>('pix')
  const [valor, setValor] = useState('')
  const [chavePix, setChavePix] = useState('')
  const [usuario, setUsuario] = useState('@')
  const [descricao, setDescricao] = useState('')
  const [pin, setPin] = useState('')
  const [userSuggestions, setUserSuggestions] = useState<UserSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [saldoDisponivel, setSaldoDisponivel] = useState(0)
  const [loading, setLoading] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')

  // Carregar saldo disponível
  useEffect(() => {
    if (open && effectiveUserId) {
      loadBalance()
    }
  }, [open, effectiveUserId])

  // Buscar usuários quando o campo de usuário mudar
  useEffect(() => {
    if (transferType === 'interna' && usuario.length > 1) {
      searchUsers(usuario.replace('@', ''))
    } else {
      setUserSuggestions([])
      setShowSuggestions(false)
    }
  }, [usuario, transferType])

  const loadBalance = async () => {
    try {
      if (!effectiveUserId) return

      const { data, error } = await supabase
        .from('wallets')
        .select('available_balance')
        .eq('user_id', effectiveUserId)
        .eq('currency_code', 'BRL')
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('Erro ao buscar saldo:', error)
        return
      }

      setSaldoDisponivel(data?.available_balance || 0)
    } catch (error) {
      console.error('Erro ao carregar saldo:', error)
    }
  }

  const searchUsers = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setUserSuggestions([])
      return
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(5)

      if (error) throw error

      setUserSuggestions(data || [])
      setShowSuggestions(true)
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
    }
  }

  const handleUsuarioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    
    // Garantir que sempre comece com @
    if (!value.startsWith('@')) {
      value = '@' + value
    }
    
    setUsuario(value)
  }

  const selectUser = (user: UserSuggestion) => {
    setUsuario('@' + user.name.toLowerCase().replace(/\s+/g, ''))
    setSelectedUserId(user.id)
    setShowSuggestions(false)
  }

  const handleTransferTypeChange = (type: TransferType) => {
    setTransferType(type)
    // Resetar campo de usuário com @ quando mudar para interna
    if (type === 'interna') {
      setUsuario('@')
    }
  }

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

  const calculateTax = () => {
    if (transferType === 'interna') return 0
    const amount = Number(valor.replace(/\./g, '').replace(',', '.')) || 0
    const tax = amount * 0.02 // 2%
    return Math.max(tax, 0.80) // Mínimo de R$ 0,80
  }

  const handleSubmit = async () => {
    const amount = Number(valor.replace(/\./g, '').replace(',', '.')) || 0

    if (!valor || amount === 0) {
      toast.error('Por favor, insira um valor válido')
      return
    }

    if (!effectiveUserId) {
      toast.error('Usuário não autenticado')
      return
    }

    // Validar saldo
    const totalWithTax = amount + calculateTax()
    if (totalWithTax > saldoDisponivel) {
      toast.error('Saldo insuficiente para esta transferência')
      return
    }

    if (transferType === 'pix') {
      if (!chavePix.trim()) {
        toast.error('Por favor, insira a chave PIX')
        return
      }
    } else {
      if (!usuario.trim() || usuario === '@') {
        toast.error('Por favor, selecione um usuário')
        return
      }
      if (!selectedUserId) {
        toast.error('Por favor, selecione um usuário da lista')
        return
      }
      if (!pin.trim()) {
        toast.error('Por favor, confirme seu PIN')
        return
      }
    }

    setLoading(true)
    try {
      if (transferType === 'pix') {
        // Criar transação de saque PIX
        const { data, error } = await supabase
          .from('transactions')
          .insert({
            user_id: effectiveUserId,
            type: 'withdrawal',
            amount: amount,
            tax: calculateTax(),
            status: 'pending',
            payment_method: 'pix',
            description: descricao || 'Saque via PIX',
            pix_key: chavePix,
          })
          .select()
          .single()

        if (error) throw error

        toast.success('Saque PIX solicitado com sucesso!')
        console.log('💸 Saque PIX criado:', data.id)
      } else {
        // Transferência interna
        const { data, error } = await supabase
          .from('transactions')
          .insert({
            user_id: effectiveUserId,
            type: 'transfer',
            amount: amount,
            tax: 0,
            status: 'pending',
            payment_method: 'internal',
            description: descricao || 'Transferência interna',
            destination_user_id: selectedUserId,
          })
          .select()
          .single()

        if (error) throw error

        toast.success('Transferência interna realizada com sucesso!')
        console.log('🔄 Transferência interna criada:', data.id)
      }
      
      // Limpar campos
      setValor('')
      setChavePix('')
      setUsuario('@')
      setDescricao('')
      setPin('')
      setSelectedUserId('')
      setUserSuggestions([])
      setShowSuggestions(false)
      onOpenChange(false)
    } catch (error: any) {
      console.error('Erro ao processar transferência:', error)
      toast.error(error.message || 'Erro ao processar transferência')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="text-primary" size={24} />
            Realizar Transferência
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Botões de Tipo de Transferência */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={transferType === 'pix' ? 'default' : 'outline'}
              onClick={() => handleTransferTypeChange('pix')}
              className={transferType === 'pix' ? 'bg-primary text-black' : 'border-border'}
            >
              <QrCode size={18} className="mr-2" />
              PIX
            </Button>
            <Button
              variant={transferType === 'interna' ? 'default' : 'outline'}
              onClick={() => handleTransferTypeChange('interna')}
              className={transferType === 'interna' ? 'bg-primary text-black' : 'border-border'}
            >
              <ArrowLeftRight size={18} className="mr-2" />
              Transferência Interna
            </Button>
          </div>

          {/* Campo de Valor */}
          <FormField>
            <FormLabel>
              Valor <span className="text-red-400">*</span>
            </FormLabel>
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
            <p className="text-xs text-muted-foreground mt-1">
              Saldo disponível: R$ {saldoDisponivel.toFixed(2).replace('.', ',')}
            </p>
          </FormField>

          {/* Informações de Taxa */}
          <div className="bg-accent/50 rounded-lg p-3 space-y-1">
            {transferType === 'pix' ? (
              <>
                <p className="text-xs text-muted-foreground">
                  <span className="text-foreground">Taxa de transferência:</span> 2,00%
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="text-foreground">Taxa mínima:</span> R$ 0,80
                </p>
                {valor && Number(valor.replace(/\./g, '').replace(',', '.')) > 0 && (
                  <p className="text-xs text-primary font-medium mt-2">
                    Taxa calculada: R$ {calculateTax().toFixed(2).replace('.', ',')}
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                <span className="text-foreground">Taxa de transferência:</span>{' '}
                <span className="text-primary font-medium">Isento</span>
              </p>
            )}
          </div>

          {/* Campos específicos por tipo */}
          {transferType === 'pix' ? (
            <>
              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-medium text-foreground mb-3">
                  Dados do destinatário
                </h3>
                
                <FormField>
                  <FormLabel>
                    Chave PIX <span className="text-red-400">*</span>
                  </FormLabel>
                  <Input
                    type="text"
                    value={chavePix}
                    onChange={(e) => setChavePix(e.target.value)}
                    placeholder="CPF"
                    className="bg-background border-border text-foreground"
                  />
                </FormField>
              </div>

              <FormField>
                <FormLabel>Descrição</FormLabel>
                <Input
                  type="text"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Adicione uma descrição (opcional)"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </FormField>
            </>
          ) : (
            <>
              <FormField>
                <FormLabel>
                  Usuário <span className="text-red-400">*</span>
                </FormLabel>
                <div className="relative">
                  <Input
                    type="text"
                    value={usuario}
                    onChange={handleUsuarioChange}
                    onFocus={() => usuario.length > 1 && setShowSuggestions(true)}
                    placeholder="@usuario"
                    className="bg-background border-border text-foreground"
                  />
                  
                  {/* Lista de Sugestões */}
                  {showSuggestions && userSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {userSuggestions.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => selectUser(user)}
                          className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center gap-3 border-b border-border last:border-b-0"
                        >
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <User size={16} className="text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-foreground text-sm font-medium">{user.name}</p>
                            <p className="text-muted-foreground text-xs">{user.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Mensagem quando não encontrar usuários */}
                  {showSuggestions && usuario.length > 2 && userSuggestions.length === 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg p-4">
                      <p className="text-muted-foreground text-sm text-center">
                        Nenhum usuário encontrado
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Digite o nome ou email do usuário
                </p>
              </FormField>

              <FormField>
                <FormLabel>Descrição</FormLabel>
                <Input
                  type="text"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Adicione uma descrição (opcional)"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </FormField>

              <FormField>
                <FormLabel>
                  Confirme seu PIN <span className="text-red-400">*</span>
                </FormLabel>
                <Input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  maxLength={4}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </FormField>
            </>
          )}

          {/* Botão de Confirmação */}
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-black font-medium"
            size="lg"
          >
            {transferType === 'pix' ? (
              <>
                <QrCode size={20} className="mr-2" />
                Transferir via PIX
              </>
            ) : (
              <>
                <ArrowLeftRight size={20} className="mr-2" />
                Realizar Transferência
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
