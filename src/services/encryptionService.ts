// ========================================
// SERVIÇO DE CRIPTOGRAFIA
// ========================================
// Para criptografar dados sensíveis como client_secret

class EncryptionService {
  private algorithm = 'AES-GCM'
  private keyLength = 256

  /**
   * Gerar chave de criptografia a partir de senha
   */
  private async deriveKey(password: string, salt: BufferSource): Promise<CryptoKey> {
    const encoder = new TextEncoder()
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    )

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations: 100000,
        hash: 'SHA-256'
      },
      passwordKey,
      { name: this.algorithm, length: this.keyLength },
      false,
      ['encrypt', 'decrypt']
    )
  }

  /**
   * Criptografar texto
   */
  async encrypt(plaintext: string, password: string): Promise<string> {
    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(plaintext)

      // Gerar salt e IV aleatórios
      const salt = crypto.getRandomValues(new Uint8Array(16))
      const iv = crypto.getRandomValues(new Uint8Array(12))

      // Derivar chave
      const key = await this.deriveKey(password, salt)

      // Criptografar
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        data
      )

      // Combinar salt + iv + dados criptografados
      const combined = new Uint8Array(
        salt.length + iv.length + encryptedData.byteLength
      )
      combined.set(salt, 0)
      combined.set(iv, salt.length)
      combined.set(new Uint8Array(encryptedData), salt.length + iv.length)

      // Converter para base64
      return this.arrayBufferToBase64(combined)
    } catch (error) {
      console.error('Erro ao criptografar:', error)
      throw new Error('Falha na criptografia')
    }
  }

  /**
   * Descriptografar texto
   */
  async decrypt(encryptedText: string, password: string): Promise<string> {
    try {
      // Converter de base64
      const combined = this.base64ToArrayBuffer(encryptedText)

      // Extrair salt, IV e dados criptografados
      const salt = combined.slice(0, 16)
      const iv = combined.slice(16, 28)
      const encryptedData = combined.slice(28)

      // Derivar chave
      const key = await this.deriveKey(password, salt)

      // Descriptografar
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        encryptedData
      )

      // Converter para string
      const decoder = new TextDecoder()
      return decoder.decode(decryptedData)
    } catch (error) {
      console.error('Erro ao descriptografar:', error)
      throw new Error('Falha na descriptografia')
    }
  }

  /**
   * Gerar hash SHA-256 de um texto
   */
  async hash(text: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    return this.arrayBufferToBase64(new Uint8Array(hashBuffer))
  }

  /**
   * Verificar se um texto corresponde a um hash
   */
  async verifyHash(text: string, hash: string): Promise<boolean> {
    const textHash = await this.hash(text)
    return textHash === hash
  }

  /**
   * Gerar token aleatório seguro
   */
  generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Converter ArrayBuffer para Base64
   */
  private arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = ''
    const len = buffer.byteLength
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(buffer[i])
    }
    return btoa(binary)
  }

  /**
   * Converter Base64 para ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): Uint8Array {
    const binary = atob(base64)
    const len = binary.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }

  /**
   * Mascarar dados sensíveis para exibição
   */
  maskSensitiveData(data: string, visibleChars: number = 4): string {
    if (!data || data.length <= visibleChars) {
      return '****'
    }
    const masked = '*'.repeat(data.length - visibleChars)
    return masked + data.slice(-visibleChars)
  }

  /**
   * Validar força de senha
   */
  validatePasswordStrength(password: string): {
    valid: boolean
    score: number
    feedback: string[]
  } {
    const feedback: string[] = []
    let score = 0

    // Comprimento mínimo
    if (password.length >= 8) {
      score += 1
    } else {
      feedback.push('Senha deve ter no mínimo 8 caracteres')
    }

    // Letras maiúsculas
    if (/[A-Z]/.test(password)) {
      score += 1
    } else {
      feedback.push('Adicione letras maiúsculas')
    }

    // Letras minúsculas
    if (/[a-z]/.test(password)) {
      score += 1
    } else {
      feedback.push('Adicione letras minúsculas')
    }

    // Números
    if (/[0-9]/.test(password)) {
      score += 1
    } else {
      feedback.push('Adicione números')
    }

    // Caracteres especiais
    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1
    } else {
      feedback.push('Adicione caracteres especiais')
    }

    // Comprimento extra
    if (password.length >= 12) {
      score += 1
    }

    return {
      valid: score >= 4,
      score: Math.min(score, 5),
      feedback: feedback
    }
  }
}

// Exportar instância única
export const encryptionService = new EncryptionService()

// ========================================
// EXEMPLO DE USO:
// ========================================
/*
// Criptografar client_secret antes de salvar
const encrypted = await encryptionService.encrypt(
  clientSecret, 
  process.env.ENCRYPTION_KEY || 'default-key'
)

// Salvar no banco
await supabase.from('bank_acquirers').insert({
  client_secret: encrypted
})

// Descriptografar ao usar
const decrypted = await encryptionService.decrypt(
  acquirer.client_secret,
  process.env.ENCRYPTION_KEY || 'default-key'
)

// Mascarar para exibição
const masked = encryptionService.maskSensitiveData(clientSecret)
// Resultado: "****xyz123"
*/
