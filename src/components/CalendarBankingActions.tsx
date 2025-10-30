import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, X, Clock, TrendingUp, DollarSign, RefreshCw, FileText, AlertCircle, Check, Ban, Plus } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { SchedulePaymentModal } from './SchedulePaymentModal'
import { ReminderModal } from './ReminderModal'
import { exportBankingCalendarToPDF } from '@/utils/exportPDF'

interface CalendarBankingActionsProps {
  isOpen: boolean
  onClose: () => void
}

interface BankingAction {
  id: string
  action_type: string
  title: string
  description: string
  amount: number
  scheduled_date: string
  status: string
  category?: string
}

export function CalendarBankingActions({ isOpen, onClose }: CalendarBankingActionsProps) {
  const navigate = useNavigate()
  const [pendingActions, setPendingActions] = useState<BankingAction[]>([])
  const [loading, setLoading] = useState(true)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadActions()
    }
  }, [isOpen])

  const loadActions = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase
        .from('banking_calendar')
        .select('*')
        .eq('user_id', session.user.id)
        .in('status', ['pending', 'scheduled', 'urgent'])
        .order('scheduled_date', { ascending: true })
        .limit(10)

      if (error) throw error
      setPendingActions(data || [])
    } catch (error) {
      console.error('Erro ao carregar ações:', error)
      toast.error('Erro ao carregar agenda bancária')
    } finally {
      setLoading(false)
    }
  }

  const executeAction = async (actionId: string) => {
    try {
      const { error } = await supabase
        .from('banking_calendar')
        .update({ 
          status: 'executed',
          executed_at: new Date().toISOString()
        })
        .eq('id', actionId)

      if (error) throw error

      toast.success('Ação marcada como executada!')
      loadActions()
    } catch (error) {
      console.error('Erro ao executar ação:', error)
      toast.error('Erro ao executar ação')
    }
  }

  const cancelAction = async (actionId: string) => {
    try {
      const { error } = await supabase
        .from('banking_calendar')
        .update({ status: 'cancelled' })
        .eq('id', actionId)

      if (error) throw error

      toast.success('Ação cancelada!')
      loadActions()
    } catch (error) {
      console.error('Erro ao cancelar ação:', error)
      toast.error('Erro ao cancelar ação')
    }
  }

  if (!isOpen) return null

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Pendente</Badge>,
      scheduled: <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Agendado</Badge>,
      urgent: <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Urgente</Badge>,
      info: <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Info</Badge>,
    }
    return badges[status as keyof typeof badges]
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date)
  }

  const getIconForType = (type: string) => {
    const icons = {
      payment: DollarSign,
      deposit: TrendingUp,
      recurring: RefreshCw,
      deadline: AlertCircle,
      report: FileText
    }
    return icons[type as keyof typeof icons] || DollarSign
  }

  const getColorForType = (type: string) => {
    const colors = {
      payment: 'text-blue-500',
      deposit: 'text-green-500',
      recurring: 'text-purple-500',
      deadline: 'text-red-500',
      report: 'text-yellow-500'
    }
    return colors[type as keyof typeof colors] || 'text-gray-500'
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className="fixed right-4 top-20 w-full max-w-md z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="bg-[#1a1f2e] border-gray-800 shadow-2xl">
          <CardHeader className="border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="text-primary" size={24} />
                <CardTitle className="text-white">
                  Agenda Bancária
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </Button>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              Próximas ações e compromissos financeiros
            </p>
          </CardHeader>

          <CardContent className="p-0">
            {/* Resumo Rápido */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-800/30">
              <div className="text-center">
                <p className="text-gray-400 text-xs mb-1">Ações Pendentes</p>
                <p className="text-white text-2xl font-bold">
                  {loading ? '...' : pendingActions.filter((a: BankingAction) => a.status === 'pending' || a.status === 'urgent').length}
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-xs mb-1">Total Agendado</p>
                <p className="text-white text-2xl font-bold">
                  {loading ? '...' : formatCurrency(pendingActions.reduce((sum: number, a: BankingAction) => sum + Number(a.amount || 0), 0))}
                </p>
              </div>
            </div>

            {/* Lista de Ações */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-400">Carregando...</div>
              ) : pendingActions.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  Nenhuma ação pendente
                </div>
              ) : (
                pendingActions.map((action: BankingAction) => {
                  const Icon = getIconForType(action.action_type)
                  const color = getColorForType(action.action_type)
                  
                  return (
                    <div
                      key={action.id}
                      className="p-4 border-b border-gray-800 hover:bg-gray-800/30 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0 ${color}`}>
                          <Icon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="text-white font-medium text-sm">
                              {action.title}
                            </h4>
                            {getStatusBadge(action.status)}
                          </div>
                          <p className="text-gray-400 text-xs mb-2">
                            {action.description || 'Sem descrição'}
                          </p>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1 text-gray-500 text-xs">
                              <Clock size={12} />
                              {formatDate(action.scheduled_date)}
                            </div>
                            {action.amount > 0 && (
                              <span className={`text-sm font-semibold ${
                                action.action_type === 'deposit' ? 'text-green-400' : 'text-blue-400'
                              }`}>
                                {formatCurrency(Number(action.amount))}
                              </span>
                            )}
                          </div>
                          
                          {/* Botões de Ação */}
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
                              onClick={(e) => {
                                e.stopPropagation()
                                executeAction(action.id)
                              }}
                            >
                              <Check size={14} className="mr-1" />
                              Executar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                              onClick={(e) => {
                                e.stopPropagation()
                                cancelAction(action.id)
                              }}
                            >
                              <Ban size={14} className="mr-1" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Ações Rápidas */}
            <div className="p-4 border-t border-gray-800 bg-gray-800/20">
              <p className="text-gray-400 text-xs mb-3">Ações Rápidas</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:border-primary transition-all"
                  onClick={() => setIsScheduleModalOpen(true)}
                >
                  <Plus size={14} className="mr-1" />
                  Agendar Pagamento
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:border-primary transition-all"
                  onClick={() => {
                    onClose()
                    navigate('/calendar')
                  }}
                >
                  Ver Calendário
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:border-primary transition-all"
                  onClick={() => setIsReminderModalOpen(true)}
                >
                  Lembretes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:border-primary transition-all"
                  onClick={exportBankingCalendarToPDF}
                >
                  Exportar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Modal de Agendamento */}
      <SchedulePaymentModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSuccess={loadActions}
      />
      
      {/* Modal de Lembretes */}
      <ReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        onSuccess={loadActions}
      />
    </>
  )
}
