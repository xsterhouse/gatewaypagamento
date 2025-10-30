import { useState } from 'react'
import { X, Bell, Calendar, Clock } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

interface ReminderModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function ReminderModal({ isOpen, onClose, onSuccess }: ReminderModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reminder_date: '',
    reminder_time: '09:00'
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

      // Combinar data e hora
      const reminderDateTime = new Date(`${formData.reminder_date}T${formData.reminder_time}:00`)

      // Inserir lembrete como uma ação tipo 'report' (ou criar novo tipo 'reminder')
      const { error } = await supabase
        .from('banking_calendar')
        .insert({
          user_id: session.user.id,
          action_type: 'report', // Usando report para lembretes gerais
          title: formData.title,
          description: formData.description,
          amount: 0,
          scheduled_date: reminderDateTime.toISOString(),
          status: 'pending',
          reminder_enabled: true,
          reminder_days_before: 0 // Lembrete no dia exato
        })

      if (error) throw error

      toast.success('Lembrete criado com sucesso!')
      
      // Limpar form
      setFormData({
        title: '',
        description: '',
        reminder_date: '',
        reminder_time: '09:00'
      })

      onSuccess?.()
      onClose()
    } catch (error: any) {
      console.error('Erro ao criar lembrete:', error)
      toast.error('Erro ao criar lembrete: ' + error.message)
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
        <Card className="bg-[#1a1f2e] border-gray-800 w-full max-w-md">
          <CardHeader className="border-b border-gray-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Bell size={24} className="text-yellow-500" />
                Criar Lembrete
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
                  Título do Lembrete *
                </label>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Reunião com cliente"
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="text-sm text-gray-400 mb-1 block">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalhes do lembrete..."
                  className="w-full bg-gray-800 border-gray-700 text-white rounded-lg p-3 min-h-[80px] resize-none"
                  rows={3}
                />
              </div>

              {/* Data e Hora */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block flex items-center gap-1">
                    <Calendar size={14} />
                    Data *
                  </label>
                  <Input
                    type="date"
                    value={formData.reminder_date}
                    onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1 block flex items-center gap-1">
                    <Clock size={14} />
                    Hora *
                  </label>
                  <Input
                    type="time"
                    value={formData.reminder_time}
                    onChange={(e) => setFormData({ ...formData, reminder_time: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
              </div>

              {/* Info */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-yellow-500 text-sm flex items-center gap-2">
                  <Bell size={16} />
                  Você será notificado na data e hora escolhidas
                </p>
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
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
                  disabled={loading}
                >
                  {loading ? 'Criando...' : 'Criar Lembrete'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
