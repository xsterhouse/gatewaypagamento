import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { CreditCard, QrCode, ArrowLeftRight, User } from 'lucide-react'
import { toast } from 'sonner'
import { FormField, FormLabel } from './ui/form'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { processWithdrawal } from '@/lib/mercadopago'

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
  const [pixKeyType, setPixKeyType] = useState<'cpf' | 'cnpj' | 'email' | 'phone' | 'random'>('cpf')
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
        console.log('🚀 Iniciando saque PIX via Mercado Pago...')
        
        // Processar saque PIX via Mercado Pago
        const result = await processWithdrawal({
          userId: effectiveUserId!,
          amount: amount,
          pixKey: chavePix,
          pixKeyType: pixKeyType,
          description: descricao || 'Saque via PIX'
        })

        if (!result.success) {
          throw new Error(result.error || 'Erro ao processar saque PIX')
        }

        console.log('✅ PIX processado via Mercado Pago:', result.paymentId)
        toast.success('✅ PIX enviado com sucesso! O valor será transferido em instantes.')
        
        // Recarregar saldo
        await loadBalance()
      } else {
        // Transferência interna
        
        // 1. Buscar carteira do remetente
        const { data: senderWallet, error: senderWalletError } = await supabase
          .from('wallets')
          .select('id, available_balance')
          .eq('user_id', effectiveUserId)
          .eq('currency_code', 'BRL')
          .eq('is_active', true)
          .single()

        if (senderWalletError || !senderWallet) {
          throw new Error('Carteira do remetente não encontrada')
        }

        // 2. Buscar carteira do destinatário
        const { data: receiverWallet, error: receiverWalletError } = await supabase
          .from('wallets')
          .select('id, available_balance')
          .eq('user_id', selectedUserId)
          .eq('currency_code', 'BRL')
          .eq('is_active', true)
          .single()

        if (receiverWalletError || !receiverWallet) {
          throw new Error('Carteira do destinatário não encontrada')
        }

        // 3. Verificar saldo do remetente
        if (senderWallet.available_balance < amount) {
          throw new Error('Saldo insuficiente')
        }

        // 4. Calcular saldos
        const senderBalanceBefore = Number(senderWallet.available_balance) || 0
        const senderBalanceAfter = senderBalanceBefore - amount
        const receiverBalanceBefore = Number(receiverWallet.available_balance) || 0
        const receiverBalanceAfter = receiverBalanceBefore + amount

        // 5. Debitar do remetente
        const { error: debitError } = await supabase
          .from('wallet_transactions')
          .insert({
            wallet_id: senderWallet.id,
            user_id: effectiveUserId,
            transaction_type: 'debit',
            amount: amount,
            balance_before: senderBalanceBefore,
            balance_after: senderBalanceAfter,
            description: `Transferência interna para ${usuario}`,
            metadata: {
              transfer_type: 'internal',
              destination_user_id: selectedUserId,
              destination_username: usuario,
              description: descricao
            }
          })

        if (debitError) throw debitError

        // 6. Creditar no destinatário
        const { error: creditError } = await supabase
          .from('wallet_transactions')
          .insert({
            wallet_id: receiverWallet.id,
            user_id: selectedUserId,
            transaction_type: 'credit',
            amount: amount,
            balance_before: receiverBalanceBefore,
            balance_after: receiverBalanceAfter,
            description: `Transferência recebida de ${usuario}`,
            metadata: {
              transfer_type: 'internal',
              sender_user_id: effectiveUserId,
              description: descricao
            }
          })

        if (creditError) throw creditError

        // 7. Atualizar saldo do remetente
        const { error: updateSenderError } = await supabase
          .from('wallets')
          .update({
            available_balance: senderBalanceAfter,
            balance: senderBalanceAfter
          })
          .eq('id', senderWallet.id)

        if (updateSenderError) throw updateSenderError

        // 8. Atualizar saldo do destinatário
        const { error: updateReceiverError } = await supabase
          .from('wallets')
          .update({
            available_balance: receiverBalanceAfter,
            balance: receiverBalanceAfter
          })
          .eq('id', receiverWallet.id)

        if (updateReceiverError) throw updateReceiverError

        toast.success('Transferência interna realizada com sucesso!')
        console.log('🔄 Transferência interna concluída')
        
        // Recarregar saldo
        await loadBalance()
      }
      
      // Limpar campos
      setValor('')
      setChavePix('')
      setPixKeyType('cpf')
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
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-xs text-green-500 font-medium">
                    Processamento Automático
                  </p>
                </div>
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
              <>
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-xs text-green-500 font-medium">
                    Transferência Instantânea
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-foreground">Taxa de transferência:</span>{' '}
                  <span className="text-primary font-medium">Isento</span>
                </p>
              </>
            )}
          </div>

          {/* Campos específicos por tipo */}
          {transferType === 'pix' ? (
            <>
              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-medium text-foreground mb-3">
                  Dados do destinatário
                </h3>
                
                {/* Seletor de Tipo de Chave PIX */}
                <FormField>
                  <FormLabel>
                    Tipo de Chave PIX <span className="text-red-400">*</span>
                  </FormLabel>
                  <select
                    value={pixKeyType}
                    onChange={(e) => setPixKeyType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="cpf">CPF</option>
                    <option value="cnpj">CNPJ</option>
                    <option value="email">E-mail</option>
                    <option value="phone">Telefone</option>
                    <option value="random">Chave Aleatória</option>
                  </select>
                </FormField>

                <FormField>
                  <FormLabel>
                    Chave PIX <span className="text-red-400">*</span>
                  </FormLabel>
                  <Input
                    type="text"
                    value={chavePix}
                    onChange={(e) => setChavePix(e.target.value)}
                    placeholder={
                      pixKeyType === 'cpf' ? '000.000.000-00' :
                      pixKeyType === 'cnpj' ? '00.000.000/0000-00' :
                      pixKeyType === 'email' ? 'email@exemplo.com' :
                      pixKeyType === 'phone' ? '(00) 00000-0000' :
                      'Chave aleatória'
                    }
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
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2"></div>
                Processando...
              </>
            ) : transferType === 'pix' ? (
              <>
                <QrCode size={20} className="mr-2" />
                Enviar PIX Agora
              </>
            ) : (
              <>
                <ArrowLeftRight size={20} className="mr-2" />
                Transferir Agora
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
