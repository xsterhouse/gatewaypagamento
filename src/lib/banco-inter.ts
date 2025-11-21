import axios, { AxiosInstance } from 'axios'
import https from 'https'

// ========================================
// TIPOS E INTERFACES
// ========================================

export interface BancoInterConfig {
  clientId: string
  clientSecret: string
  certificate: string
  certificateKey: string
  accountNumber: string
  environment?: 'sandbox' | 'production'
}

export interface PixPaymentRequest {
  valor: number
  calendario: {
    expiracao: number // em segundos
  }
  devedor?: {
    cpf?: string
    cnpj?: string
    nome: string
  }
  chave: string
  solicitacaoPagador?: string
  infoAdicionais?: Array<{
    nome: string
    valor: string
  }>
}

export interface PixPaymentResponse {
  txid: string
  revisao: number
  loc: {
    id: number
    location: string
    tipoCob: string
    criacao: string
  }
  location: string
  status: string
  devedor?: {
    cpf?: string
    cnpj?: string
    nome: string
  }
  valor: {
    original: string
  }
  chave: string
  solicitacaoPagador?: string
  pixCopiaECola: string
  calendario: {
    criacao: string
    expiracao: number
  }
}

export interface SendPixRequest {
  valor: number
  pagador: {
    cpf?: string
    cnpj?: string
  }
  favorecido: {
    cpf?: string
    cnpj?: string
    contaBanco?: {
      codigoBanco: string
      agencia: string
      conta: string
      tipoConta: 'CORRENTE' | 'POUPANCA'
    }
  }
  chave?: string
  descricao?: string
}

export interface SendPixResponse {
  endToEndId: string
  txid?: string
  valor: number
  horario: string
  status: string
}

export interface BoletoRequest {
  seuNumero: string
  valorNominal: number
  dataVencimento: string
  numDiasAgenda: number
  pagador: {
    cpfCnpj: string
    tipoPessoa: 'FISICA' | 'JURIDICA'
    nome: string
    endereco: string
    numero: string
    complemento?: string
    bairro: string
    cidade: string
    uf: string
    cep: string
  }
  mensagem?: {
    linha1?: string
    linha2?: string
    linha3?: string
    linha4?: string
    linha5?: string
  }
  desconto?: {
    codigoDesconto: 'NAOTEMDESCONTO' | 'VALORFIXODATAINFORMADA' | 'PERCENTUALDATAINFORMADA'
    taxa?: number
    valor?: number
    data?: string
  }
  multa?: {
    codigoMulta: 'NAOTEMMULTA' | 'VALORFIXO' | 'PERCENTUAL'
    taxa?: number
    valor?: number
    data?: string
  }
  mora?: {
    codigoMora: 'ISENTO' | 'VALORFIXO' | 'TAXAMENSAL' | 'VALORDIA'
    taxa?: number
    valor?: number
    data?: string
  }
}

export interface BoletoResponse {
  seuNumero: string
  nossoNumero: string
  codigoBarras: string
  linhaDigitavel: string
  dataVencimento: string
  valorNominal: number
  nomeBeneficiario: string
  cnpjCpfBeneficiario: string
  tipoPessoaBeneficiario: string
  nomePagador: string
  cnpjCpfPagador: string
  tipoPessoaPagador: string
  dataEmissao: string
  dataLimite: string
  pixCopiaECola?: string
  qrCode?: string
}

// ========================================
// CLASSE BANCO INTER API
// ========================================

export class BancoInterAPI {
  private config: BancoInterConfig
  private client: AxiosInstance
  private accessToken: string | null = null
  private tokenExpiry: Date | null = null

