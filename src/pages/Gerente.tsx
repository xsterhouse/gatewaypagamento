import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageSquare, Send, RefreshCw, User, UserCog } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDateTime } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

interface Ticket {
  id: string
  subject: string
  message: string
  status: string
  created_at: string
}

interface ChatMessage {
  id: string
  ticket_id: string
  message: string
  is_admin: boolean
  created_at: string
  sender_name?: string
}

export function Gerente() {
  const { effectiveUserId } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (effectiveUserId) {
      loadTickets()
    }
  }, [effectiveUserId])

  useEffect(() => {
    if (selectedTicket) {
      loadChatMessages(selectedTicket.id)
    }
  }, [selectedTicket])

  useEffect(() => {
    // Auto scroll para última mensagem
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const loadTickets = async () => {
    try {
      if (!effectiveUserId) return

      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao carregar tickets:', error)
        return
      }

      setTickets(data || [])
      console.log('💬 Tickets carregados:', data?.length || 0)
    } catch (error) {
      console.error('Erro:', error)
    }
  }

  const loadChatMessages = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select(`
          *,
          sender:users(name)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Erro ao carregar mensagens:', error)
        return
      }

      const formattedMessages = data?.map(msg => ({
        ...msg,
        sender_name: msg.sender?.name
      })) || []

      setChatMessages(formattedMessages)
      console.log('💬 Mensagens do chat:', formattedMessages.length)
    } catch (error) {
      console.error('Erro ao carregar chat:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadTickets()
    if (selectedTicket) {
      await loadChatMessages(selectedTicket.id)
    }
    setRefreshing(false)
    toast.success('Mensagens atualizadas!')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error('Usuário não autenticado')
        setLoading(false)
        return
      }

      console.log('Criando ticket para usuário:', user.id)

      const { data: ticket, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          subject: subject,
          message: message,
          status: 'open',
          priority: 'medium'
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar ticket:', error)
        throw error
      }

      // Criar primeira mensagem do ticket
      const { error: msgError } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticket.id,
          user_id: user.id,
          message: message,
          is_admin: false
        })

      if (msgError) {
        console.error('Erro ao criar mensagem:', msgError)
      }

      console.log('Ticket criado:', ticket)
      toast.success('Mensagem enviada com sucesso!')

      setSubject('')
      setMessage('')
      await loadTickets()
      setSelectedTicket(ticket)
    } catch (error) {
      console.error('Erro no handleSubmit:', error)
      toast.error('Erro ao enviar mensagem')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedTicket || !effectiveUserId) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: selectedTicket.id,
          user_id: effectiveUserId,
          message: newMessage,
          is_admin: false
        })

      if (error) throw error

      setNewMessage('')
      await loadChatMessages(selectedTicket.id)
      toast.success('Mensagem enviada!')
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      toast.error('Erro ao enviar mensagem')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Fale com seu Gerente</h1>
          <p className="text-muted-foreground">Envie mensagens diretamente para seu gerente de conta</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Tickets */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <MessageSquare size={20} />
              Meus Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {tickets.length === 0 ? (
                <p className="text-muted-foreground text-center py-8 text-sm">Nenhum ticket criado</p>
              ) : (
                tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                      selectedTicket?.id === ticket.id
                        ? 'bg-primary/10 border-primary'
                        : 'bg-accent/30 border-border hover:bg-accent/50'
                    }`}
                  >
                    <h4 className="text-foreground font-medium text-sm mb-1">{ticket.subject}</h4>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        ticket.status === 'open' ? 'bg-yellow-500/10 text-yellow-400' :
                        ticket.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-green-500/10 text-green-400'
                      }`}>
                        {ticket.status === 'open' ? 'Aberto' :
                         ticket.status === 'in_progress' ? 'Em Andamento' :
                         'Fechado'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <Button
                onClick={() => setSelectedTicket(null)}
                className="w-full mt-4"
                size="sm"
              >
                <MessageSquare size={16} className="mr-2" />
                Novo Ticket
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Chat / Nova Mensagem */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              {selectedTicket ? (
                <>
                  <MessageSquare size={20} />
                  {selectedTicket.subject}
                </>
              ) : (
                <>
                  <Send size={20} />
                  Criar Novo Ticket
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTicket ? (
              /* Janela de Chat */
              <div className="space-y-4">
                <div className="h-[400px] overflow-y-auto space-y-3 p-4 bg-accent/20 rounded-lg">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.is_admin ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.is_admin
                            ? 'bg-blue-500/10 border border-blue-500/30'
                            : 'bg-primary/10 border border-primary/30'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {msg.is_admin ? (
                            <UserCog size={14} className="text-blue-400" />
                          ) : (
                            <User size={14} className="text-primary" />
                          )}
                          <span className="text-xs font-medium text-foreground">
                            {msg.is_admin ? 'Gerente' : 'Você'}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{msg.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDateTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Enviar nova mensagem no chat */}
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="flex-1"
                  />
                  <Button type="submit" disabled={loading || !newMessage.trim()}>
                    <Send size={16} />
                  </Button>
                </form>
              </div>
            ) : (
              /* Formulário de Novo Ticket */
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Assunto</label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Digite o assunto do ticket"
                    required
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Mensagem</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Descreva sua solicitação ou dúvida..."
                    required
                    rows={10}
                    className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  <Send size={16} className="mr-2" />
                  Criar Ticket
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
