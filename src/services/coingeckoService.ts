// ================================================
// CoinGecko API Service
// ================================================
// API Gratuita - Não requer API Key
// Limite: 10-50 requests/minuto

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3'

// Mapeamento de símbolos para IDs do CoinGecko
const COIN_ID_MAP: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'USDT': 'tether',
  'BNB': 'binancecoin',
  'SOL': 'solana',
  'ADA': 'cardano',
  'DOT': 'polkadot',
  'MATIC': 'matic-network'
}

interface CoinGeckoPriceData {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_percentage_24h: number
  market_cap: number
  total_volume: number
}

interface CryptoPrice {
  cryptocurrency_symbol: string
  price_brl: number
  price_usd: number
  change_24h: number
  volume_24h: number
  market_cap: number
}

export class CoinGeckoService {
  /**
   * Buscar preços de múltiplas criptomoedas
   */
  static async getPrices(symbols: string[]): Promise<CryptoPrice[]> {
    try {
      // Converter símbolos para IDs do CoinGecko
      const coinIds = symbols
        .map(symbol => COIN_ID_MAP[symbol])
        .filter(Boolean)
        .join(',')

      if (!coinIds) {
        throw new Error('Nenhum símbolo válido fornecido')
      }

      // Fazer requisição para API do CoinGecko
      const response = await fetch(
        `${COINGECKO_API_BASE}/coins/markets?` +
        `vs_currency=brl&` +
        `ids=${coinIds}&` +
        `order=market_cap_desc&` +
        `per_page=100&` +
        `page=1&` +
        `sparkline=false&` +
        `price_change_percentage=24h`
      )

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`)
      }

      const data: CoinGeckoPriceData[] = await response.json()

      // Log para debug
      console.log(`CoinGecko retornou ${data.length} moedas`)

      // Filtrar preços null e avisar
      const validData = data.filter(coin => {
        if (coin.current_price === null || coin.current_price === undefined) {
          console.warn(`⚠️ Preço null para ${coin.symbol.toUpperCase()}`)
          return false
        }
        return true
      })

      console.log(`${validData.length} moedas com preços válidos`)

      // Converter para formato do sistema
      const prices: CryptoPrice[] = validData.map(coin => ({
        cryptocurrency_symbol: coin.symbol.toUpperCase(),
        price_brl: coin.current_price,
        price_usd: coin.current_price / this.getBRLtoUSDRate(),
        change_24h: coin.price_change_percentage_24h || 0,
        volume_24h: coin.total_volume || 0,
        market_cap: coin.market_cap || 0
      }))

      return prices
    } catch (error) {
      console.error('Erro ao buscar preços do CoinGecko:', error)
      throw error
    }
  }

  /**
   * Buscar preço de uma única criptomoeda
   */
  static async getPrice(symbol: string): Promise<CryptoPrice | null> {
    try {
      const prices = await this.getPrices([symbol])
      return prices[0] || null
    } catch (error) {
      console.error(`Erro ao buscar preço de ${symbol}:`, error)
      return null
    }
  }

  /**
   * Buscar todas as criptomoedas suportadas
   */
  static async getAllSupportedPrices(): Promise<CryptoPrice[]> {
    const symbols = Object.keys(COIN_ID_MAP)
    return this.getPrices(symbols)
  }

  /**
   * Obter taxa BRL/USD estimada (simplificado)
   * Em produção, usar API de câmbio real
   */
  private static getBRLtoUSDRate(): number {
    return 5.0 // Estimativa: 1 USD = 5 BRL
  }

  /**
   * Verificar se símbolo é suportado
   */
  static isSupported(symbol: string): boolean {
    return symbol in COIN_ID_MAP
  }

  /**
   * Obter lista de símbolos suportados
   */
  static getSupportedSymbols(): string[] {
    return Object.keys(COIN_ID_MAP)
  }

  /**
   * Formatar preço em BRL
   */
  static formatPriceBRL(price: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(price)
  }

  /**
   * Formatar variação 24h
   */
  static formatChange(change: number): string {
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(2)}%`
  }

  /**
   * Obter cor da variação (para UI)
   */
  static getChangeColor(change: number): string {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-600'
  }
}

// ================================================
// Funções auxiliares para usar no componente
// ================================================

/**
 * Hook personalizado para buscar preços
 */
export async function fetchCryptoPrices(): Promise<CryptoPrice[]> {
  try {
    return await CoinGeckoService.getAllSupportedPrices()
  } catch (error) {
    console.error('Erro ao buscar preços:', error)
    return []
  }
}

/**
 * Atualizar preços no banco de dados Supabase
 */
export async function updatePricesInDatabase(
  supabase: any,
  prices: CryptoPrice[]
): Promise<boolean> {
  try {
    for (const price of prices) {
      // Verificar se já existe
      const { data: existing } = await supabase
        .from('crypto_prices')
        .select('id')
        .eq('cryptocurrency_symbol', price.cryptocurrency_symbol)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (existing) {
        // Atualizar registro existente
        await supabase
          .from('crypto_prices')
          .update({
            price_brl: price.price_brl,
            price_usd: price.price_usd,
            change_24h: price.change_24h,
            volume_24h: price.volume_24h,
            market_cap: price.market_cap,
            created_at: new Date().toISOString()
          })
          .eq('id', existing.id)
      } else {
        // Inserir novo registro
        await supabase
          .from('crypto_prices')
          .insert({
            cryptocurrency_symbol: price.cryptocurrency_symbol,
            price_brl: price.price_brl,
            price_usd: price.price_usd,
            change_24h: price.change_24h,
            volume_24h: price.volume_24h,
            market_cap: price.market_cap
          })
      }
    }

    console.log(`✅ ${prices.length} preços atualizados no banco de dados`)
    return true
  } catch (error) {
    console.error('Erro ao atualizar preços no banco:', error)
    return false
  }
}

/**
 * Iniciar atualização automática de preços
 * @param intervalMinutes Intervalo em minutos (padrão: 5)
 */
export function startPriceUpdateInterval(
  supabase: any,
  intervalMinutes: number = 5
): NodeJS.Timeout {
  const intervalMs = intervalMinutes * 60 * 1000

  const updatePrices = async () => {
    console.log('🔄 Atualizando preços das criptomoedas...')
    const prices = await fetchCryptoPrices()
    if (prices.length > 0) {
      await updatePricesInDatabase(supabase, prices)
      console.log('✅ Preços atualizados com sucesso!')
    }
  }

  // Executar imediatamente
  updatePrices()

  // Depois executar no intervalo
  return setInterval(updatePrices, intervalMs)
}
