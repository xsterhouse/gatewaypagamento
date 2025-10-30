/**
 * ✅ EXEMPLO COMPLETO: Modal de Fatura SEM Problemas de Timezone
 * 
 * Este exemplo mostra como criar uma fatura onde a data escolhida
 * é EXATAMENTE a data salva, sem adiantar ou atrasar um dia.
 */

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'
import { convertDateToISO } from '@/lib/dateUtils'

interface ModalFaturaProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ModalFaturaSemTimezone({ isOpen, onClose, onSuccess }: ModalFaturaProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    valor: '',
    data: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // ✅ SOLUÇÃO: Usar a data exatamente como está (YYYY-MM-DD)
      // NÃO converter para Date object
      // NÃO adicionar horário
      const dataFormatada = convertDateToISO(formData.data)
      
      // Payload que será enviado ao banco
      const payload = {
        nome: formData.nome,
        valor: parseFloat(formData.valor),
        data: dataFormatada // "2025-11-20" (sem hora, sem timezone)
      }

      console.log('📤 Enviando para o banco:', payload)
      
      // Salvar no banco (exemplo com Supabase)
      const { error } = await supabase
        .from('faturas')
        .insert(payload)

      if (error) throw error

      toast.success('Fatura criada com sucesso!', `Data: ${formatarDataBrasileira(dataFormatada)}`)
      
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

  // Função auxiliar para exibir data em português
  const formatarDataBrasileira = (dataISO: string): string => {
    const [ano, mes, dia] = dataISO.split('-')
    return `${dia}/${mes}/${ano}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Fatura (Sem Problema de Timezone)</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome do Cliente */}
          <div>
            <Label htmlFor="nome">Nome do Cliente</Label>
            <Input
              id="nome"
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
              placeholder="Ex: João Silva"
            />
          </div>

          {/* Valor */}
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
            />
          </div>

          {/* Data - A PARTE MAIS IMPORTANTE! */}
          <div>
            <Label htmlFor="data">Data de Vencimento</Label>
            <Input
              id="data"
              type="date"
              value={formData.data}
              onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              required
            />
            {formData.data && (
              <p className="text-xs text-muted-foreground mt-1">
                ✅ Será salvo como: {formatarDataBrasileira(formData.data)}
              </p>
            )}
          </div>

          {/* Preview do Payload */}
          {formData.nome && formData.valor && formData.data && (
            <div className="bg-muted p-3 rounded-md">
              <p className="text-xs font-semibold mb-2">📦 Payload que será enviado:</p>
              <pre className="text-xs">
{JSON.stringify({
  nome: formData.nome,
  valor: parseFloat(formData.valor),
  data: formData.data // YYYY-MM-DD sem hora
}, null, 2)}
              </pre>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Criar Fatura'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/**
 * 📚 EXPLICAÇÃO TÉCNICA
 * 
 * ❌ O QUE NÃO FAZER:
 * 
 * const data = new Date(formData.data) // ❌ ERRADO!
 * // Isso converte para timezone local e pode mudar o dia
 * 
 * const dataISO = data.toISOString() // ❌ ERRADO!
 * // Resultado: "2025-11-19T03:00:00.000Z" (dia mudou!)
 * 
 * ✅ O QUE FAZER:
 * 
 * const dataFormatada = formData.data // ✅ CORRETO!
 * // Resultado: "2025-11-20" (exatamente como o usuário escolheu)
 * 
 * 🎯 RESULTADO:
 * 
 * Usuário escolhe: 20/11/2025
 * Input retorna: "2025-11-20"
 * Salvamos: "2025-11-20"
 * Banco armazena: "2025-11-20"
 * Exibimos: "20/11/2025"
 * 
 * ✅ SEM MUDANÇA DE DIA!
 * 
 * 💡 DICA EXTRA:
 * 
 * Se o banco de dados exigir timestamp completo, use:
 * const dataComHora = `${formData.data}T00:00:00` // Meia-noite local
 * 
 * Mas o ideal é usar apenas DATE no banco (sem hora).
 */
