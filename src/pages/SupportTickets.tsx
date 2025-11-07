import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Send,
  User
} from 'lucide-react'

interface Ticket {
  id: string
  protocol_number: string
  user_id: string
  user_name: string
  user_email: string
  subject: string
  message: string
  status: string
  priority: string
  created_at: string
  responses_count: number
  attachment_url?: string
  attachment_name?: string
}

interface TicketResponse {
  id: string
  message: string
  is_admin: boolean
  user_name: string
  created_at: string
  attachment_url?: string
  attachment_name?: string
}

export function SupportTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [responses, setResponses] = useState<TicketResponse[]>([])
  const [newResponse, setNewResponse] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('open')

  useEffect(() => {
    loadTickets()
  }, [filter])

  useEffect(() => {
    if (selectedTicket) {
      loadResponses(selectedTicket.id)
    }
  }, [selectedTicket])

  const loadTickets = async () => {
    try {
      let query = supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao carregar tickets:', error)
        throw error
      }

      // Processar tickets com contagem de respostas e nomes de usuários

      // Buscar nomes de usuários
      const userIds = [...new Set(data?.map(t => t.user_id).filter(Boolean))]
      let usersMap = new Map()
      
      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', userIds)
        
        usersData?.forEach(user => {
          usersMap.set(user.id, { name: user.name, email: user.email })
        })
      }

      // Contar mensagens de cada ticket
      const ticketsWithCounts = await Promise.all(
        (data || []).map(async (ticket) => {
          const { count } = await supabase
            .from('ticket_messages')
            .select('*', { count: 'exact', head: true })
            .eq('ticket_id', ticket.id)

          const user = usersMap.get(ticket.user_id)
          return {
            id: ticket.id,
            protocol_number: ticket.protocol_number,
            user_id: ticket.user_id,
            user_name: user?.name || 'Desconhecido',
            user_email: user?.email || '',
            subject: ticket.subject,
            message: ticket.message,
            status: ticket.status,
            priority: ticket.priority,
            created_at: ticket.created_at,
            responses_count: count || 0,
            attachment_url: ticket.attachment_url,
            attachment_name: ticket.attachment_name,
          }
        })
      )

      setTickets(ticketsWithCounts)
    } catch (error) {
      console.error('Erro ao carregar tickets:', error)
      toast.error('Erro ao carregar tickets')
    } finally {
      setLoading(false)
    }
  }

  const loadResponses = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Erro ao carregar respostas:', error)
        throw error
      }

      // Buscar nomes de usuários
      const userIds = [...new Set(data?.map(r => r.user_id).filter(Boolean))]
      let usersMap = new Map()
      
      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, name')
          .in('id', userIds)
        
        usersData?.forEach(user => {
          usersMap.set(user.id, user.name)
        })
      }

      const formatted = (data || []).map(r => ({
        id: r.id,
        message: r.message,
        is_admin: r.is_admin,
        user_name: usersMap.get(r.user_id) || 'Desconhecido',
        created_at: r.created_at,
      }))

      setResponses(formatted)
    } catch (error) {
      console.error('Erro ao carregar respostas:', error)
      toast.error('Erro ao carregar respostas')
    }
  }

  const handleSendResponse = async () => {
    console.log('handleSendResponse chamada')
    console.log('selectedTicket:', selectedTicket)
    console.log('newResponse:', newResponse)
    
    if (!selectedTicket || !newResponse.trim()) {
      console.log('Retornando: ticket ou mensagem vazia')
      return
    }

    setSending(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Sessão:', session?.user?.id)
      
      if (!session?.user) throw new Error('Não autenticado')

      console.log('Tentando inserir mensagem...')
      
      // Inserir mensagem no chat
      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: selectedTicket.id,
          user_id: session.user.id,
          message: newResponse,
          is_admin: true,
        })

      if (error) {
        console.error('Erro ao inserir:', error)
        throw error
      }
      
      console.log('Resposta inserida com sucesso!')

      // Atualizar status do ticket para "in_progress"
      if (selectedTicket.status === 'open') {
        await supabase
          .from('support_tickets')
          .update({ 
            status: 'in_progress',
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedTicket.id)
      }

      toast.success('Resposta enviada!')
      setNewResponse('')
      loadResponses(selectedTicket.id)
      loadTickets()
    } catch (error) {
      console.error('Erro ao enviar resposta:', error)
      toast.error('Erro ao enviar resposta')
    } finally {
      setSending(false)
    }
  }

  const handleChangeStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)

      if (error) throw error

      toast.success('Status atualizado!')
      loadTickets()
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus })
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs">
            <Clock size={12} />
            Aberto
          </span>
        )
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs">
            <AlertCircle size={12} />
            Em Andamento
          </span>
        )
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs">
            <CheckCircle size={12} />
            Resolvido
          </span>
        )
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-500/10 text-muted-foreground text-xs">
            Fechado
          </span>
        )
      default:
        return null
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-4 border-red-500'
      case 'high':
        return 'border-l-4 border-orange-500'
      case 'normal':
        return 'border-l-4 border-blue-500'
      case 'low':
        return 'border-l-4 border-gray-500'
      default:
        return ''
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Tickets de Suporte</h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1">Gerencie solicitações dos clientes</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'open', 'in_progress', 'resolved'].map((f) => (
          <Button
            key={f}
            onClick={() => setFilter(f as any)}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            className={filter === f ? 'bg-primary' : 'border-border'}
          >
            {f === 'all' && 'Todos'}
            {f === 'open' && 'Abertos'}
            {f === 'in_progress' && 'Em Andamento'}
            {f === 'resolved' && 'Resolvidos'}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Tickets */}
        <div className="lg:col-span-1 space-y-3">
          {tickets.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Nenhum ticket encontrado</p>
              </CardContent>
            </Card>
          ) : (
            tickets.map((ticket) => (
              <Card
                key={ticket.id}
                className={`bg-card border-border cursor-pointer hover:bg-[#1f2533] transition-colors ${
                  selectedTicket?.id === ticket.id ? 'ring-2 ring-primary' : ''
                } ${getPriorityColor(ticket.priority)}`}
                onClick={() => setSelectedTicket(ticket)}
              >
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">#{ticket.protocol_number}</span>
                      {getStatusBadge(ticket.status)}
                    </div>
                    <h3 className="text-foreground font-medium text-sm">{ticket.subject}</h3>
                    <p className="text-muted-foreground text-xs line-clamp-2">{ticket.message}</p>
                    
                    {/* Exibir anexo se existir */}
                  {ticket.attachment_url && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <MessageSquare size={12} />
                        <span>📎 {ticket.attachment_name || 'Anexo'}</span>
                      </div>
                      <img 
                        src={ticket.attachment_url} 
                        alt={ticket.attachment_name || 'Anexo'} 
                        className="w-full h-32 object-cover rounded-lg border border-border cursor-pointer hover:opacity-80"
                        onClick={() => window.open(ticket.attachment_url, '_blank')}
                      />
                    </div>
                  )}
                    
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-muted-foreground">{ticket.user_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {ticket.responses_count} resposta(s)
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Detalhes do Ticket */}
        <div className="lg:col-span-2">
          {!selectedTicket ? (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center">
                <MessageSquare className="mx-auto text-gray-600 mb-4" size={48} />
                <p className="text-muted-foreground">Selecione um ticket para ver detalhes</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground">#{selectedTicket.protocol_number}</CardTitle>
                    <p className="text-muted-foreground text-sm mt-1">{selectedTicket.subject}</p>
                  </div>
                  {getStatusBadge(selectedTicket.status)}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    onClick={() => handleChangeStatus(selectedTicket.id, 'in_progress')}
                    disabled={selectedTicket.status === 'in_progress'}
                  >
                    Em Andamento
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleChangeStatus(selectedTicket.id, 'resolved')}
                    disabled={selectedTicket.status === 'resolved'}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Resolver
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleChangeStatus(selectedTicket.id, 'closed')}
                    className="border-border"
                  >
                    Fechar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mensagem Original */}
                <div className="bg-input/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="text-muted-foreground" size={16} />
                    <span className="text-foreground text-sm font-medium">{selectedTicket.user_name}</span>
                    <span className="text-muted-foreground text-xs">
                      {new Date(selectedTicket.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm">{selectedTicket.message}</p>
                  
                  {/* Exibir anexo se existir */}
                  {selectedTicket.attachment_url && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <MessageSquare size={12} />
                        <span>📎 {selectedTicket.attachment_name}</span>
                      </div>
                      <img 
                        src={selectedTicket.attachment_url} 
                        alt={selectedTicket.attachment_name || 'Anexo'} 
                        className="w-full h-40 object-cover rounded-lg border border-border cursor-pointer hover:opacity-80"
                        onClick={() => window.open(selectedTicket.attachment_url, '_blank')}
                      />
                    </div>
                  )}
                </div>

                {/* Respostas */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {responses.map((response) => (
                    <div
                      key={response.id}
                      className={`rounded-lg p-4 ${
                        response.is_admin
                          ? 'bg-primary/10 border border-primary/30 ml-8'
                          : 'bg-input/50 mr-8'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-sm font-medium ${
                          response.is_admin ? 'text-primary' : 'text-foreground'
                        }`}>
                          {response.is_admin ? '👨‍💼 Admin' : response.user_name}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {new Date(response.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm">{response.message}</p>
                      
                      {/* Exibir anexo se existir */}
                      {response.attachment_url && (
                        <div className="mt-3">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <MessageSquare size={12} />
                            <span>📎 {response.attachment_name}</span>
                          </div>
                          <img 
                            src={response.attachment_url} 
                            alt={response.attachment_name || 'Anexo'} 
                            className="w-full h-32 object-cover rounded-lg border border-border cursor-pointer hover:opacity-80"
                            onClick={() => window.open(response.attachment_url, '_blank')}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Nova Resposta */}
                {selectedTicket.status !== 'closed' && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite sua resposta..."
                      value={newResponse}
                      onChange={(e) => setNewResponse(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendResponse()}
                      className="bg-input border-border text-foreground"
                    />
                    <Button
                      onClick={handleSendResponse}
                      disabled={sending || !newResponse.trim()}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Send size={18} />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