  constructor(config: BancoInterConfig) {
    this.config = config

    const baseURL = config.environment === 'sandbox'
      ? 'https://cdpj-sandbox.partners.bancointer.com.br'
      : 'https://cdpj.partners.bancointer.com.br'

    // Configurar HTTPS Agent com certificado
    const httpsAgent = new https.Agent({
      cert: config.certificate,
      key: config.certificateKey,
      rejectUnauthorized: true
    })

    this.client = axios.create({
      baseURL,
      httpsAgent,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  // ========================================
  // AUTENTICAÇÃO
  // ========================================

  /**
   * Obtém token de acesso OAuth2
   */
  private async getAccessToken(): Promise<string> {
    // Verifica se o token ainda é válido
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken
    }

    try {
      const params = new URLSearchParams()
      params.append('client_id', this.config.clientId)
      params.append('client_secret', this.config.clientSecret)
      params.append('grant_type', 'client_credentials')
      params.append('scope', 'boleto-cobranca.read boleto-cobranca.write cob.read cob.write cobv.read cobv.write pix.read pix.write')

      const response = await this.client.post('/oauth/v2/token', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })

      this.accessToken = response.data.access_token || null
      
      if (!this.accessToken) {
        throw new Error('Token de acesso não retornado pela API')
      }
      
      // Define expiração (geralmente 3600 segundos, mas vamos usar 3000 para segurança)
      const expiresIn = response.data.expires_in || 3600
      this.tokenExpiry = new Date(Date.now() + (expiresIn - 600) * 1000)

      return this.accessToken

    } catch (error: any) {
      console.error('❌ Erro ao obter token Banco Inter:', error.response?.data || error.message)
      throw new Error('Falha na autenticação com Banco Inter')
    }
  }

  /**
   * Adiciona autenticação às requisições
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.getAccessToken()
    if (!token) {
      throw new Error('Token de acesso não disponível')
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  // ========================================
  // PIX - RECEBER
  // ========================================

  /**
   * Cria uma cobrança PIX imediata (Cob)
   */
  async createPixCharge(params: PixPaymentRequest): Promise<PixPaymentResponse> {
    try {
      const headers = await this.getAuthHeaders()
      
      // Gera um txid único
      const txid = this.generateTxid()

      const response = await this.client.put(
        `/banking/v2/cob/${txid}`,
        params,
        { headers }
      )

      return response.data

    } catch (error: any) {
      console.error('❌ Erro ao criar cobrança PIX:', error.response?.data || error.message)
      throw new Error(error.response?.data?.message || 'Erro ao criar cobrança PIX')
    }
  }

  /**
   * Consulta uma cobrança PIX
   */
  async getPixCharge(txid: string): Promise<PixPaymentResponse> {
    try {
      const headers = await this.getAuthHeaders()

      const response = await this.client.get(
        `/banking/v2/cob/${txid}`,
        { headers }
      )

      return response.data

    } catch (error: any) {
      console.error('❌ Erro ao consultar cobrança PIX:', error.response?.data || error.message)
      throw new Error(error.response?.data?.message || 'Erro ao consultar cobrança PIX')
    }
  }

  /**
   * Lista cobranças PIX
   */
  async listPixCharges(params?: {
    inicio?: string
    fim?: string
    status?: 'ATIVA' | 'CONCLUIDA' | 'REMOVIDA_PELO_USUARIO_RECEBEDOR' | 'REMOVIDA_PELO_PSP'
  }): Promise<any> {
    try {
      const headers = await this.getAuthHeaders()

      const queryParams = new URLSearchParams()
      if (params?.inicio) queryParams.append('inicio', params.inicio)
      if (params?.fim) queryParams.append('fim', params.fim)
      if (params?.status) queryParams.append('status', params.status)

      const response = await this.client.get(
        `/banking/v2/cob?${queryParams.toString()}`,
        { headers }
      )

      return response.data

    } catch (error: any) {
      console.error('❌ Erro ao listar cobranças PIX:', error.response?.data || error.message)
      throw new Error(error.response?.data?.message || 'Erro ao listar cobranças PIX')
    }
  }

  // ========================================
  // PIX - ENVIAR
  // ========================================

  /**
   * Envia um PIX
   */
  async sendPix(params: SendPixRequest): Promise<SendPixResponse> {
    try {
      const headers = await this.getAuthHeaders()

      const response = await this.client.post(
        '/banking/v2/pix',
        params,
        { headers }
      )

      return response.data

    } catch (error: any) {
      console.error('❌ Erro ao enviar PIX:', error.response?.data || error.message)
      throw new Error(error.response?.data?.message || 'Erro ao enviar PIX')
    }
  }

  /**
   * Consulta um PIX enviado
   */
  async getPixSent(e2eId: string): Promise<any> {
    try {
      const headers = await this.getAuthHeaders()

      const response = await this.client.get(
        `/banking/v2/pix/${e2eId}`,
        { headers }
      )

      return response.data

    } catch (error: any) {
      console.error('❌ Erro ao consultar PIX enviado:', error.response?.data || error.message)
      throw new Error(error.response?.data?.message || 'Erro ao consultar PIX enviado')
    }
  }

  /**
   * Consulta chave PIX
   */
  async consultPixKey(key: string): Promise<any> {
    try {
      const headers = await this.getAuthHeaders()

      const response = await this.client.get(
        `/banking/v2/pix/consulta-chave/${encodeURIComponent(key)}`,
        { headers }
      )

      return response.data

    } catch (error: any) {
      console.error('❌ Erro ao consultar chave PIX:', error.response?.data || error.message)
      throw new Error(error.response?.data?.message || 'Chave PIX não encontrada')
    }
  }

  // ========================================
  // BOLETOS
  // ========================================

  /**
   * Cria um boleto
   */
  async createBoleto(params: BoletoRequest): Promise<BoletoResponse> {
    try {
      const headers = await this.getAuthHeaders()

      const response = await this.client.post(
        '/cobranca/v3/cobrancas',
        params,
        { headers }
      )

      return response.data

    } catch (error: any) {
      console.error('❌ Erro ao criar boleto:', error.response?.data || error.message)
      throw new Error(error.response?.data?.message || 'Erro ao criar boleto')
    }
  }

  /**
   * Consulta um boleto
   */
  async getBoleto(nossoNumero: string): Promise<BoletoResponse> {
    try {
      const headers = await this.getAuthHeaders()

      const response = await this.client.get(
        `/cobranca/v3/cobrancas/${nossoNumero}`,
        { headers }
      )

      return response.data

    } catch (error: any) {
      console.error('❌ Erro ao consultar boleto:', error.response?.data || error.message)
      throw new Error(error.response?.data?.message || 'Erro ao consultar boleto')
    }
  }

  /**
   * Cancela um boleto
   */
  async cancelBoleto(nossoNumero: string, motivoCancelamento: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders()

      await this.client.post(
        `/cobranca/v3/cobrancas/${nossoNumero}/cancelar`,
        { motivoCancelamento },
        { headers }
      )

    } catch (error: any) {
      console.error('❌ Erro ao cancelar boleto:', error.response?.data || error.message)
      throw new Error(error.response?.data?.message || 'Erro ao cancelar boleto')
    }
  }

