import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  DollarSign,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  FileText,
  Plus
} from 'lucide-react'
import { SchedulePaymentModal } from '@/components/SchedulePaymentModal'

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

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  actions: BankingAction[]
}

export function FullCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [actions, setActions] = useState<BankingAction[]>([])
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActions()
  }, [currentDate])

  const loadActions = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      const { data, error } = await supabase
        .from('banking_calendar')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('scheduled_date', startOfMonth.toISOString())
        .lte('scheduled_date', endOfMonth.toISOString())
        .order('scheduled_date', { ascending: true })

      if (error) throw error
      setActions(data || [])
    } catch (error) {
      console.error('Erro ao carregar ações:', error)
      toast.error('Erro ao carregar calendário')
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = (): CalendarDay[] => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days: CalendarDay[] = []
    
    // Dias do mês anterior
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i)
      days.push({
        date,
        isCurrentMonth: false,
        actions: []
      })
    }
    
    // Dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayActions = actions.filter(action => {
        const actionDate = new Date(action.scheduled_date).toISOString().split('T')[0]
        return actionDate === dateStr
      })
      
      days.push({
        date,
        isCurrentMonth: true,
        actions: dayActions
      })
    }
    
    // Dias do próximo mês
    const remainingDays = 42 - days.length // 6 semanas * 7 dias
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day)
      days.push({
        date,
        isCurrentMonth: false,
        actions: []
      })
    }
    
    return days
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
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
      payment: 'bg-blue-500',
      deposit: 'bg-green-500',
      recurring: 'bg-purple-500',
      deadline: 'bg-red-500',
      report: 'bg-yellow-500'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-500'
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const days = getDaysInMonth()
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Calendário Bancário</h1>
          <p className="text-gray-400">Visualize todas as suas ações financeiras</p>
        </div>
        <Button
          onClick={() => setIsScheduleModalOpen(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus size={16} className="mr-2" />
          Agendar Pagamento
        </Button>
      </div>

      {/* Controles do Calendário */}
      <Card className="bg-[#1a1f2e] border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={previousMonth}
                className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
              >
                <ChevronLeft size={20} />
              </Button>
              <h2 className="text-xl font-semibold text-white capitalize min-w-[200px] text-center">
                {monthName}
              </h2>
              <Button
                variant="outline"
                size="icon"
                onClick={nextMonth}
                className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
              >
                <ChevronRight size={20} />
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={goToToday}
              className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
            >
              <CalendarIcon size={16} className="mr-2" />
              Hoje
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="p-12 text-center text-gray-400">
              Carregando calendário...
            </div>
          ) : (
            <>
              {/* Dias da Semana */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {weekDays.map(day => (
                  <div
                    key={day}
                    className="text-center text-sm font-semibold text-gray-400 py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Grid do Calendário */}
              <div className="grid grid-cols-7 gap-2">
                {days.map((day, index) => {
                  const isToday = 
                    day.date.toDateString() === new Date().toDateString()
                  
                  return (
                    <div
                      key={index}
                      className={`min-h-[100px] p-2 border rounded-lg transition-colors cursor-pointer ${
                        day.isCurrentMonth
                          ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
                          : 'bg-gray-900/30 border-gray-800/50'
                      } ${isToday ? 'ring-2 ring-primary' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-sm font-medium ${
                            day.isCurrentMonth ? 'text-white' : 'text-gray-600'
                          } ${isToday ? 'text-primary font-bold' : ''}`}
                        >
                          {day.date.getDate()}
                        </span>
                        {day.actions.length > 0 && (
                          <Badge
                            variant="secondary"
                            className="text-xs px-1 py-0"
                          >
                            {day.actions.length}
                          </Badge>
                        )}
                      </div>

                      {/* Ações do Dia */}
                      <div className="space-y-1">
                        {day.actions.slice(0, 2).map(action => {
                          const Icon = getIconForType(action.action_type)
                          const color = getColorForType(action.action_type)
                          
                          return (
                            <div
                              key={action.id}
                              className={`${color} bg-opacity-20 rounded px-1.5 py-1 text-xs`}
                              title={`${action.title} - ${formatCurrency(action.amount)}`}
                            >
                              <div className="flex items-center gap-1">
                                <Icon size={10} className="flex-shrink-0" />
                                <span className="truncate text-white">
                                  {action.title}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                        {day.actions.length > 2 && (
                          <div className="text-xs text-gray-400 pl-1">
                            +{day.actions.length - 2} mais
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Legenda */}
      <Card className="bg-[#1a1f2e] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Legenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span className="text-sm text-gray-400">Pagamento</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-sm text-gray-400">Depósito</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-purple-500"></div>
              <span className="text-sm text-gray-400">Recorrente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span className="text-sm text-gray-400">Vencimento</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500"></div>
              <span className="text-sm text-gray-400">Relatório</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Agendamento */}
      <SchedulePaymentModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSuccess={loadActions}
      />
    </div>
  )
}
