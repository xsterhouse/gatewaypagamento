import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageSquare, Send, RefreshCw, User, UserCog, Paperclip, Image, X } from 'lucide-react'
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
  attachment_url?: string
  attachment_name?: string
}

interface ChatMessage {
  id: string
  ticket_id: string
  message: string
  is_admin: boolean
  created_at: string
  sender_name?: string
  attachment_url?: string
  attachment_name?: string
}

export function Gerente() {
  console.log('🎯 Gerente component mounted - Upload support enabled!')
  
  const { effectiveUserId } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [attachment, setAttachment] = useState<File | null>(null)
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo e tamanho
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (!validTypes.includes(file.type)) {
      toast.error('Apenas imagens JPG, PNG ou WebP são permitidas')
      return
    }

    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Máximo 5MB')
      return
    }

    setAttachment(file)
    
    // Criar preview para imagens
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setAttachmentPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadAttachment = async (file: File, ticketId: string): Promise<string | null> => {
    try {
      setUploading(true)
      
      const fileName = `attachment_${Date.now()}.${file.name.split('.').pop()}`
      const filePath = `support-attachments/${ticketId}/${fileName}`
      
      const { error: uploadError } = await supabase.storage
        .from('support-attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Erro no upload:', uploadError)
        return null
      }

      // Gerar URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('support-attachments')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Erro no upload:', error)
      return null
    } finally {
      setUploading(false)
    }
  }

  const clearAttachment = () => {
    setAttachment(null)
    setAttachmentPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const loadChatMessages = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Erro ao carregar mensagens:', error)
        return
      }

      // Buscar dados dos usuários separadamente
      const messagesWithUsers = await Promise.all(
        (data || []).map(async (msg) => {
          const { data: userData } = await supabase
            .from('users')
            .select('name')
            .eq('id', msg.sender_id)
            .single()
          
          return {
            ...msg,
            sender_name: userData?.name
          }
        })
      )

      setChatMessages(messagesWithUsers)
      console.log('💬 Mensagens do chat:', messagesWithUsers.length)
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
    if (!subject.trim() || !message.trim() || !effectiveUserId) return

    setLoading(true)
    try {
      console.log('🔵 Iniciando criação de ticket...')
      console.log('📍 effectiveUserId:', effectiveUserId)
      
      const { data: user } = await supabase.auth.getUser()
      console.log('📍 Auth user:', user.user?.id)
      
      if (!user.user) throw new Error('Usuário não autenticado')

      // Criar ticket
      console.log('📝 Criando ticket...')
      const ticketData = {
        user_id: effectiveUserId,
        subject: subject,
        message: message, // Incluir mensagem no ticket
        status: 'open',
        protocol_number: `TKT-${Date.now()}`
      }
      console.log('📋 Ticket data:', ticketData)

      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert(ticketData)
        .select()
        .single()

      if (ticketError) {
        console.error('❌ Erro ao criar ticket:', ticketError)
        throw ticketError
      }

      console.log('✅ Ticket criado:', ticket)

      // Upload do anexo se existir
      let attachmentUrl: string | null = null
      let attachmentName: string | null = null
      
      if (attachment) {
        console.log('📎 Fazendo upload do anexo...')
        attachmentUrl = await uploadAttachment(attachment, ticket.id)
        if (attachmentUrl) {
          attachmentName = attachment.name
          console.log('✅ Anexo uploaded:', attachmentUrl)
          
          // Atualizar ticket com anexo
          console.log('🔄 Atualizando ticket com anexo:', {
            ticketId: ticket.id,
            attachmentUrl,
            attachmentName
          })
          
          const { error: updateError } = await supabase
            .from('support_tickets')
            .update({
              attachment_url: attachmentUrl,
              attachment_name: attachmentName
            })
            .eq('id', ticket.id)
          
          if (updateError) {
            console.error('❌ Erro ao atualizar ticket com anexo:', updateError)
          } else {
            console.log('✅ Ticket atualizado com anexo!')
          }
        }
      }

      console.log('✅ Ticket criado com sucesso!')
      toast.success('Mensagem enviada com sucesso!')

      setSubject('')
      setMessage('')
      clearAttachment()
      await loadTickets()
      setSelectedTicket(ticket)
    } catch (error: any) {
      console.error('❌ Erro completo no handleSubmit:', error)
      toast.error(`Erro ao enviar mensagem: ${error.message || 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedTicket || !effectiveUserId) return

    setLoading(true)
    try {
      // Upload do anexo se existir
      let attachmentUrl: string | null = null
      let attachmentName: string | null = null
      
      if (attachment) {
        attachmentUrl = await uploadAttachment(attachment, selectedTicket.id)
        if (attachmentUrl) {
          attachmentName = attachment.name
        }
      }

      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: selectedTicket.id,
          user_id: effectiveUserId,
          message: newMessage,
          is_admin: false,
          attachment_url: attachmentUrl,
          attachment_name: attachmentName
        })

      if (error) throw error

      setNewMessage('')
      clearAttachment()
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
                        
                        {/* Exibir anexo se existir */}
                        {msg.attachment_url && (
                          <div className="mt-2">
                            <img 
                              src={msg.attachment_url} 
                              alt={msg.attachment_name || 'Anexo'} 
                              className="w-full h-40 object-cover rounded-lg border border-border cursor-pointer hover:opacity-80"
                              onClick={() => window.open(msg.attachment_url, '_blank')}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              📎 {msg.attachment_name}
                            </p>
                          </div>
                        )}
                        
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDateTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Enviar nova mensagem no chat */}
                <div className="space-y-2">
                  {/* Preview do anexo */}
                  {attachmentPreview && (
                    <div className="relative">
                      <img 
                        src={attachmentPreview} 
                        alt="Preview do anexo" 
                        className="w-full h-32 object-cover rounded-lg border border-border"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2"
                        onClick={clearAttachment}
                      >
                        <X size={16} />
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        {attachment?.name}
                      </p>
                    </div>
                  )}
                  
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Paperclip size={16} />
                    </Button>
                    <Button type="submit" disabled={loading || uploading || !newMessage.trim()}>
                      {uploading ? (
                        <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                      ) : (
                        <Send size={16} />
                      )}
                    </Button>
                  </form>
                </div>
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
                
                {/* Upload de Anexo */}
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block flex items-center gap-2">
                    <Paperclip size={16} />
                    Anexo (opcional)
                  </label>
                  
                  {attachmentPreview ? (
                    <div className="relative">
                      <img 
                        src={attachmentPreview} 
                        alt="Preview do anexo" 
                        className="w-full h-48 object-cover rounded-lg border border-border"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2"
                        onClick={clearAttachment}
                      >
                        <X size={16} />
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        {attachment?.name}
                      </p>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                      <Image size={32} className="mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Arraste uma imagem ou clique para selecionar
                      </p>
                      <p className="text-xs text-muted-foreground mb-4">
                        JPG, PNG ou WebP (máx. 5MB)
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        <Paperclip size={16} className="mr-2" />
                        {uploading ? 'Enviando...' : 'Selecionar Imagem'}
                      </Button>
                    </div>
                  )}
                </div>
                
                <Button type="submit" disabled={loading || uploading} className="w-full">
                  <Send size={16} className="mr-2" />
                  {loading || uploading ? 'Enviando...' : 'Criar Ticket'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
