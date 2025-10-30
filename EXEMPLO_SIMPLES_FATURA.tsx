/**
 * ========================================
 * EXEMPLO SIMPLES - Formulário de Fatura
 * ========================================
 * 
 * Este é um exemplo minimalista, sem dependências de UI libraries
 * Mostra apenas o essencial para resolver o problema de timezone
 */

import { useState, FormEvent } from 'react'

export function FormularioFaturaSimples() {
  const [nome, setNome] = useState('')
  const [valor, setValor] = useState('')
  const [data, setData] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // ✅ SOLUÇÃO: Usar a data exatamente como está
    // NÃO converter para Date object
    // NÃO usar toISOString()
    
    const payload = {
      nome: nome,
      valor: parseFloat(valor),
      data: data // ✅ "2025-11-20" - String pura, sem conversão!
    }

    console.log('📤 Payload:', payload)

    try {
      // Exemplo com fetch (substitua pela sua API)
      const response = await fetch('/api/faturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error('Erro ao salvar')

      alert('Fatura criada com sucesso!')
      
      // Limpar formulário
      setNome('')
      setValor('')
      setData('')
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao criar fatura')
    }
  }

  // Função auxiliar para exibir data em português
  const formatarData = (dataISO: string) => {
    if (!dataISO) return ''
    const [ano, mes, dia] = dataISO.split('-')
    return `${dia}/${mes}/${ano}`
  }

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
      <h2>Nova Fatura</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Nome */}
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="nome" style={{ display: 'block', marginBottom: '5px' }}>
            Nome do Cliente
          </label>
          <input
            id="nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            placeholder="Ex: João Silva"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>

        {/* Valor */}
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="valor" style={{ display: 'block', marginBottom: '5px' }}>
            Valor (R$)
          </label>
          <input
            id="valor"
            type="number"
            step="0.01"
            min="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            required
            placeholder="0.00"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>

        {/* Data - A PARTE MAIS IMPORTANTE! */}
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="data" style={{ display: 'block', marginBottom: '5px' }}>
            Data de Vencimento
          </label>
          <input
            id="data"
            type="date"
            value={data}
            onChange={(e) => {
              const novaData = e.target.value
              console.log('📅 Data selecionada:', novaData)
              setData(novaData)
            }}
            required
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
          {data && (
            <small style={{ color: 'green', marginTop: '5px', display: 'block' }}>
              ✅ Será salvo como: {formatarData(data)}
            </small>
          )}
        </div>

        {/* Preview do Payload */}
        {nome && valor && data && (
          <div
            style={{
              backgroundColor: '#f5f5f5',
              padding: '15px',
              borderRadius: '4px',
              marginBottom: '15px',
              border: '1px solid #ddd'
            }}
          >
            <strong style={{ fontSize: '12px' }}>📦 Payload que será enviado:</strong>
            <pre style={{ fontSize: '12px', marginTop: '10px', overflow: 'auto' }}>
{JSON.stringify({
  nome: nome,
  valor: parseFloat(valor),
  data: data // ✅ YYYY-MM-DD sem conversão
}, null, 2)}
            </pre>
          </div>
        )}

        {/* Botão */}
        <button
          type="submit"
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Criar Fatura
        </button>
      </form>

      {/* Explicação */}
      <div
        style={{
          marginTop: '30px',
          padding: '15px',
          backgroundColor: '#e7f3ff',
          borderRadius: '4px',
          border: '1px solid #b3d9ff'
        }}
      >
        <h3 style={{ marginTop: 0 }}>💡 Como funciona:</h3>
        <ol style={{ fontSize: '14px', lineHeight: '1.6' }}>
          <li>Você escolhe a data no input: <strong>20/11/2025</strong></li>
          <li>O input retorna: <code>"2025-11-20"</code></li>
          <li>Salvamos <strong>exatamente essa string</strong></li>
          <li>Banco armazena: <code>"2025-11-20"</code></li>
          <li>Exibimos: <strong>20/11/2025</strong></li>
        </ol>
        <p style={{ fontSize: '14px', marginBottom: 0 }}>
          <strong>✅ Sem mudança de dia!</strong> Funciona em qualquer timezone.
        </p>
      </div>
    </div>
  )
}

/**
 * ========================================
 * COMPARAÇÃO: ERRADO vs CORRETO
 * ========================================
 * 
 * ❌ ERRADO (causa mudança de dia):
 * 
 * const data = new Date(formData.data)
 * const dataISO = data.toISOString()
 * 
 * Input: "2025-11-20"
 * Resultado: "2025-11-19T03:00:00.000Z" (Brasil UTC-3)
 * ❌ Dia mudou de 20 para 19!
 * 
 * ✅ CORRETO (mantém o dia):
 * 
 * const dataEscolhida = formData.data
 * 
 * Input: "2025-11-20"
 * Resultado: "2025-11-20"
 * ✅ Dia permanece 20!
 * 
 * ========================================
 * BACKEND (Node.js/Express exemplo):
 * ========================================
 * 
 * app.post('/api/faturas', async (req, res) => {
 *   const { nome, valor, data } = req.body
 *   
 *   // ✅ data já vem como "2025-11-20"
 *   // Salvar direto no banco
 *   
 *   await db.query(
 *     'INSERT INTO faturas (nome, valor, data) VALUES ($1, $2, $3)',
 *     [nome, valor, data] // ✅ String YYYY-MM-DD
 *   )
 *   
 *   res.json({ success: true })
 * })
 * 
 * ========================================
 * BANCO DE DADOS (PostgreSQL):
 * ========================================
 * 
 * CREATE TABLE faturas (
 *   id SERIAL PRIMARY KEY,
 *   nome VARCHAR(255) NOT NULL,
 *   valor DECIMAL(10, 2) NOT NULL,
 *   data DATE NOT NULL  -- ✅ Tipo DATE (sem hora)
 * );
 * 
 * ⚠️ IMPORTANTE: Use DATE, não TIMESTAMP!
 */

export default FormularioFaturaSimples
