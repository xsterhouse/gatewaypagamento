import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { 
  MessageCircle, 
  Plus, 
  Trash2,
  Send,
  Users,
  CheckCircle,
  Download,
  Upload
} from 'lucide-react'

interface WhatsappContact {
  id: string
  name: string
  phone: string
  created_at: string
}

export function AdminWhatsapp() {
  const [contacts, setContacts] = useState<WhatsappContact[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setContacts(data || [])
    } catch (error) {
      console.error('Erro ao carregar contatos:', error)
      toast.error('Erro ao carregar contatos')
    } finally {
      setLoading(false)
    }
  }

  const addContact = async () => {
    if (!newName || !newPhone) {
      toast.error('Preencha nome e telefone')
      return
    }

    // Validar formato do telefone (apenas números)
    const phoneNumbers = newPhone.replace(/\D/g, '')
    if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
      toast.error('Telefone inválido. Use formato: (XX) XXXXX-XXXX')
      return
    }

    try {
      const { error } = await supabase
        .from('whatsapp_contacts')
        .insert({
          name: newName,
          phone: phoneNumbers
        })

      if (error) throw error

      toast.success('Contato adicionado!')
      setNewName('')
      setNewPhone('')
      loadContacts()
    } catch (error) {
      console.error('Erro ao adicionar contato:', error)
      toast.error('Erro ao adicionar contato')
    }
  }

  const deleteContact = async (id: string) => {
    if (!confirm('Deseja excluir este contato?')) return

    try {
      const { error } = await supabase
        .from('whatsapp_contacts')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Contato excluído!')
      loadContacts()
    } catch (error) {
      console.error('Erro ao excluir contato:', error)
      toast.error('Erro ao excluir contato')
    }
  }

  const importApprovedCustomers = async () => {
    try {
      setLoading(true)
      
      // Buscar usuários aprovados (kyc_status = 'approved')
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, phone')
        .eq('kyc_status', 'approved')
        .not('phone', 'is', null)

      if (usersError) throw usersError

      if (!users || users.length === 0) {
        toast.info('Nenhum cliente aprovado com telefone encontrado')
        return
      }

      // Buscar contatos já existentes
      const { data: existingContacts } = await supabase
        .from('whatsapp_contacts')
        .select('phone')

      const existingPhones = new Set(existingContacts?.map(c => c.phone) || [])

      // Filtrar apenas novos contatos
      const newContacts = users
        .filter(user => {
          const phone = user.phone?.replace(/\D/g, '')
          return phone && phone.length >= 10 && !existingPhones.has(phone)
        })
        .map(user => ({
          name: user.name,
          phone: user.phone!.replace(/\D/g, '')
        }))

      if (newContacts.length === 0) {
        toast.info('Todos os clientes aprovados já estão na lista')
        return
      }

      // Inserir novos contatos
      const { error: insertError } = await supabase
        .from('whatsapp_contacts')
        .insert(newContacts)

      if (insertError) throw insertError

      toast.success(`${newContacts.length} clientes aprovados importados!`)
      loadContacts()
    } catch (error) {
      console.error('Erro ao importar clientes:', error)
      toast.error('Erro ao importar clientes aprovados')
    } finally {
      setLoading(false)
    }
  }

  const sendWhatsappMessages = async () => {
    if (!message.trim()) {
      toast.error('Digite uma mensagem')
      return
    }

    if (contacts.length === 0) {
      toast.error('Nenhum contato na lista')
      return
    }

    setSending(true)

    try {
      // Criar links do WhatsApp para cada contato
      const whatsappLinks = contacts.map(contact => {
        const encodedMessage = encodeURIComponent(message)
        const phone = contact.phone.replace(/\D/g, '')
        const formattedPhone = phone.startsWith('55') ? phone : `55${phone}`
        return {
          name: contact.name,
          phone: contact.phone,
          url: `https://wa.me/${formattedPhone}?text=${encodedMessage}`
        }
      })

      // Abrir links em novas abas (navegador pode bloquear pop-ups)
      let opened = 0
      for (const link of whatsappLinks) {
        // Pequeno delay entre aberturas para evitar bloqueio do navegador
        await new Promise(resolve => setTimeout(resolve, 500))
        window.open(link.url, '_blank')
        opened++
      }

      toast.success(`${opened} conversas do WhatsApp abertas! Envie as mensagens manualmente.`)
      
      // Informar sobre possível bloqueio de pop-ups
      if (opened < contacts.length) {
        toast.warning('Algumas abas podem ter sido bloqueadas. Permita pop-ups neste site.')
      }
    } catch (error) {
      console.error('Erro ao abrir WhatsApp:', error)
      toast.error('Erro ao processar envio')
    } finally {
      setSending(false)
    }
  }

  const exportContacts = () => {
    if (contacts.length === 0) {
      toast.error('Nenhum contato para exportar')
      return
    }

    const csv = [
      ['Nome', 'Telefone'],
      ...contacts.map(c => [c.name, c.phone])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `contatos_whatsapp_${new Date().toISOString().split('T')[0]}.csv`
    link.click()

    toast.success('Contatos exportados!')
  }

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
    } else if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
    }
    return phone
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <MessageCircle className="text-green-500" />
          Envio WhatsApp
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie contatos e envie mensagens em massa via WhatsApp
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total de Contatos</p>
                <p className="text-2xl font-bold text-foreground">{contacts.length}</p>
              </div>
              <Users className="text-blue-500" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Mensagem</p>
                <p className="text-2xl font-bold text-foreground">
                  {message.length > 0 ? '✓' : '✗'}
                </p>
              </div>
              <MessageCircle className="text-green-500" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Status</p>
                <p className="text-sm font-medium text-green-500">
                  {contacts.length > 0 && message.length > 0 ? 'Pronto' : 'Aguardando'}
                </p>
              </div>
              <CheckCircle className="text-green-500" size={32} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Importar Clientes Aprovados */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Upload className="text-blue-500" />
            Importar Clientes Aprovados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={importApprovedCustomers}
              className="bg-blue-600 hover:bg-blue-700 flex-1"
              disabled={loading}
            >
              <Upload className="mr-2" size={16} />
              Importar Clientes com KYC Aprovado
            </Button>
            <Button
              onClick={exportContacts}
              variant="outline"
              className="border-green-500 text-green-500 hover:bg-green-500/10"
              disabled={contacts.length === 0}
            >
              <Download className="mr-2" size={16} />
              Exportar CSV
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Importa automaticamente nome e telefone dos clientes com KYC aprovado
          </p>
        </CardContent>
      </Card>

      {/* Adicionar Contato Manual */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Plus className="text-green-500" />
            Adicionar Contato Manual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              placeholder="Nome"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-input border-border text-foreground"
            />
            <Input
              placeholder="Telefone (XX) XXXXX-XXXX"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="bg-input border-border text-foreground"
            />
            <Button
              onClick={addContact}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="mr-2" size={16} />
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mensagem */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <MessageCircle className="text-blue-500" />
            Mensagem para Envio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            placeholder="Digite a mensagem que será enviada para todos os contatos..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            className="w-full bg-input border border-border text-foreground rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {message.length} caracteres
            </p>
            <Button
              onClick={sendWhatsappMessages}
              disabled={sending || contacts.length === 0 || !message.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="mr-2" size={16} />
              {sending ? 'Abrindo WhatsApp...' : `Enviar para ${contacts.length} contatos`}
            </Button>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <p className="text-yellow-200 text-sm">
              ⚠️ <strong>Importante:</strong> O sistema abrirá uma aba do WhatsApp Web para cada contato.
              Você precisará clicar em "Enviar" manualmente em cada conversa. Permita pop-ups no navegador.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Contatos */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Users className="text-purple-500" />
            Lista de Contatos ({contacts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto text-muted-foreground mb-4" size={48} />
              <p className="text-muted-foreground">
                Nenhum contato cadastrado. Adicione manualmente ou importe clientes aprovados.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-3 bg-accent/50 rounded-lg border border-border hover:bg-accent/70 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{contact.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatPhone(contact.phone)}
                    </p>
                  </div>
                  <Button
                    onClick={() => deleteContact(contact.id)}
                    variant="outline"
                    size="sm"
                    className="border-red-500 text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