  /**
   * Baixa um boleto (dar baixa manual)
   */
  async baixaBoleto(nossoNumero: string, motivoBaixa: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders()

      await this.client.post(
        `/cobranca/v3/cobrancas/${nossoNumero}/baixar`,
        { motivoBaixa },
        { headers }
      )

    } catch (error: any) {
      console.error('❌ Erro ao baixar boleto:', error.response?.data || error.message)
      throw new Error(error.response?.data?.message || 'Erro ao baixar boleto')
    }
  }

  /**
   * Obtém PDF do boleto
   */
  async getBoletoPDF(nossoNumero: string): Promise<Buffer> {
    try {
      const headers = await this.getAuthHeaders()

      const response = await this.client.get(
        `/cobranca/v3/cobrancas/${nossoNumero}/pdf`,
        { 
          headers,
          responseType: 'arraybuffer'
        }
      )

      return Buffer.from(response.data)

    } catch (error: any) {
      console.error('❌ Erro ao obter PDF do boleto:', error.response?.data || error.message)
      throw new Error('Erro ao obter PDF do boleto')
    }
  }

  // ========================================
  // UTILITÁRIOS
  // ========================================

  /**
   * Gera um txid único para PIX
   */
  private generateTxid(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let txid = ''
    for (let i = 0; i < 32; i++) {
      txid += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return txid
  }

  /**
   * Valida CPF
   */
  static validateCPF(cpf: string): boolean {
    cpf = cpf.replace(/[^\d]/g, '')
    
    if (cpf.length !== 11) return false
    if (/^(\d)\1+$/.test(cpf)) return false

    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i)
    }
    let digit = 11 - (sum % 11)
    if (digit >= 10) digit = 0
    if (digit !== parseInt(cpf.charAt(9))) return false

    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i)
    }
    digit = 11 - (sum % 11)
    if (digit >= 10) digit = 0
    if (digit !== parseInt(cpf.charAt(10))) return false

    return true
  }

  /**
   * Valida CNPJ
   */
  static validateCNPJ(cnpj: string): boolean {
    cnpj = cnpj.replace(/[^\d]/g, '')
    
    if (cnpj.length !== 14) return false
    if (/^(\d)\1+$/.test(cnpj)) return false

    let size = cnpj.length - 2
    let numbers = cnpj.substring(0, size)
    const digits = cnpj.substring(size)
    let sum = 0
    let pos = size - 7

    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--
      if (pos < 2) pos = 9
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
    if (result !== parseInt(digits.charAt(0))) return false

    size = size + 1
    numbers = cnpj.substring(0, size)
    sum = 0
    pos = size - 7

    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--
      if (pos < 2) pos = 9
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
    if (result !== parseInt(digits.charAt(1))) return false

    return true
  }

  /**
   * Formata valor para o padrão do Banco Inter
   */
  static formatAmount(amount: number): string {
    return amount.toFixed(2)
  }

  /**
   * Formata data para ISO 8601
   */
  static formatDate(date: Date): string {
    return date.toISOString()
  }
}

/**
 * Factory function para criar instância do Banco Inter
 */
export function createBancoInterClient(config: BancoInterConfig): BancoInterAPI {
  return new BancoInterAPI(config)
}
