import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { User, Lock, Bell, Palette, Key } from 'lucide-react'

export function Configuracoes() {
  const [name, setName] = useState('Kza4')
  const [email, setEmail] = useState('admin@gateway.com')
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false
  })

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Perfil atualizado com sucesso!')
  }

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Senha atualizada com sucesso!')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Configurações</h1>
        <p className="text-muted-foreground">Gerencie suas preferências e configurações da conta</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Perfil */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <User size={20} />
              Perfil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Nome</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background border-border text-foreground"
                />
              </div>
              <Button type="submit" className="w-full">
                Salvar Alterações
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Segurança */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Lock size={20} />
              Segurança
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSavePassword} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Senha Atual</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Nova Senha</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Confirmar Nova Senha</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="bg-background border-border text-foreground"
                />
              </div>
              <Button type="submit" className="w-full">
                Alterar Senha
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Bell size={20} />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground font-medium">Notificações por Email</p>
                <p className="text-muted-foreground text-sm">Receba atualizações por email</p>
              </div>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, email: !prev.email }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.email ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.email ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground font-medium">Notificações Push</p>
                <p className="text-muted-foreground text-sm">Receba notificações no navegador</p>
              </div>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, push: !prev.push }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.push ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.push ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground font-medium">Notificações por SMS</p>
                <p className="text-muted-foreground text-sm">Receba SMS importantes</p>
              </div>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, sms: !prev.sms }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.sms ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.sms ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* API Keys */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Key size={20} />
              Chaves de API
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Public Key</label>
              <div className="flex gap-2">
                <Input
                  value="pk_test_xxxxxxxxxxxxx"
                  readOnly
                  className="bg-background border-border text-foreground font-mono"
                />
                <Button variant="outline" size="icon">
                  <Key size={16} />
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Secret Key</label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value="sk_test_xxxxxxxxxxxxx"
                  readOnly
                  className="bg-background border-border text-foreground font-mono"
                />
                <Button variant="outline" size="icon">
                  <Key size={16} />
                </Button>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              Gerar Novas Chaves
            </Button>
          </CardContent>
        </Card>

        {/* Aparência */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Palette size={20} />
              Aparência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="bg-accent border-2 border-primary rounded-lg p-4 text-left hover:border-primary/50 transition-colors">
                <div className="w-full h-20 bg-gradient-to-br from-gray-900 to-gray-800 rounded mb-3"></div>
                <p className="text-foreground font-medium">Tema Escuro</p>
                <p className="text-muted-foreground text-sm">Tema padrão</p>
              </button>
              <button className="bg-accent border-2 border-border rounded-lg p-4 text-left hover:border-border/50 transition-colors opacity-50 cursor-not-allowed">
                <div className="w-full h-20 bg-gradient-to-br from-white to-gray-100 rounded mb-3"></div>
                <p className="text-foreground font-medium">Tema Claro</p>
                <p className="text-muted-foreground text-sm">Em breve</p>
              </button>
              <button className="bg-accent border-2 border-border rounded-lg p-4 text-left hover:border-border/50 transition-colors opacity-50 cursor-not-allowed">
                <div className="w-full h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded mb-3"></div>
                <p className="text-foreground font-medium">Automático</p>
                <p className="text-muted-foreground text-sm">Em breve</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
