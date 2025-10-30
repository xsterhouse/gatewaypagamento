import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Wallet, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface CreateWalletModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onWalletCreated: () => void
}

interface Currency {
  code: string
  name: string
  type: 'fiat' | 'crypto'
  symbol: string
}

const AVAILABLE_CURRENCIES: Currency[] = [
  { code: 'BRL', name: 'Real Brasileiro', type: 'fiat', symbol: 'R$' },
  { code: 'USD', name: 'Dólar Americano', type: 'fiat', symbol: '$' },
  { code: 'EUR', name: 'Euro', type: 'fiat', symbol: '€' },
  { code: 'BTC', name: 'Bitcoin', type: 'crypto', symbol: '₿' },
  { code: 'ETH', name: 'Ethereum', type: 'crypto', symbol: 'Ξ' },
  { code: 'USDT', name: 'Tether', type: 'crypto', symbol: '₮' },
  { code: 'BNB', name: 'Binance Coin', type: 'crypto', symbol: 'BNB' },
  { code: 'SOL', name: 'Solana', type: 'crypto', symbol: 'SOL' },
]

export function CreateWalletModal({ open, onOpenChange, onWalletCreated }: CreateWalletModalProps) {
  const { effectiveUserId } = useAuth()
  const [selectedCurrency, setSelectedCurrency] = useState('')
  const [loading, setLoading] = useState(false)
  const [existingCurrencies, setExistingCurrencies] = useState<string[]>([])
  const [loadingCurrencies, setLoadingCurrencies] = useState(false)

  // Carregar moedas existentes quando o modal abrir
  useEffect(() => {
    if (open && effectiveUserId) {
      loadExistingCurrencies()
    }
  }, [open, effectiveUserId])

  const loadExistingCurrencies = async () => {
    setLoadingCurrencies(true)
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('currency_code')
        .eq('user_id', effectiveUserId)
        .eq('is_active', true)

      if (error) throw error

      const currencies = data?.map(w => w.currency_code) || []
      setExistingCurrencies(currencies)
      console.log('💳 Moedas existentes:', currencies)
    } catch (error) {
      console.error('Erro ao carregar moedas existentes:', error)
    } finally {
      setLoadingCurrencies(false)
    }
  }

  const handleCreateWallet = async () => {
    if (!selectedCurrency) {
      toast.error('Por favor, selecione uma moeda')
      return
    }

    if (!effectiveUserId) {
      toast.error('Usuário não autenticado')
      return
    }

    const currency = AVAILABLE_CURRENCIES.find(c => c.code === selectedCurrency)
    if (!currency) {
      toast.error('Moeda inválida')
      return
    }

    setLoading(true)
    try {
      console.log('🔍 Verificando carteira existente:', {
        user_id: effectiveUserId,
        currency_code: currency.code
      })

      // Verificar se já existe carteira para essa moeda (incluindo inativas)
      const { data: existingWallets, error: checkError } = await supabase
        .from('wallets')
        .select('id, is_active')
        .eq('user_id', effectiveUserId)
        .eq('currency_code', currency.code)

      if (checkError) {
        console.error('❌ Erro ao verificar carteira:', checkError)
        throw checkError
      }

      console.log('📋 Carteiras encontradas:', existingWallets)

      // Se encontrou alguma carteira (ativa ou inativa)
      if (existingWallets && existingWallets.length > 0) {
        const activeWallet = existingWallets.find(w => w.is_active)
        
        if (activeWallet) {
          toast.error(`Você já possui uma carteira de ${currency.name}`)
          return
        } else {
          // Tem carteira inativa, reativar em vez de criar nova
          toast.error(`Você já possui uma carteira de ${currency.name} (inativa). Entre em contato com o suporte para reativá-la.`)
          return
        }
      }

      console.log('✅ Nenhuma carteira encontrada, criando nova...')

      // Criar nova carteira
      const { data, error } = await supabase
        .from('wallets')
        .insert({
          user_id: effectiveUserId,
          currency_code: currency.code,
          currency_type: currency.type,
          balance: 0,
          available_balance: 0,
          blocked_balance: 0,
          is_active: true,
        })
        .select()
        .single()

      if (error) {
        // Tratamento específico para erro de chave duplicada
        if (error.code === '23505' || error.message.includes('duplicate key')) {
          console.error('❌ Erro de chave duplicada:', error)
          toast.error(`Você já possui uma carteira de ${currency.name}. Atualize a página e tente novamente.`)
          return
        }
        throw error
      }

      console.log('✅ Carteira criada com sucesso:', data)

      toast.success(`Carteira de ${currency.name} criada com sucesso!`)
      
      setSelectedCurrency('')
      onWalletCreated()
      onOpenChange(false)
    } catch (error: any) {
      console.error('❌ Erro ao criar carteira:', error)
      
      // Mensagem de erro mais amigável
      if (error.code === '23505' || error.message?.includes('duplicate key')) {
        toast.error(`Você já possui uma carteira de ${currency.name}. Atualize a página e tente novamente.`)
      } else {
        toast.error(error.message || 'Erro ao criar carteira. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="text-primary" size={24} />
            Criar Nova Carteira
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Selecione a Moeda <span className="text-red-400">*</span>
            </label>
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue placeholder="Escolha uma moeda" />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Moedas Fiat
                </div>
                {AVAILABLE_CURRENCIES.filter(c => c.type === 'fiat').map((currency) => {
                  const alreadyExists = existingCurrencies.includes(currency.code)
                  return (
                    <SelectItem 
                      key={currency.code} 
                      value={currency.code}
                      disabled={alreadyExists}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{currency.symbol}</span>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {currency.code}
                            {alreadyExists && (
                              <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded">
                                Já possui
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{currency.name}</div>
                        </div>
                      </div>
                    </SelectItem>
                  )
                })}
                
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t border-border mt-2">
                  Criptomoedas
                </div>
                {AVAILABLE_CURRENCIES.filter(c => c.type === 'crypto').map((currency) => {
                  const alreadyExists = existingCurrencies.includes(currency.code)
                  return (
                    <SelectItem 
                      key={currency.code} 
                      value={currency.code}
                      disabled={alreadyExists}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{currency.symbol}</span>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {currency.code}
                            {alreadyExists && (
                              <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded">
                                Já possui
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{currency.name}</div>
                        </div>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-accent/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">
              <span className="text-foreground font-medium">Importante:</span> Carteiras são criadas com saldo zero. 
              Você poderá depositar fundos após a criação.
            </p>
          </div>

          <Button
            onClick={handleCreateWallet}
            disabled={loading || !selectedCurrency}
            className="w-full bg-primary hover:bg-primary/90 text-black font-medium"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Wallet size={20} className="mr-2" />
                Criar Carteira
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
