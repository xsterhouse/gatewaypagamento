import { useState } from 'react'
import { X, Calendar, DollarSign, FileText, Tag, Bell } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

interface SchedulePaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function SchedulePaymentModal({ isOpen, onClose, onSuccess }: SchedulePaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    scheduled_date: '',
    category: '',
    is_recurring: false,
    recurrence_type: 'monthly',
    reminder_enabled: true,
    reminder_days_before: 1
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Você precisa estar logado')
        return
      }

      // Inserir na tabela banking_calendar
      const { error } = await supabase
        .from('banking_calendar')
        .insert({
          user_id: session.user.id,
          action_type: 'payment',
          title: formData.title,
          description: formData.description,
          amount: parseFloat(formData.amount),
          scheduled_date: new Date(formData.scheduled_date).toISOString(),
          status: 'scheduled',
          category: formData.category,
          is_recurring: formData.is_recurring,
          recurrence_type: formData.is_recurring ? formData.recurrence_type : null,
          reminder_enabled: formData.reminder_enabled,
          reminder_days_before: formData.reminder_days_before
        })

      if (error) throw error

      toast.success('Pagamento agendado com sucesso!')
      
      // Limpar form
      setFormData({
        title: '',
        description: '',
        amount: '',
        scheduled_date: '',
        category: '',
        is_recurring: false,
        recurrence_type: 'monthly',
        reminder_enabled: true,
        reminder_days_before: 1
      })

      onSuccess?.()
      onClose()
    } catch (error: any) {
      console.error('Erro ao agendar pagamento:', error)
      toast.error('Erro ao agendar pagamento: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="bg-[#1a1f2e] border-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <CardHeader className="border-b border-gray-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign size={24} className="text-primary" />
                Agendar Pagamento
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Título */}
              <div>
                <label className="text-sm text-gray-400 mb-1 block">
                  Título *
                </label>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Pagamento Fornecedor XYZ"
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="text-sm text-gray-400 mb-1 block flex items-center gap-1">
                  <FileText size={14} />
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalhes do pagamento..."
                  className="w-full bg-gray-800 border-gray-700 text-white rounded-lg p-3 min-h-[80px] resize-none"
                  rows={3}
                />
              </div>

              {/* Valor e Data */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block flex items-center gap-1">
                    <DollarSign size={14} />
                    Valor *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0,00"
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1 block flex items-center gap-1">
                    <Calendar size={14} />
                    Data *
                  </label>
                  <Input
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
              </div>

              {/* Categoria */}
              <div>
                <label className="text-sm text-gray-400 mb-1 block flex items-center gap-1">
                  <Tag size={14} />
                  Categoria
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-gray-800 border-gray-700 text-white rounded-lg p-2.5"
                >
                  <option value="">Selecione...</option>
                  <option value="fornecedor">Fornecedor</option>
                  <option value="salario">Salário</option>
                  <option value="imposto">Imposto</option>
                  <option value="conta">Conta</option>
                  <option value="servico">Serviço</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              {/* Pagamento Recorrente */}
              <div className="bg-gray-800/30 p-4 rounded-lg space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_recurring}
                    onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-primary"
                  />
                  <span className="text-white text-sm">Pagamento recorrente</span>
                </label>

                {formData.is_recurring && (
                  <select
                    value={formData.recurrence_type}
                    onChange={(e) => setFormData({ ...formData, recurrence_type: e.target.value })}
                    className="w-full bg-gray-800 border-gray-700 text-white rounded-lg p-2.5"
                  >
                    <option value="daily">Diário</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                    <option value="yearly">Anual</option>
                  </select>
                )}
              </div>

              {/* Lembrete */}
              <div className="bg-gray-800/30 p-4 rounded-lg space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.reminder_enabled}
                    onChange={(e) => setFormData({ ...formData, reminder_enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-primary"
                  />
                  <span className="text-white text-sm flex items-center gap-1">
                    <Bell size={14} />
                    Ativar lembrete
                  </span>
                </label>

                {formData.reminder_enabled && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Lembrar</span>
                    <Input
                      type="number"
                      min="1"
                      max="30"
                      value={formData.reminder_days_before}
                      onChange={(e) => setFormData({ ...formData, reminder_days_before: parseInt(e.target.value) })}
                      className="bg-gray-800 border-gray-700 text-white w-20"
                    />
                    <span className="text-gray-400 text-sm">dias antes</span>
                  </div>
                )}
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90"
                  disabled={loading}
                >
                  {loading ? 'Agendando...' : 'Agendar Pagamento'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
