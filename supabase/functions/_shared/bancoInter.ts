// Serviço de integração com API do Banco Inter
// Documentação: https://developers.bancointer.com.br/

interface BancoInterConfig {
  clientId: string
  clientSecret: string
  certificate: string
  certificateKey: string
  accountNumber: string
}

interface PixPaymentRequest {
  valor: number
  chave: string
  tipoChave: 'CPF' | 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'EVP'
  descricao?: string
}

interface PixPaymentResponse {
  endToEndId: string
  txid: string
  valor: number
  horario: string
  status: string
}

export class BancoInterService {
  private config: BancoInterConfig
  private baseUrl = 'https://cdpj.partners.bancointer.com.br'
  private accessToken: string | null = null
  private tokenExpiry: number = 0

  constructor(config: BancoInterConfig) {
    this.config = config
  }

  /**
   * Obtém token de acesso OAuth2
   */
  async getAccessToken(): Promise<string> {
    // Verificar se token ainda é válido
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    const credentials = btoa(`${this.config.clientId}:${this.config.clientSecret}`)
    
    const response = await fetch(`${this.baseUrl}/oauth/v2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'pix-pagamento.write pix-pagamento.read'
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Erro ao obter token: ${error}`)
    }

    const data = await response.json()
    this.accessToken = data.access_token
    // Token expira em 3600s (1h), renovar 5min antes
    this.tokenExpiry = Date.now() + ((data.expires_in - 300) * 1000)
    
    if (!this.accessToken) {
      throw new Error('Token de acesso não foi retornado pela API')
    }
    
    return this.accessToken
  }

  /**
   * Envia pagamento PIX
   */
  async sendPixPayment(payment: PixPaymentRequest): Promise<PixPaymentResponse> {
    const token = await this.getAccessToken()

    // Mapear tipo de chave para formato do Banco Inter
    const tipoChaveMap: Record<string, string> = {
      'CPF': 'CPF',
      'CNPJ': 'CNPJ',
      'EMAIL': 'EMAIL',
      'TELEFONE': 'PHONE',
      'EVP': 'EVP'
    }

    const payload = {
      valor: payment.valor.toFixed(2),
      destinatario: {
        tipo: tipoChaveMap[payment.tipoChave] || 'CPF',
        chave: payment.chave
      },
      descricao: payment.descricao || 'Saque PIX'
    }

    console.log('📤 Enviando PIX via Banco Inter:', payload)

    const response = await fetch(`${this.baseUrl}/banking/v2/pix`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-conta-corrente': this.config.accountNumber
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ Erro ao enviar PIX:', error)
      throw new Error(`Erro ao enviar PIX: ${response.status} - ${error}`)
    }

    const result = await response.json()
    console.log('✅ PIX enviado com sucesso:', result)
    
    return {
      endToEndId: result.endToEndId || result.e2eId,
      txid: result.txid,
      valor: parseFloat(result.valor),
      horario: result.horario || new Date().toISOString(),
      status: result.status || 'REALIZADO'
    }
  }

  /**
   * Consulta status de um pagamento PIX
   */
  async getPixPaymentStatus(endToEndId: string): Promise<any> {
    const token = await this.getAccessToken()

    const response = await fetch(
      `${this.baseUrl}/banking/v2/pix/${endToEndId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-conta-corrente': this.config.accountNumber
        }
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Erro ao consultar PIX: ${error}`)
    }

    return await response.json()
  }

  /**
   * Lista pagamentos PIX realizados
   */
  async listPixPayments(dataInicio: string, dataFim: string): Promise<any[]> {
    const token = await this.getAccessToken()

    const response = await fetch(
      `${this.baseUrl}/banking/v2/pix?dataInicio=${dataInicio}&dataFim=${dataFim}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-conta-corrente': this.config.accountNumber
        }
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Erro ao listar PIX: ${error}`)
    }

    const data = await response.json()
    return data.pagamentos || []
  }
}
