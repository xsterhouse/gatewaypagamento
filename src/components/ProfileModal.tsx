import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Edit, Trash2, Ban, Save, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { userData, effectiveUserId } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    document: '',
    company_name: ''
  })

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        document: userData.document || '',
        company_name: userData.company_name || ''
      })
    }
  }, [userData])

  const getRoleDisplay = (role: string) => {
    const roles: { [key: string]: string } = {
      'admin': 'Administrador',
      'user': 'Usuário',
      'manager': 'Gerente'
    }
    return roles[role] || role
  }

  const getStatusDisplay = (status: string) => {
    const statuses: { [key: string]: string } = {
      'active': 'Ativo',
      'suspended': 'Suspenso',
      'blocked': 'Bloqueado'
    }
    return statuses[status] || status
  }

  const handleSave = async () => {
    if (!effectiveUserId) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name,
          email: formData.email,
          document: formData.document,
          company_name: formData.company_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', effectiveUserId)

      if (error) throw error

      toast.success('Perfil atualizado com sucesso!')
      setIsEditing(false)
      
      // Recarregar os dados do usuário
      window.location.reload()
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error)
      toast.error('Erro ao atualizar perfil: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSuspend = async () => {
    if (!effectiveUserId) return
    
    const newStatus = userData?.status === 'suspended' ? 'active' : 'suspended'
    const confirmMessage = newStatus === 'suspended' 
      ? 'Tem certeza que deseja suspender este usuário?' 
      : 'Tem certeza que deseja ativar este usuário?'

    if (!confirm(confirmMessage)) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', effectiveUserId)

      if (error) throw error

      toast.success(newStatus === 'suspended' ? 'Usuário suspenso com sucesso!' : 'Usuário ativado com sucesso!')
      
      // Recarregar os dados do usuário
      window.location.reload()
    } catch (error: any) {
      console.error('Erro ao alterar status:', error)
      toast.error('Erro ao alterar status: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!effectiveUserId) return

    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita!')) {
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', effectiveUserId)

      if (error) throw error

      toast.success('Usuário excluído com sucesso!')
      onClose()
      
      // Se o usuário excluiu a própria conta, fazer logout
      if (effectiveUserId === userData?.id) {
        window.location.href = '/login'
      } else {
        window.location.reload()
      }
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error)
      toast.error('Erro ao excluir usuário: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: userData?.name || '',
      email: userData?.email || '',
      document: userData?.document || '',
      company_name: userData?.company_name || ''
    })
    setIsEditing(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent onClose={onClose} className="max-w-md">
        <DialogHeader>
          <DialogTitle>Perfil do Usuário</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do Perfil */}
          <div className="space-y-3">
            {isEditing ? (
              <>
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Digite o nome"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Digite o email"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="document">Documento (CPF/CNPJ)</Label>
                  <Input
                    id="document"
                    value={formData.document}
                    onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                    placeholder="Digite o documento"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="company_name">Nome da Empresa</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="Digite o nome da empresa"
                    className="mt-1"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Nome:</span>
                  <span className="text-sm font-medium text-foreground">{userData?.name || 'Não informado'}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="text-sm font-medium text-foreground">{userData?.email}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Hierarquia:</span>
                  <span className="text-sm font-medium text-foreground">{getRoleDisplay(userData?.role)}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span className={`text-sm font-medium ${
                    userData?.status === 'active' ? 'text-green-600 dark:text-green-400' : 
                    userData?.status === 'suspended' ? 'text-yellow-600 dark:text-yellow-400' : 
                    'text-red-600 dark:text-red-400'
                  }`}>
                    {getStatusDisplay(userData?.status)}
                  </span>
                </div>

                {userData?.document && (
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Documento:</span>
                    <span className="text-sm font-medium text-foreground">{userData.document}</span>
                  </div>
                )}

                {userData?.company_name && (
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Empresa:</span>
                    <span className="text-sm font-medium text-foreground">{userData.company_name}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Ações */}
          <div className="flex flex-col gap-2 pt-4 border-t border-border">
            {isEditing ? (
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  disabled={loading}
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            ) : (
              <>
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="w-full"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Perfil
                </Button>

                <Button
                  onClick={handleSuspend}
                  variant="outline"
                  disabled={loading}
                  className="w-full"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  {userData?.status === 'suspended' ? 'Ativar Usuário' : 'Suspender Usuário'}
                </Button>

                <Button
                  onClick={handleDelete}
                  variant="destructive"
                  disabled={loading}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir Usuário
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
