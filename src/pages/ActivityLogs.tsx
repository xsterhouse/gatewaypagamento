import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Activity, 
  Search, 
  TrendingUp,
  TrendingDown,
  Shield,
  Settings,
  LogIn,
  LogOut,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'

interface ActivityLog {
  id: string
  user_name: string
  admin_name: string | null
  action_type: string
  action_category: string
  description: string
  metadata: any
  created_at: string
}

export function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const categories = [
    { value: 'all', label: 'Todas' },
    { value: 'transaction', label: 'Transações' },
    { value: 'user_management', label: 'Gestão de Usuários' },
    { value: 'kyc', label: 'KYC' },
    { value: 'auth', label: 'Autenticação' },
    { value: 'settings', label: 'Configurações' },
    { value: 'admin', label: 'Administração' },
  ]

  useEffect(() => {
    loadLogs()
  }, [])

  useEffect(() => {
    filterLogs()
  }, [logs, searchTerm, categoryFilter])

  const loadLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)

      if (error) {
        console.error('Erro ao carregar logs:', error)
        throw error
      }

      // Buscar nomes de usuários separadamente
      const userIds = [...new Set([
        ...data.map(log => log.user_id).filter(Boolean),
        ...data.map(log => log.admin_id).filter(Boolean)
      ])]

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

      const formatted = (data || []).map(log => ({
        id: log.id,
        user_name: log.user_id ? (usersMap.get(log.user_id) || 'Usuário') : 'Sistema',
        admin_name: log.admin_id ? (usersMap.get(log.admin_id) || null) : null,
        action_type: log.action_type,
        action_category: log.action_category,
        description: log.description,
        metadata: log.metadata,
        created_at: log.created_at,
      }))

      setLogs(formatted)
    } catch (error) {
      console.error('Erro ao carregar logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterLogs = () => {
    let filtered = logs

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(log => log.action_category === categoryFilter)
    }

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.admin_name && log.admin_name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    setFilteredLogs(filtered)
  }

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'pix_send':
        return <TrendingDown className="text-red-500" size={20} />
      case 'pix_receive':
        return <TrendingUp className="text-green-500" size={20} />
      case 'user_suspend':
      case 'user_block':
        return <XCircle className="text-red-500" size={20} />
      case 'user_activate':
        return <CheckCircle className="text-green-500" size={20} />
      case 'kyc_approve':
        return <CheckCircle className="text-green-500" size={20} />
      case 'kyc_reject':
        return <XCircle className="text-red-500" size={20} />
      case 'login':
        return <LogIn className="text-blue-500" size={20} />
      case 'logout':
        return <LogOut className="text-muted-foreground" size={20} />
      case 'settings_change':
        return <Settings className="text-yellow-500" size={20} />
      default:
        return <Activity className="text-muted-foreground" size={20} />
    }
  }

  const getCategoryBadge = (category: string) => {
    const colors: { [key: string]: string } = {
      transaction: 'bg-blue-500/10 text-blue-500',
      user_management: 'bg-purple-500/10 text-purple-500',
      kyc: 'bg-green-500/10 text-green-500',
      auth: 'bg-yellow-500/10 text-yellow-500',
      settings: 'bg-orange-500/10 text-orange-500',
      admin: 'bg-red-500/10 text-red-500',
    }

    const labels: { [key: string]: string } = {
      transaction: 'Transação',
      user_management: 'Gestão',
      kyc: 'KYC',
      auth: 'Auth',
      settings: 'Config',
      admin: 'Admin',
    }

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[category] || 'bg-gray-500/10 text-muted-foreground'}`}>
        {labels[category] || category}
      </span>
    )
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
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Logs de Atividades</h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1">Histórico detalhado de todas as ações do sistema</p>
      </div>

      {/* Filtros */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
              <Input
                placeholder="Buscar por usuário ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-input border-border text-foreground pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <Button
                  key={cat.value}
                  onClick={() => setCategoryFilter(cat.value)}
                  variant={categoryFilter === cat.value ? 'default' : 'outline'}
                  size="sm"
                  className={categoryFilter === cat.value ? 'bg-primary' : 'border-border'}
                >
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Logs */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Activity size={24} />
            Atividades Recentes ({filteredLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredLogs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhuma atividade encontrada</p>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 bg-input/50 rounded-lg hover:bg-input transition-colors"
                >
                  <div className="p-2 bg-gray-700/50 rounded-lg">
                    {getActionIcon(log.action_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-foreground font-medium">{log.user_name}</p>
                      {getCategoryBadge(log.action_category)}
                    </div>
                    
                    <p className="text-gray-300 text-sm">{log.description}</p>
                    
                    {log.admin_name && (
                      <p className="text-muted-foreground text-xs mt-1">
                        <Shield className="inline mr-1" size={12} />
                        Por: {log.admin_name}
                      </p>
                    )}
                    
                    <p className="text-muted-foreground text-xs mt-1">
                      <Clock className="inline mr-1" size={12} />
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>

                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <details className="text-xs">
                      <summary className="text-muted-foreground cursor-pointer hover:text-foreground">
                        Detalhes
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-900 rounded text-gray-300 overflow-auto max-w-xs">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
