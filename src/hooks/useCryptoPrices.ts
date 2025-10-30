import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchCryptoPrices, updatePricesInDatabase } from '@/services/coingeckoService'
import { toast } from 'sonner'

interface CryptoPrice {
  cryptocurrency_symbol: string
  price_brl: number
  price_usd: number
  change_24h: number
  volume_24h: number
  market_cap: number
}

interface UseCryptoPricesOptions {
  autoUpdate?: boolean
  updateInterval?: number // minutos
}

export function useCryptoPrices(options: UseCryptoPricesOptions = {}) {
  const { autoUpdate = true, updateInterval = 5 } = options
  
  const [prices, setPrices] = useState<CryptoPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Carregar preços do banco de dados
  const loadFromDatabase = async () => {
    try {
      const { data, error } = await supabase
        .from('crypto_prices')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Pegar apenas o preço mais recente de cada cripto
      const latestPrices: { [key: string]: CryptoPrice } = {}
      data?.forEach(price => {
        if (!latestPrices[price.cryptocurrency_symbol]) {
          latestPrices[price.cryptocurrency_symbol] = price
        }
      })

      setPrices(Object.values(latestPrices))
      setLastUpdate(new Date())
      setError(null)
    } catch (error: any) {
      console.error('Erro ao carregar preços do banco:', error)
      setError(error.message)
    }
  }

  // Atualizar preços da API CoinGecko
  const updateFromAPI = async (showToast = false) => {
    try {
      setLoading(true)
      
      if (showToast) {
        toast.info('Atualizando preços...')
      }

      // Buscar preços da API
      const newPrices = await fetchCryptoPrices()
      
      if (newPrices.length === 0) {
        throw new Error('Nenhum preço retornado da API')
      }

      // Atualizar no banco de dados
      await updatePricesInDatabase(supabase, newPrices)

      // Recarregar do banco
      await loadFromDatabase()

      if (showToast) {
        toast.success(`${newPrices.length} preços atualizados!`)
      }

      console.log(`✅ Preços atualizados: ${newPrices.length} criptomoedas`)
    } catch (error: any) {
      console.error('Erro ao atualizar preços:', error)
      setError(error.message)
      
      if (showToast) {
        toast.error('Erro ao atualizar preços')
      }
    } finally {
      setLoading(false)
    }
  }

  // Obter preço de uma cripto específica
  const getPrice = (symbol: string): CryptoPrice | undefined => {
    return prices.find(p => p.cryptocurrency_symbol === symbol)
  }


  // Verificar se está desatualizado (mais de X minutos)
  const isStale = (minutes: number = 10): boolean => {
    if (!lastUpdate) return true
    const diff = Date.now() - lastUpdate.getTime()
    return diff > minutes * 60 * 1000
  }

  // Carregar preços ao montar
  useEffect(() => {
    loadFromDatabase().finally(() => setLoading(false))
  }, [])

  // Auto-atualização
  useEffect(() => {
    if (!autoUpdate) return

    // Atualizar da API se não houver preços ou estiver desatualizado
    if (prices.length === 0 || isStale(updateInterval)) {
      updateFromAPI(false)
    }

    // Configurar intervalo de atualização
    const intervalMs = updateInterval * 60 * 1000
    const interval = setInterval(() => {
      updateFromAPI(false)
    }, intervalMs)

    return () => clearInterval(interval)
  }, [autoUpdate, updateInterval])

  return {
    prices,
    loading,
    error,
    lastUpdate,
    getPrice,
    updateFromAPI,
    refresh: () => loadFromDatabase(),
    isStale: isStale()
  }
}

// Hook para preço de uma cripto específica
export function useCryptoPrice(symbol: string) {
  const { prices, loading, error, updateFromAPI } = useCryptoPrices()
  
  const price = prices.find(p => p.cryptocurrency_symbol === symbol)

  return {
    price,
    priceBRL: price?.price_brl || 0,
    priceUSD: price?.price_usd || 0,
    change24h: price?.change_24h || 0,
    loading,
    error,
    refresh: updateFromAPI
  }
}
