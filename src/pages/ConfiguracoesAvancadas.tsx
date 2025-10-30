import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { 
  Users, 
  DollarSign, 
  Percent,
  Shield,
  UserPlus,
  Trash2,
  Save,
  TrendingUp,
  Lock,
  Upload,
  MessageCircle,
  Camera,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  Key
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

interface Manager {
  id: string
  name: string
  email: string
  cpf: string
  whatsapp: string
  photo_url: string | null
  max_clients: number
  current_clients: number
  status: 'active' | 'suspended'
  created_at: string
}

interface TaxConfig {
  id: string
  setting_key: string
  setting_value: string
  setting_type: 'percentage' | 'currency'
  description: string
}

export function ConfiguracoesAvancadas() {
  const [activeTab, setActiveTab] = useState('managers')
  const [managers, setManagers] = useState<Manager[]>([])
  const [taxes, setTaxes] = useState<TaxConfig[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modal estado
  const [modalOpen, setModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>('')
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // Novo Gerente
  const [newManager, setNewManager] = useState({
    name: '',
    email: '',
    cpf: '',
    whatsapp: '',
    password: '',
    max_clients: 50
  })

  // Editar Gerente
  const [editManager, setEditManager] = useState({
    name: '',
    cpf: '',
    whatsapp: '',
    max_clients: 50
  })

  // Taxas editáveis
  const [taxValues, setTaxValues] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      await Promise.all([
        loadManagers(),
        loadTaxes()
      ])
    } catch (error) {
      console.error('Erro ao carregar:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadManagers = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'manager')
      .order('created_at', { ascending: false })

    if (data) setManagers(data as Manager[])
  }

  const loadTaxes = async () => {
    const { data } = await supabase
      .from('system_settings')
      .select('*')
      .order('setting_key')

    if (data) {
      setTaxes(data as TaxConfig[])
      const values: { [key: string]: string } = {}
      data.forEach((tax: TaxConfig) => {
        values[tax.setting_key] = tax.setting_value
      })
      setTaxValues(values)
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadPhoto = async (userId: string) => {
    if (!photoFile) return null

    try {
      const fileExt = photoFile.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `managers/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, photoFile)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      return null
    }
  }

  const handleCreateManager = async () => {
    if (!newManager.name || !newManager.email || !newManager.cpf || !newManager.password || !newManager.whatsapp) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    try {
      // Criar usuário no Auth usando Admin API
      // Primeiro, criar o usuário diretamente na tabela users com um ID temporário
      const tempUserId = crypto.randomUUID()
      
      console.log('Criando gerente com ID:', tempUserId)

      // Criar usuário no Auth com metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newManager.email,
        password: newManager.password,
        options: {
          data: {
            name: newManager.name,
            role: 'manager',
            skip_auto_insert: true // Flag para o trigger não tentar inserir
          }
        }
      })

      if (authError) {
        console.error('Erro no Auth:', authError)
        throw new Error(`Erro ao criar usuário: ${authError.message}`)
      }

      if (!authData.user) {
        throw new Error('Usuário não foi criado no Auth')
      }

      // Upload da foto
      let photoUrl = null
      if (photoFile && authData.user) {
        photoUrl = await uploadPhoto(authData.user.id)
      }

      // Criar perfil de gerente
      console.log('Tentando inserir gerente com dados:', {
        id: authData.user.id,
        name: newManager.name,
        email: newManager.email,
        cpf: newManager.cpf,
        whatsapp: newManager.whatsapp,
        photo_url: photoUrl,
        role: 'manager',
        max_clients: newManager.max_clients,
        status: 'active',
        kyc_status: 'approved',
        current_clients: 0
      })

      const { data: insertedData, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          name: newManager.name,
          email: newManager.email,
          cpf: newManager.cpf,
          whatsapp: newManager.whatsapp,
          photo_url: photoUrl,
          role: 'manager',
          max_clients: newManager.max_clients,
          status: 'active',
          kyc_status: 'approved',
          current_clients: 0
        })
        .select()

      if (profileError) {
        console.error('Erro detalhado no banco de dados:', {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code
        })
        throw new Error(`Erro ao salvar no banco: ${profileError.message} - ${profileError.details || ''} - ${profileError.hint || ''}`)
      }

      console.log('Gerente inserido com sucesso:', insertedData)

      toast.success('Gerente criado com sucesso!')
      setModalOpen(false)
      setNewManager({ name: '', email: '', cpf: '', whatsapp: '', password: '', max_clients: 50 })
      setPhotoFile(null)
      setPhotoPreview('')
      loadManagers()
    } catch (error: any) {
      console.error('Erro completo:', error)
      toast.error(error.message || 'Erro ao criar gerente')
    }
  }

  const handleUpdateTaxes = async () => {
    try {
      for (const tax of taxes) {
        await supabase
          .from('system_settings')
          .update({ setting_value: taxValues[tax.setting_key] })
          .eq('id', tax.id)
      }

      toast.success('Taxas atualizadas com sucesso!')
      loadTaxes()
    } catch (error) {
      toast.error('Erro ao atualizar taxas')
    }
  }

  const handleViewManager = (manager: Manager) => {
    setSelectedManager(manager)
    setViewModalOpen(true)
  }

  const handleEditManager = (manager: Manager) => {
    setSelectedManager(manager)
    setEditManager({
      name: manager.name,
      cpf: manager.cpf,
      whatsapp: manager.whatsapp,
      max_clients: manager.max_clients
    })
    setEditModalOpen(true)
  }

  const handleChangePassword = (manager: Manager) => {
    setSelectedManager(manager)
    setNewPassword('')
    setConfirmPassword('')
    setPasswordModalOpen(true)
  }

  const handleUpdatePassword = async () => {
    if (!selectedManager) return

    if (!newPassword || newPassword.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    try {
      console.log('🔑 Enviando email de redefinição para:', selectedManager.email)

      // Enviar email de redefinição de senha
      const { error } = await supabase.auth.resetPasswordForEmail(
        selectedManager.email,
        {
          redirectTo: `${window.location.origin}/reset-password`
        }
      )

      if (error) {
        console.error('Erro ao enviar email:', error)
        throw error
      }

      toast.success(
        `✅ Email enviado para ${selectedManager.email}! O gerente deve verificar a caixa de entrada.`,
        { duration: 5000 }
      )
      
      setPasswordModalOpen(false)
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      console.error('❌ Erro ao enviar email:', error)
      toast.error(error.message || 'Erro ao enviar email de redefinição')
    }
  }

  const handleUpdateManager = async () => {
    if (!selectedManager) return

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: editManager.name,
          cpf: editManager.cpf,
          whatsapp: editManager.whatsapp,
          max_clients: editManager.max_clients
        })
        .eq('id', selectedManager.id)

      if (error) throw error

      toast.success('Gerente atualizado com sucesso!')
      setEditModalOpen(false)
      loadManagers()
    } catch (error: any) {
      console.error('Erro ao atualizar gerente:', error)
      toast.error(error.message || 'Erro ao atualizar gerente')
    }
  }

  const handleSuspendManager = async (manager: Manager) => {
    const newStatus = manager.status === 'active' ? 'suspended' : 'active'
    const action = newStatus === 'suspended' ? 'suspender' : 'reativar'
    
    if (!confirm(`Deseja realmente ${action} este gerente?`)) return

    try {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', manager.id)

      if (error) throw error

      toast.success(`Gerente ${newStatus === 'suspended' ? 'suspenso' : 'reativado'} com sucesso!`)
      loadManagers()
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error)
      toast.error(error.message || 'Erro ao atualizar status')
    }
  }

  const handleDeleteManager = async (id: string) => {
    if (!confirm('Deseja realmente excluir este gerente?')) return

    try {
      await supabase
        .from('users')
        .delete()
        .eq('id', id)

      toast.success('Gerente excluído')
      loadManagers()
    } catch (error) {
      toast.error('Erro ao excluir gerente')
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Configurações Avançadas
        </h1>
        <p className="text-muted-foreground">
          Gerencie gerentes de contas, taxas e limites do sistema
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="managers" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Shield className="mr-2" size={16} />
            Gerentes
          </TabsTrigger>
          <TabsTrigger value="taxes" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <DollarSign className="mr-2" size={16} />
            Taxas
          </TabsTrigger>
          <TabsTrigger value="limits" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Lock className="mr-2" size={16} />
            Limites
          </TabsTrigger>
        </TabsList>

        {/* Tab: Gerentes */}
        <TabsContent value="managers" className="space-y-6">
          {/* Botão Adicionar Gerente */}
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <Button
                onClick={() => setModalOpen(true)}
                className="w-full md:w-auto bg-primary hover:bg-primary/90"
                size="lg"
              >
                <UserPlus size={20} className="mr-2" />
                Adicionar Novo Gerente
              </Button>
            </CardContent>
          </Card>

          {/* Modal Criar Gerente */}
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onClose={() => setModalOpen(false)}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus size={24} className="text-primary" />
                  Cadastrar Novo Gerente
                </DialogTitle>
                <DialogDescription>
                  Preencha as informações do gerente de contas
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Upload de Foto */}
                <div className="flex flex-col items-center gap-4 p-6 bg-accent/30 rounded-lg border border-border">
                  <div className="relative">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-32 h-32 rounded-full object-cover border-4 border-primary"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-accent flex items-center justify-center border-4 border-border">
                        <Camera size={48} className="text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <Label htmlFor="photo-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                      <Upload size={18} />
                      <span>{photoPreview ? 'Trocar Foto' : 'Selecionar Foto'}</span>
                    </div>
                    <Input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </Label>
                  <p className="text-muted-foreground text-xs text-center">
                    Recomendado: 400x400px, máx 2MB
                  </p>
                </div>

                {/* Formulário */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">Nome Completo *</Label>
                    <Input
                      placeholder="João Silva"
                      value={newManager.name}
                      onChange={(e) => setNewManager({ ...newManager, name: e.target.value })}
                      className="bg-input border-border text-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">CPF *</Label>
                    <Input
                      placeholder="000.000.000-00"
                      value={newManager.cpf}
                      onChange={(e) => setNewManager({ ...newManager, cpf: e.target.value })}
                      className="bg-input border-border text-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">Email *</Label>
                    <Input
                      type="email"
                      placeholder="joao@exemplo.com"
                      value={newManager.email}
                      onChange={(e) => setNewManager({ ...newManager, email: e.target.value })}
                      className="bg-input border-border text-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground flex items-center gap-2">
                      <MessageCircle size={16} className="text-green-500" />
                      WhatsApp *
                    </Label>
                    <Input
                      placeholder="(11) 99999-9999"
                      value={newManager.whatsapp}
                      onChange={(e) => setNewManager({ ...newManager, whatsapp: e.target.value })}
                      className="bg-input border-border text-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">Senha *</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={newManager.password}
                      onChange={(e) => setNewManager({ ...newManager, password: e.target.value })}
                      className="bg-input border-border text-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">Máximo de Clientes</Label>
                    <Input
                      type="number"
                      value={newManager.max_clients}
                      onChange={(e) => setNewManager({ ...newManager, max_clients: parseInt(e.target.value) })}
                      className="bg-input border-border text-foreground"
                    />
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-3 justify-end pt-4 border-t border-border">
                  <Button
                    onClick={() => setModalOpen(false)}
                    variant="outline"
                    className="border-border"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateManager}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <UserPlus size={18} className="mr-2" />
                    Criar Gerente
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Modal Visualizar Gerente */}
          <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Eye size={24} className="text-blue-500" />
                  Detalhes do Gerente
                </DialogTitle>
              </DialogHeader>

              {selectedManager && (
                <div className="space-y-6 mt-4">
                  {/* Foto */}
                  <div className="flex justify-center">
                    {selectedManager.photo_url ? (
                      <img
                        src={selectedManager.photo_url}
                        alt={selectedManager.name}
                        className="w-32 h-32 rounded-full object-cover border-4 border-primary"
                      />
                    ) : (
                      <div className="w-32 h-32 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-4xl">
                          {selectedManager.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Informações */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-sm">Nome</Label>
                      <p className="text-foreground font-medium">{selectedManager.name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">Email</Label>
                      <p className="text-foreground font-medium">{selectedManager.email}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">CPF</Label>
                      <p className="text-foreground font-medium">{selectedManager.cpf}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">WhatsApp</Label>
                      <p className="text-foreground font-medium">{selectedManager.whatsapp}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">Clientes</Label>
                      <p className="text-foreground font-medium">
                        {selectedManager.current_clients || 0}/{selectedManager.max_clients}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">Status</Label>
                      <p className={`font-medium ${
                        selectedManager.status === 'active' ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {selectedManager.status === 'active' ? 'Ativo' : 'Suspenso'}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={() => setViewModalOpen(false)}
                      variant="outline"
                    >
                      Fechar
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Modal Editar Gerente */}
          <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Edit size={24} className="text-yellow-500" />
                  Editar Gerente
                </DialogTitle>
              </DialogHeader>

              {selectedManager && (
                <div className="space-y-6 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome Completo *</Label>
                      <Input
                        value={editManager.name}
                        onChange={(e) => setEditManager({ ...editManager, name: e.target.value })}
                        placeholder="Nome do gerente"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>CPF *</Label>
                      <Input
                        value={editManager.cpf}
                        onChange={(e) => setEditManager({ ...editManager, cpf: e.target.value })}
                        placeholder="000.000.000-00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>WhatsApp *</Label>
                      <Input
                        value={editManager.whatsapp}
                        onChange={(e) => setEditManager({ ...editManager, whatsapp: e.target.value })}
                        placeholder="(00) 00000-0000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Máximo de Clientes *</Label>
                      <Input
                        type="number"
                        value={editManager.max_clients}
                        onChange={(e) => setEditManager({ ...editManager, max_clients: parseInt(e.target.value) || 0 })}
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={() => setEditModalOpen(false)}
                      variant="outline"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleUpdateManager}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Save size={18} className="mr-2" />
                      Salvar Alterações
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Modal Trocar Senha */}
          <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Key size={24} className="text-purple-500" />
                  Redefinir Senha
                </DialogTitle>
                <DialogDescription>
                  Enviar email de redefinição de senha para {selectedManager?.name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <p className="text-sm text-blue-400">
                    <span className="font-medium">📧 Como funciona:</span>
                    <br />
                    Um email será enviado para <strong>{selectedManager?.email}</strong> com um link para redefinir a senha.
                  </p>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <p className="text-sm text-yellow-400">
                    <span className="font-medium">⚠️ Importante:</span>
                    <br />
                    O gerente precisará acessar o email e clicar no link para definir uma nova senha.
                  </p>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-border">
                  <Button
                    onClick={() => setPasswordModalOpen(false)}
                    variant="outline"
                    className="border-border"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleUpdatePassword}
                    className="bg-purple-500 hover:bg-purple-600"
                  >
                    <Key size={18} className="mr-2" />
                    Enviar Email
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Lista de Gerentes */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users size={24} />
                  Gerentes Cadastrados ({managers.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {managers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum gerente cadastrado
                  </p>
                ) : (
                  managers.map((manager) => (
                    <div
                      key={manager.id}
                      className="flex items-center justify-between p-4 bg-accent/50 border border-border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {/* Foto do Gerente */}
                        {manager.photo_url ? (
                          <img
                            src={manager.photo_url}
                            alt={manager.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-primary"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {manager.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <p className="text-foreground font-medium">{manager.name}</p>
                          <p className="text-muted-foreground text-sm">{manager.email}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <p className="text-muted-foreground text-xs">CPF: {manager.cpf}</p>
                            {manager.whatsapp && (
                              <a
                                href={`https://wa.me/${manager.whatsapp.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-green-500 text-xs hover:underline"
                              >
                                <MessageCircle size={12} />
                                {manager.whatsapp}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-foreground font-medium">
                            {manager.current_clients || 0}/{manager.max_clients} clientes
                          </p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            manager.status === 'active' 
                              ? 'bg-green-500/10 text-green-500' 
                              : 'bg-red-500/10 text-red-500'
                          }`}>
                            {manager.status === 'active' ? 'Ativo' : 'Suspenso'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleViewManager(manager)}
                            variant="outline"
                            size="sm"
                            className="border-blue-500 text-blue-500 hover:bg-blue-500/10"
                            title="Visualizar"
                          >
                            <Eye size={16} />
                          </Button>

                          <Button
                            onClick={() => handleEditManager(manager)}
                            variant="outline"
                            size="sm"
                            className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </Button>

                          <Button
                            onClick={() => handleChangePassword(manager)}
                            variant="outline"
                            size="sm"
                            className="border-purple-500 text-purple-500 hover:bg-purple-500/10"
                            title="Trocar Senha"
                          >
                            <Key size={16} />
                          </Button>

                          <Button
                            onClick={() => handleSuspendManager(manager)}
                            variant="outline"
                            size="sm"
                            className={manager.status === 'active' 
                              ? 'border-orange-500 text-orange-500 hover:bg-orange-500/10' 
                              : 'border-green-500 text-green-500 hover:bg-green-500/10'
                            }
                            title={manager.status === 'active' ? 'Suspender' : 'Reativar'}
                          >
                            {manager.status === 'active' ? <Ban size={16} /> : <CheckCircle size={16} />}
                          </Button>

                          <Button
                            onClick={() => handleDeleteManager(manager.id)}
                            variant="outline"
                            size="sm"
                            className="border-red-500 text-red-500 hover:bg-red-500/10"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Taxas */}
        <TabsContent value="taxes" className="space-y-6">
          {/* Taxas PIX */}
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground flex items-center gap-2">
                <DollarSign size={24} className="text-primary" />
                Taxas PIX
              </CardTitle>
              <Button
                onClick={handleUpdateTaxes}
                className="bg-primary hover:bg-primary/90"
              >
                <Save size={18} className="mr-2" />
                Salvar Alterações
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Envio PIX */}
                <div className="space-y-4 p-4 bg-accent/30 rounded-lg border border-border">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <TrendingUp className="text-red-500" size={20} />
                    Envio PIX
                  </h3>
                  
                  <div className="space-y-2">
                    <Label className="text-foreground">Taxa Percentual (%)</Label>
                    <p className="text-muted-foreground text-xs">Cobrada sobre o valor enviado</p>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.5"
                        value={taxValues['pix_send_fee_percentage'] || ''}
                        onChange={(e) => setTaxValues({
                          ...taxValues,
                          pix_send_fee_percentage: e.target.value
                        })}
                        className="bg-input border-border text-foreground pr-12"
                      />
                      <span className="absolute right-3 top-3 text-muted-foreground font-medium">%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">Taxa Fixa (R$)</Label>
                    <p className="text-muted-foreground text-xs">Valor fixo por transação</p>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="1.00"
                        value={taxValues['pix_send_fee_fixed'] || ''}
                        onChange={(e) => setTaxValues({
                          ...taxValues,
                          pix_send_fee_fixed: e.target.value
                        })}
                        className="bg-input border-border text-foreground pr-12"
                      />
                      <span className="absolute right-3 top-3 text-muted-foreground font-medium">R$</span>
                    </div>
                  </div>
                </div>

                {/* Recebimento PIX */}
                <div className="space-y-4 p-4 bg-accent/30 rounded-lg border border-border">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <TrendingUp className="text-green-500" size={20} />
                    Recebimento PIX
                  </h3>
                  
                  <div className="space-y-2">
                    <Label className="text-foreground">Taxa Percentual (%)</Label>
                    <p className="text-muted-foreground text-xs">Cobrada sobre o valor recebido</p>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0"
                        value={taxValues['pix_receive_fee_percentage'] || ''}
                        onChange={(e) => setTaxValues({
                          ...taxValues,
                          pix_receive_fee_percentage: e.target.value
                        })}
                        className="bg-input border-border text-foreground pr-12"
                      />
                      <span className="absolute right-3 top-3 text-muted-foreground font-medium">%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">Taxa Fixa (R$)</Label>
                    <p className="text-muted-foreground text-xs">Valor fixo por transação</p>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0"
                        value={taxValues['pix_receive_fee_fixed'] || ''}
                        onChange={(e) => setTaxValues({
                          ...taxValues,
                          pix_receive_fee_fixed: e.target.value
                        })}
                        className="bg-input border-border text-foreground pr-12"
                      />
                      <span className="absolute right-3 top-3 text-muted-foreground font-medium">R$</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Outras Taxas */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Percent size={24} className="text-primary" />
                Juros e Rendimentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-foreground">Taxa de Juros Mensal (%)</Label>
                  <p className="text-muted-foreground text-xs">Aplicada mensalmente sobre saldos</p>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.8"
                      value={taxValues['interest_rate_monthly'] || ''}
                      onChange={(e) => setTaxValues({
                        ...taxValues,
                        interest_rate_monthly: e.target.value
                      })}
                      className="bg-input border-border text-foreground pr-12"
                    />
                    <span className="absolute right-3 top-3 text-muted-foreground font-medium">%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Rendimento sobre Saldo (%)</Label>
                  <p className="text-muted-foreground text-xs">Rendimento mensal para clientes</p>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.5"
                      value={taxValues['balance_yield_monthly'] || ''}
                      onChange={(e) => setTaxValues({
                        ...taxValues,
                        balance_yield_monthly: e.target.value
                      })}
                      className="bg-input border-border text-foreground pr-12"
                    />
                    <span className="absolute right-3 top-3 text-muted-foreground font-medium">%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview de Cálculo */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <TrendingUp size={24} className="text-blue-500" />
                Simulação de Taxas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-accent/50 rounded-lg">
                  <p className="text-muted-foreground text-sm mb-1">Envio PIX R$ 100,00</p>
                  <p className="text-foreground text-lg font-bold">
                    Taxa: R$ {(
                      (parseFloat(taxValues['pix_send_fee_percentage'] || '0') / 100 * 100) +
                      parseFloat(taxValues['pix_send_fee_fixed'] || '0')
                    ).toFixed(2)}
                  </p>
                </div>
                
                <div className="p-4 bg-accent/50 rounded-lg">
                  <p className="text-muted-foreground text-sm mb-1">Recebimento PIX R$ 100,00</p>
                  <p className="text-foreground text-lg font-bold">
                    Taxa: R$ {(
                      (parseFloat(taxValues['pix_receive_fee_percentage'] || '0') / 100 * 100) +
                      parseFloat(taxValues['pix_receive_fee_fixed'] || '0')
                    ).toFixed(2)}
                  </p>
                </div>

                <div className="p-4 bg-accent/50 rounded-lg">
                  <p className="text-muted-foreground text-sm mb-1">Rendimento R$ 1.000,00/mês</p>
                  <p className="text-foreground text-lg font-bold">
                    R$ {(parseFloat(taxValues['balance_yield_monthly'] || '0') / 100 * 1000).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Limites */}
        <TabsContent value="limits" className="space-y-6">
          {/* Limites de Transação */}
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground flex items-center gap-2">
                <Lock size={24} className="text-yellow-500" />
                Limites de Transação
              </CardTitle>
              <Button
                onClick={handleUpdateTaxes}
                className="bg-primary hover:bg-primary/90"
              >
                <Save size={18} className="mr-2" />
                Salvar Limites
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Limites Diários */}
                <div className="space-y-4 p-4 bg-accent/30 rounded-lg border border-border">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <TrendingUp className="text-orange-500" size={20} />
                    Limites Diários
                  </h3>
                  
                  <div className="space-y-2">
                    <Label className="text-foreground">Limite de Envio Diário (R$)</Label>
                    <p className="text-muted-foreground text-xs">Valor máximo por dia para envios</p>
                    <div className="relative">
                      <Input
                        type="number"
                        step="100"
                        min="0"
                        placeholder="5000"
                        value={taxValues['daily_send_limit'] || ''}
                        onChange={(e) => setTaxValues({
                          ...taxValues,
                          daily_send_limit: e.target.value
                        })}
                        className="bg-input border-border text-foreground pr-12"
                      />
                      <span className="absolute right-3 top-3 text-muted-foreground font-medium">R$</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">Limite de Recebimento Diário (R$)</Label>
                    <p className="text-muted-foreground text-xs">Valor máximo por dia para recebimentos</p>
                    <div className="relative">
                      <Input
                        type="number"
                        step="100"
                        min="0"
                        placeholder="10000"
                        value={taxValues['daily_receive_limit'] || ''}
                        onChange={(e) => setTaxValues({
                          ...taxValues,
                          daily_receive_limit: e.target.value
                        })}
                        className="bg-input border-border text-foreground pr-12"
                      />
                      <span className="absolute right-3 top-3 text-muted-foreground font-medium">R$</span>
                    </div>
                  </div>
                </div>

                {/* Limites Mensais */}
                <div className="space-y-4 p-4 bg-accent/30 rounded-lg border border-border">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <TrendingUp className="text-blue-500" size={20} />
                    Limites Mensais
                  </h3>
                  
                  <div className="space-y-2">
                    <Label className="text-foreground">Limite de Envio Mensal (R$)</Label>
                    <p className="text-muted-foreground text-xs">Valor máximo por mês para envios</p>
                    <div className="relative">
                      <Input
                        type="number"
                        step="1000"
                        min="0"
                        placeholder="50000"
                        value={taxValues['monthly_send_limit'] || ''}
                        onChange={(e) => setTaxValues({
                          ...taxValues,
                          monthly_send_limit: e.target.value
                        })}
                        className="bg-input border-border text-foreground pr-12"
                      />
                      <span className="absolute right-3 top-3 text-muted-foreground font-medium">R$</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">Limite de Recebimento Mensal (R$)</Label>
                    <p className="text-muted-foreground text-xs">Valor máximo por mês para recebimentos</p>
                    <div className="relative">
                      <Input
                        type="number"
                        step="1000"
                        min="0"
                        placeholder="100000"
                        value={taxValues['monthly_receive_limit'] || ''}
                        onChange={(e) => setTaxValues({
                          ...taxValues,
                          monthly_receive_limit: e.target.value
                        })}
                        className="bg-input border-border text-foreground pr-12"
                      />
                      <span className="absolute right-3 top-3 text-muted-foreground font-medium">R$</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Limites por Transação */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <DollarSign size={24} className="text-green-500" />
                Limites por Transação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-foreground">Valor Mínimo PIX (R$)</Label>
                  <p className="text-muted-foreground text-xs">Menor valor permitido</p>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="1.00"
                      value={taxValues['min_transaction_value'] || ''}
                      onChange={(e) => setTaxValues({
                        ...taxValues,
                        min_transaction_value: e.target.value
                      })}
                      className="bg-input border-border text-foreground pr-12"
                    />
                    <span className="absolute right-3 top-3 text-muted-foreground font-medium">R$</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Valor Máximo PIX (R$)</Label>
                  <p className="text-muted-foreground text-xs">Maior valor permitido</p>
                  <div className="relative">
                    <Input
                      type="number"
                      step="100"
                      min="0"
                      placeholder="10000"
                      value={taxValues['max_transaction_value'] || ''}
                      onChange={(e) => setTaxValues({
                        ...taxValues,
                        max_transaction_value: e.target.value
                      })}
                      className="bg-input border-border text-foreground pr-12"
                    />
                    <span className="absolute right-3 top-3 text-muted-foreground font-medium">R$</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Máx. Transações/Dia</Label>
                  <p className="text-muted-foreground text-xs">Quantidade máxima</p>
                  <div className="relative">
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      placeholder="20"
                      value={taxValues['max_daily_transactions'] || ''}
                      onChange={(e) => setTaxValues({
                        ...taxValues,
                        max_daily_transactions: e.target.value
                      })}
                      className="bg-input border-border text-foreground pr-12"
                    />
                    <span className="absolute right-3 top-3 text-muted-foreground font-medium">un.</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumo Visual */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Shield size={24} className="text-purple-500" />
                Resumo de Limites Configurados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <p className="text-orange-500 text-xs mb-1">Envio Diário</p>
                  <p className="text-foreground font-bold">
                    R$ {parseFloat(taxValues['daily_send_limit'] || '0').toLocaleString('pt-BR')}
                  </p>
                </div>

                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-500 text-xs mb-1">Envio Mensal</p>
                  <p className="text-foreground font-bold">
                    R$ {parseFloat(taxValues['monthly_send_limit'] || '0').toLocaleString('pt-BR')}
                  </p>
                </div>

                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-green-500 text-xs mb-1">Máx. por PIX</p>
                  <p className="text-foreground font-bold">
                    R$ {parseFloat(taxValues['max_transaction_value'] || '0').toLocaleString('pt-BR')}
                  </p>
                </div>

                <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <p className="text-purple-500 text-xs mb-1">PIX por Dia</p>
                  <p className="text-foreground font-bold">
                    {taxValues['max_daily_transactions'] || '0'} transações
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
