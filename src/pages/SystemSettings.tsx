import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Settings, DollarSign, Percent, Save } from 'lucide-react'

interface Setting {
  id: string
  setting_key: string
  setting_value: string
  setting_type: string
  description: string
}

export function SystemSettings() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editedValues, setEditedValues] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('setting_key')

      if (error) throw error
      setSettings(data || [])
      
      // Inicializar valores editados
      const initial: { [key: string]: string } = {}
      data?.forEach(s => {
        initial[s.setting_key] = s.setting_value
      })
      setEditedValues(initial)
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
      toast.error('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Não autenticado')

      // Atualizar cada configuração
      for (const [key, value] of Object.entries(editedValues)) {
        await supabase
          .from('system_settings')
          .update({
            setting_value: value,
            updated_by: session.user.id,
            updated_at: new Date().toISOString()
          })
          .eq('setting_key', key)
      }

      toast.success('Configurações salvas com sucesso!')
      loadSettings()
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (key: string, value: string) => {
    setEditedValues({
      ...editedValues,
      [key]: value
    })
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'percentage':
        return <Percent className="text-muted-foreground" size={20} />
      case 'currency':
        return <DollarSign className="text-muted-foreground" size={20} />
      default:
        return <Settings className="text-muted-foreground" size={20} />
    }
  }

  const formatLabel = (key: string) => {
    const translations: { [key: string]: string } = {
      'pix_send_fee_percentage': 'Taxa de Envio PIX (%)',
      'pix_send_fee_fixed': 'Taxa Fixa de Envio PIX',
      'pix_receive_fee_percentage': 'Taxa de Recebimento PIX (%)',
      'pix_receive_fee_fixed': 'Taxa Fixa de Recebimento PIX',
      'interest_rate_monthly': 'Taxa de Juros Mensal',
      'max_transaction_amount': 'Valor Máximo por Transação',
      'daily_transaction_limit': 'Limite Diário de Transações',
      'min_balance': 'Saldo Mínimo',
    }
    
    return translations[key] || key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Configurações do Sistema</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">Gerencie taxas, juros e limites</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary hover:bg-primary/90"
        >
          <Save size={18} className="mr-2" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      {/* Taxas PIX */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <DollarSign size={24} />
            Taxas PIX
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings
            .filter(s => s.setting_key.includes('pix'))
            .map((setting) => (
              <div key={setting.id} className="space-y-2">
                <label className="text-foreground text-sm font-medium flex items-center gap-2">
                  {getIcon(setting.setting_type)}
                  {formatLabel(setting.setting_key)}
                </label>
                <p className="text-muted-foreground text-xs">{setting.description}</p>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    value={editedValues[setting.setting_key] || ''}
                    onChange={(e) => handleChange(setting.setting_key, e.target.value)}
                    className="bg-input border-border text-foreground"
                  />
                  <span className="absolute right-3 top-3 text-muted-foreground text-sm">
                    {setting.setting_type === 'percentage' ? '%' : 'R$'}
                  </span>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>

      {/* Juros e Limites */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Percent size={24} />
            Juros e Limites
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings
            .filter(s => !s.setting_key.includes('pix'))
            .map((setting) => (
              <div key={setting.id} className="space-y-2">
                <label className="text-foreground text-sm font-medium flex items-center gap-2">
                  {getIcon(setting.setting_type)}
                  {formatLabel(setting.setting_key)}
                </label>
                <p className="text-muted-foreground text-xs">{setting.description}</p>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    value={editedValues[setting.setting_key] || ''}
                    onChange={(e) => handleChange(setting.setting_key, e.target.value)}
                    className="bg-input border-border text-foreground"
                  />
                  <span className="absolute right-3 top-3 text-muted-foreground text-sm">
                    {setting.setting_type === 'percentage' ? '%' : 'R$'}
                  </span>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>

      {/* Botão de Salvar (mobile) */}
      <div className="md:hidden">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary hover:bg-primary/90"
          size="lg"
        >
          <Save size={18} className="mr-2" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>
    </div>
  )
}
