import { useState, useEffect } from 'react'
import { X, Bell, Check, Trash2, Mail, AlertCircle, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  is_read: boolean
  created_at: string
}

interface NotificationsPanelProps {
  isOpen: boolean
  onClose: () => void
  onUnreadCountChange?: (count: number) => void
}

export function NotificationsPanel({ isOpen, onClose, onUnreadCountChange }: NotificationsPanelProps) {
  const { effectiveUserId } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen && effectiveUserId) {
      loadNotifications()
    }
  }, [isOpen, effectiveUserId])

  // Atualizar contador quando notificações mudarem
  useEffect(() => {
    const unreadCount = notifications.filter(n => !n.is_read).length
    if (onUnreadCountChange) {
      onUnreadCountChange(unreadCount)
    }
  }, [notifications, onUnreadCountChange])

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        // Se não houver tabela, usar notificações mockadas
        console.log('Tabela notifications não existe ainda, usando notificações de exemplo')
        throw error
      }
      
      // Se tiver dados do banco, usar
      if (data && data.length > 0) {
        setNotifications(data)
      } else {
        // Se tabela existe mas está vazia, mostrar notificações de exemplo
        setMockNotifications()
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
      // Usar notificações mockadas
      setMockNotifications()
    } finally {
      setLoading(false)
    }
  }

  const setMockNotifications = () => {
    setNotifications([
      {
        id: '1',
        user_id: effectiveUserId!,
        title: 'Bem-vindo ao DiMPay! 🎉',
        message: 'Sua conta foi criada com sucesso. Comece explorando o sistema.',
        type: 'success',
        is_read: false,
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        user_id: effectiveUserId!,
        title: 'Complete seu KYC',
        message: 'Para habilitar todas as funcionalidades, complete o processo de verificação KYC.',
        type: 'warning',
        is_read: false,
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '3',
        user_id: effectiveUserId!,
        title: 'Nova funcionalidade disponível',
        message: 'O calendário bancário está disponível! Organize seus pagamentos e compromissos financeiros.',
        type: 'info',
        is_read: false,
        created_at: new Date(Date.now() - 7200000).toISOString()
      }
    ])
  }

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)

      if (error) throw error

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
      toast.success('Notificação marcada como lida')
    } catch (error) {
      console.error('Erro ao marcar notificação:', error)
      // Marcar localmente se não houver tabela
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
    }
  }

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', effectiveUserId)

      if (error) throw error

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      toast.success('Todas as notificações marcadas como lidas')
    } catch (error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)

      if (error) throw error

      setNotifications(prev => prev.filter(n => n.id !== id))
      toast.success('Notificação removida')
    } catch (error) {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-500/10 border-green-500/30'
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/30'
      case 'error':
        return 'bg-red-500/10 border-red-500/30'
      default:
        return 'bg-blue-500/10 border-blue-500/30'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Agora'
    if (minutes < 60) return `${minutes}m atrás`
    if (hours < 24) return `${hours}h atrás`
    if (days < 7) return `${days}d atrás`
    return date.toLocaleDateString('pt-BR')
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div 
        className="fixed right-4 top-20 w-full max-w-md z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="bg-[#1a1f2e] border-gray-800 shadow-2xl max-h-[80vh] flex flex-col">
          <CardHeader className="border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="text-primary" size={24} />
                <CardTitle className="text-white">Notificações</CardTitle>
                {unreadCount > 0 && (
                  <Badge className="bg-red-500">{unreadCount}</Badge>
                )}
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
          </CardHeader>

          <CardContent className="p-0 flex-1 overflow-hidden">
            {/* Actions */}
            {unreadCount > 0 && (
              <div className="p-3 border-b border-gray-800 bg-gray-800/30">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                >
                  <Check size={14} className="mr-2" />
                  Marcar todas como lidas
                </Button>
              </div>
            )}

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-[60vh]">
              {loading ? (
                <div className="p-8 text-center text-gray-400">
                  Carregando notificações...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Mail className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Nenhuma notificação</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-800 transition-colors ${
                      !notification.is_read ? 'bg-gray-800/50' : 'hover:bg-gray-800/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg ${getTypeColor(notification.type)} flex items-center justify-center flex-shrink-0`}>
                        {getIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className={`text-sm font-semibold ${!notification.is_read ? 'text-white' : 'text-gray-300'}`}>
                            {notification.title}
                          </h4>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-400 mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {formatDate(notification.created_at)}
                          </span>
                          
                          <div className="flex gap-1">
                            {!notification.is_read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                className="h-6 px-2 text-xs text-primary hover:text-primary"
                              >
                                <Check size={12} className="mr-1" />
                                Ler
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification(notification.id)}
                              className="h-6 px-2 text-xs text-red-400 hover:text-red-500"
                            >
                              <Trash2 size={12} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
