/**
 * ========================================
 * MODAL DE FATURA - SOLUÇÃO DEFINITIVA
 * ========================================
 * 
 * PROBLEMA:
 * Quando você escolhe 20/11/2025 no input, o sistema salva 19/11/2025
 * 
 * CAUSA:
 * O JavaScript converte a string para Date object considerando timezone.
 * No Brasil (UTC-3), "2025-11-20" vira "2025-11-19T21:00:00Z"
 * 
 * SOLUÇÃO:
 * NÃO usar new Date() nem toISOString()
 * Salvar a string YYYY-MM-DD diretamente
 */

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'

interface ModalFaturaSemTimezoneProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ModalFaturaSemTimezone({ isOpen, onClose, onSuccess }: ModalFaturaSemTimezoneProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    valor: '',
    data: '' // Formato: YYYY-MM-DD (do input type="date")
  })

  /**
   * ========================================
   * FUNÇÃO DE SALVAMENTO
   * ========================================
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // ✅ SOLUÇÃO: Usar a data EXATAMENTE como está
      // O input type="date" retorna "YYYY-MM-DD"
      // NÃO converter para Date object
      // NÃO usar toISOString()
      const dataEscolhida = formData.data // Ex: "2025-11-20"

      // ✅ Payload que será enviado ao banco
      const payload = {
        nome: formData.nome,
        valor: parseFloat(formData.valor),
        data: dataEscolhida // "2025-11-20" - SEM CONVERSÃO!
      }

      console.log('📤 Enviando para o banco:', payload)
      console.log('📅 Data escolhida pelo usuário:', formData.data)
      console.log('📅 Data que será salva:', dataEscolhida)
      console.log('✅ São iguais?', formData.data === dataEscolhida)

      // Salvar no Supabase
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          user_id: 'seu-user-id-aqui', // Substitua pelo ID real
          amount: payload.valor,
          due_date: payload.data, // ✅ String YYYY-MM-DD
          description: payload.nome,
          status: 'pending'
        })
        .select()

      if (error) throw error

      console.log('✅ Fatura salva com sucesso:', data)
      console.log('📅 Data salva no banco:', data[0]?.due_date)

      toast.success(
        'Fatura criada com sucesso!',
        `Data de vencimento: ${formatarDataBrasileira(payload.data)}`
      )

      // Limpar formulário
      setFormData({ nome: '', valor: '', data: '' })
      onSuccess()
    } catch (error: any) {
      console.error('❌ Erro ao criar fatura:', error)
      toast.error('Erro ao criar fatura', error.message)
    } finally {
      setLoading(false)
    }
  }

  /**
   * ========================================
   * FUNÇÃO AUXILIAR: Formatar Data
   * ========================================
   * Converte YYYY-MM-DD para DD/MM/YYYY
   */
  const formatarDataBrasileira = (dataISO: string): string => {
    if (!dataISO) return ''
    const [ano, mes, dia] = dataISO.split('-')
    return `${dia}/${mes}/${ano}`
  }

  /**
   * ========================================
   * VALIDAÇÃO DE DATA
   * ========================================
   */
  const validarData = (dataString: string): boolean => {
    // Verifica se está no formato YYYY-MM-DD
    const regex = /^\d{4}-\d{2}-\d{2}$/
    return regex.test(dataString)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Fatura (Sem Problema de Timezone)</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ========================================
              CAMPO: NOME DO CLIENTE
              ======================================== */}
          <div>
            <Label htmlFor="nome">Nome do Cliente</Label>
            <Input
              id="nome"
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
              placeholder="Ex: João Silva"
              className="mt-1"
            />
          </div>

          {/* ========================================
              CAMPO: VALOR
              ======================================== */}
          <div>
            <Label htmlFor="valor">Valor (R$)</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              min="0.01"
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              required
              placeholder="0.00"
              className="mt-1"
            />
          </div>

          {/* ========================================
              CAMPO: DATA (A PARTE MAIS IMPORTANTE!)
              ======================================== */}
          <div>
            <Label htmlFor="data">Data de Vencimento</Label>
            <Input
              id="data"
              type="date"
              value={formData.data}
              onChange={(e) => {
                const novaData = e.target.value
                console.log('📅 Data selecionada:', novaData)
                setFormData({ ...formData, data: novaData })
              }}
              required
              className="mt-1"
            />
            
            {/* Preview da data formatada */}
            {formData.data && validarData(formData.data) && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                <span>✅</span>
                <span>Será salvo como: {formatarDataBrasileira(formData.data)}</span>
              </p>
            )}
          </div>

          {/* ========================================
              PREVIEW DO PAYLOAD (PARA DEBUG)
              ======================================== */}
          {formData.nome && formData.valor && formData.data && (
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-semibold mb-2 text-slate-700 dark:text-slate-300">
                📦 Payload que será enviado:
              </p>
              <pre className="text-xs text-slate-600 dark:text-slate-400 overflow-x-auto">
{JSON.stringify({
  nome: formData.nome,
  valor: parseFloat(formData.valor),
  data: formData.data // ✅ YYYY-MM-DD sem conversão
}, null, 2)}
              </pre>
            </div>
          )}

          {/* ========================================
              BOTÕES DE AÇÃO
              ======================================== */}
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Criar Fatura'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/**
 * ========================================
 * EXPLICAÇÃO TÉCNICA DETALHADA
 * ========================================
 * 
 * ❌ O QUE NÃO FAZER (CAUSA O ERRO):
 * 
 * const data = new Date(formData.data)
 * // Input: "2025-11-20"
 * // JavaScript interpreta como: "2025-11-20T00:00:00" (meia-noite LOCAL)
 * // No Brasil (UTC-3): "2025-11-20T00:00:00-03:00"
 * 
 * const dataISO = data.toISOString()
 * // Converte para UTC: "2025-11-19T03:00:00.000Z"
 * // ❌ O DIA MUDOU DE 20 PARA 19!
 * 
 * ✅ O QUE FAZER (SOLUÇÃO):
 * 
 * const dataEscolhida = formData.data
 * // Input: "2025-11-20"
 * // Mantém como string: "2025-11-20"
 * // ✅ O DIA PERMANECE 20!
 * 
 * ========================================
 * FLUXO CORRETO:
 * ========================================
 * 
 * 1. Usuário escolhe no input: 20/11/2025
 * 2. Input retorna: "2025-11-20"
 * 3. Salvamos: "2025-11-20" (sem conversão)
 * 4. Banco armazena: "2025-11-20"
 * 5. Ao ler do banco: "2025-11-20"
 * 6. Exibimos: "20/11/2025"
 * 
 * ✅ SEM MUDANÇA DE DIA EM NENHUMA ETAPA!
 * 
 * ========================================
 * CONFIGURAÇÃO DO BANCO (IMPORTANTE):
 * ========================================
 * 
 * No PostgreSQL/Supabase, use o tipo DATE (não TIMESTAMP):
 * 
 * CREATE TABLE invoices (
 *   id UUID PRIMARY KEY,
 *   due_date DATE NOT NULL,  -- ✅ Tipo DATE (sem hora)
 *   ...
 * );
 * 
 * Se a coluna for TIMESTAMP, converta para DATE:
 * 
 * ALTER TABLE invoices 
 * ALTER COLUMN due_date TYPE DATE;
 * 
 * ========================================
 * CASO PRECISE DE ISO STRING COM HORA:
 * ========================================
 * 
 * Se o backend EXIGIR timestamp completo, use:
 * 
 * const dataComHoraMeioDia = `${formData.data}T12:00:00.000Z`
 * // "2025-11-20T12:00:00.000Z"
 * // Meio-dia UTC garante que o dia não mude em nenhum timezone
 * 
 * ========================================
 * TESTES:
 * ========================================
 * 
 * Teste 1: Escolher 20/11/2025
 * Esperado: Salvar "2025-11-20"
 * 
 * Teste 2: Escolher 01/01/2026
 * Esperado: Salvar "2026-01-01"
 * 
 * Teste 3: Escolher 31/12/2025
 * Esperado: Salvar "2025-12-31"
 * 
 * ========================================
 * FUNCIONA EM QUALQUER TIMEZONE:
 * ========================================
 * 
 * ✅ Brasil (UTC-3)
 * ✅ Portugal (UTC+0)
 * ✅ Japão (UTC+9)
 * ✅ Estados Unidos (UTC-5 a UTC-8)
 * ✅ Qualquer lugar do mundo!
 */
