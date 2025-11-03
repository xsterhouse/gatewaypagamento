import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { SelectNative } from './ui/select-native'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { checkoutService, PaymentLink } from '@/services/checkoutService'
import { supabase } from '@/lib/supabase'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

interface CreatePaymentLinkModalProps {
  open: boolean
  onClose: () => void
  link?: PaymentLink | null
}

export function CreatePaymentLinkModal({ open, onClose, link }: CreatePaymentLinkModalProps) {
  const { effectiveUserId } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price_type: 'fixed' as 'fixed' | 'variable',
    amount: '',
    min_amount: '',
    max_amount: '',
    allow_quantity: false,
    max_quantity: '1',
    image_url: '',
    success_message: '',
    redirect_url: '',
    expires_at: '',
    max_uses: ''
  })

  useEffect(() => {
    if (link) {
      // Modo edição - preencher com dados do link
      setFormData({
        title: link.title,
        description: link.description || '',
        price_type: link.price_type,
        amount: link.amount?.toString() || '',
        min_amount: link.min_amount?.toString() || '',
        max_amount: link.max_amount?.toString() || '',
        allow_quantity: link.allow_quantity,
        max_quantity: link.max_quantity.toString(),
        image_url: link.image_url || '',
        success_message: link.success_message || '',
        redirect_url: link.redirect_url || '',
        expires_at: link.expires_at ? link.expires_at.split('T')[0] : '',
        max_uses: link.max_uses?.toString() || ''
      })
      setImagePreview(link.image_url || '')
    } else {
      // Modo criação - resetar formulário
      setFormData({
        title: '',
        description: '',
        price_type: 'fixed',
        amount: '',
        min_amount: '',
        max_amount: '',
        allow_quantity: false,
        max_quantity: '1',
        image_url: '',
        success_message: '',
        redirect_url: '',
        expires_at: '',
        max_uses: ''
      })
      setImagePreview('')
      setImageFile(null)
    }
    setActiveTab('basic')
  }, [link, open])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida')
      return
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 5MB')
      return
    }

    setImageFile(file)

    // Criar preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview('')
    setFormData({ ...formData, image_url: '' })
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !effectiveUserId) return formData.image_url || null

    try {
      setUploading(true)
      
      // Gerar nome único para o arquivo
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${effectiveUserId}/${fileName}`

      // Upload para o Supabase Storage
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Erro detalhado:', error)
        
        // Mensagens de erro específicas
        if (error.message.includes('not found')) {
          toast.error('Bucket não encontrado. Configure o Storage primeiro!')
        } else if (error.message.includes('permission')) {
          toast.error('Sem permissão. Execute o SQL de políticas!')
        } else {
          toast.error(`Erro ao fazer upload: ${error.message}`)
        }
        
        return null
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      toast.success('Imagem enviada com sucesso!')
      return urlData.publicUrl
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error)
      toast.error('Erro ao fazer upload da imagem')
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!effectiveUserId) {
      toast.error('Usuário não autenticado')
      return
    }

    // Validações
    if (formData.price_type === 'fixed' && !formData.amount) {
      toast.error('Informe o valor do produto')
      return
    }

    if (formData.price_type === 'variable' && (!formData.min_amount || !formData.max_amount)) {
      toast.error('Informe o valor mínimo e máximo')
      return
    }

    try {
      setLoading(true)

      // Fazer upload da imagem se houver
      let imageUrl = formData.image_url
      if (imageFile) {
        const uploadedUrl = await uploadImage()
        if (uploadedUrl) {
          imageUrl = uploadedUrl
        }
      }

      // Converter data de expiração para ISO mantendo o dia correto
      let expiresAt = undefined
      if (formData.expires_at) {
        // Adicionar horário 23:59:59 para garantir que expire no final do dia
        const date = new Date(formData.expires_at + 'T23:59:59')
        expiresAt = date.toISOString()
      }

      const linkData = {
        title: formData.title,
        description: formData.description || undefined,
        price_type: formData.price_type,
        amount: formData.price_type === 'fixed' ? parseFloat(formData.amount) : undefined,
        min_amount: formData.price_type === 'variable' ? parseFloat(formData.min_amount) : undefined,
        max_amount: formData.price_type === 'variable' ? parseFloat(formData.max_amount) : undefined,
        allow_quantity: formData.allow_quantity,
        max_quantity: parseInt(formData.max_quantity) || 1,
        image_url: imageUrl || undefined,
        success_message: formData.success_message || undefined,
        redirect_url: formData.redirect_url || undefined,
        expires_at: expiresAt,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : undefined
      }

      if (link) {
        // Atualizar link existente
        await checkoutService.updatePaymentLink(link.id, linkData)
        toast.success('Link atualizado com sucesso!')
      } else {
        // Criar novo link
        await checkoutService.createPaymentLink(effectiveUserId, linkData)
        toast.success('Link criado com sucesso!')
      }

      onClose()
    } catch (error: any) {
      toast.error('Erro ao salvar link: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {link ? 'Editar Link de Pagamento' : 'Criar Link de Pagamento'}
          </DialogTitle>
          <DialogDescription>
            Configure seu link personalizado para receber pagamentos
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="pricing">Preço</TabsTrigger>
              <TabsTrigger value="advanced">Avançado</TabsTrigger>
            </TabsList>

            {/* Aba Básico */}
            <TabsContent value="basic" className="space-y-4">
              <div>
                <Label htmlFor="title">Título do Produto/Serviço *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Curso Online de React"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva seu produto ou serviço..."
                  rows={3}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <Label htmlFor="image">Imagem do Produto</Label>
                
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-48 object-cover rounded-lg border border-input"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-input rounded-lg p-8 text-center hover:border-primary transition-colors">
                    <input
                      type="file"
                      id="image"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <label 
                      htmlFor="image" 
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <Upload className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Clique para fazer upload
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, GIF até 5MB
                        </p>
                      </div>
                    </label>
                  </div>
                )}
                
                {uploading && (
                  <p className="text-sm text-blue-600 mt-2 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 animate-pulse" />
                    Fazendo upload...
                  </p>
                )}
              </div>
            </TabsContent>

            {/* Aba Preço */}
            <TabsContent value="pricing" className="space-y-4">
              <div>
                <Label htmlFor="price_type">Tipo de Preço *</Label>
                <SelectNative
                  id="price_type"
                  value={formData.price_type}
                  onChange={(e) => setFormData({ ...formData, price_type: e.target.value as any })}
                >
                  <option value="fixed">Preço Fixo</option>
                  <option value="variable">Preço Variável (cliente escolhe)</option>
                </SelectNative>
              </div>

              {formData.price_type === 'fixed' ? (
                <div>
                  <Label htmlFor="amount">Valor (R$) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="99.90"
                    required={formData.price_type === 'fixed'}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min_amount">Valor Mínimo (R$) *</Label>
                    <Input
                      id="min_amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.min_amount}
                      onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })}
                      placeholder="10.00"
                      required={formData.price_type === 'variable'}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_amount">Valor Máximo (R$) *</Label>
                    <Input
                      id="max_amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.max_amount}
                      onChange={(e) => setFormData({ ...formData, max_amount: e.target.value })}
                      placeholder="1000.00"
                      required={formData.price_type === 'variable'}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allow_quantity"
                  checked={formData.allow_quantity}
                  onChange={(e) => setFormData({ ...formData, allow_quantity: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="allow_quantity" className="cursor-pointer">
                  Permitir escolher quantidade
                </Label>
              </div>

              {formData.allow_quantity && (
                <div>
                  <Label htmlFor="max_quantity">Quantidade Máxima</Label>
                  <Input
                    id="max_quantity"
                    type="number"
                    min="1"
                    value={formData.max_quantity}
                    onChange={(e) => setFormData({ ...formData, max_quantity: e.target.value })}
                    placeholder="10"
                  />
                </div>
              )}
            </TabsContent>

            {/* Aba Avançado */}
            <TabsContent value="advanced" className="space-y-4">
              <div>
                <Label htmlFor="success_message">Mensagem de Sucesso</Label>
                <textarea
                  id="success_message"
                  value={formData.success_message}
                  onChange={(e) => setFormData({ ...formData, success_message: e.target.value })}
                  placeholder="Obrigado pela sua compra! Você receberá um email em breve."
                  rows={2}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mensagem exibida após pagamento confirmado
                </p>
              </div>

              <div>
                <Label htmlFor="redirect_url">URL de Redirecionamento</Label>
                <Input
                  id="redirect_url"
                  type="url"
                  value={formData.redirect_url}
                  onChange={(e) => setFormData({ ...formData, redirect_url: e.target.value })}
                  placeholder="https://seusite.com/obrigado"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Redirecionar cliente após pagamento (opcional)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expires_at">Data de Expiração</Label>
                  <Input
                    id="expires_at"
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Link expira nesta data (opcional)
                  </p>
                </div>

                <div>
                  <Label htmlFor="max_uses">Limite de Usos</Label>
                  <Input
                    id="max_uses"
                    type="number"
                    min="1"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                    placeholder="Ilimitado"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Máximo de vendas (opcional)
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex gap-2">
              {activeTab !== 'basic' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const tabs = ['basic', 'pricing', 'advanced']
                    const currentIndex = tabs.indexOf(activeTab)
                    if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1])
                  }}
                >
                  ← Anterior
                </Button>
              )}
              {activeTab !== 'advanced' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const tabs = ['basic', 'pricing', 'advanced']
                    const currentIndex = tabs.indexOf(activeTab)
                    if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1])
                  }}
                >
                  Próximo →
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : (link ? 'Atualizar' : 'Criar Link')}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
