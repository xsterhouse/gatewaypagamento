import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { Download, X, Smartphone, Monitor, Zap } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallModal, setShowInstallModal] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Verificar se já foi rejeitado antes
    const installRejected = localStorage.getItem('pwa-install-rejected')
    if (installRejected) {
      const rejectedDate = new Date(installRejected)
      const now = new Date()
      const daysSinceRejection = (now.getTime() - rejectedDate.getTime()) / (1000 * 60 * 60 * 24)
      
      // Mostrar novamente após 7 dias
      if (daysSinceRejection < 7) {
        return
      }
    }

    // Capturar evento beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      console.log('📱 PWA: Prompt de instalação capturado')
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Mostrar modal IMEDIATAMENTE quando acessar app.dimpay.com.br
      const hostname = window.location.hostname
      if (hostname === 'app.dimpay.com.br' || hostname === 'localhost') {
        // Mostrar imediatamente
        setShowInstallModal(true)
      } else {
        // Para outros domínios, mostrar após 3 segundos
        setTimeout(() => {
          setShowInstallModal(true)
        }, 3000)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Detectar quando o app foi instalado
    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA: App instalado com sucesso!')
      setIsInstalled(true)
      setShowInstallModal(false)
      localStorage.removeItem('pwa-install-rejected')
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) {
      console.log('❌ PWA: Prompt não disponível')
      return
    }

    try {
      // Mostrar prompt nativo
      await deferredPrompt.prompt()
      
      // Aguardar escolha do usuário
      const { outcome } = await deferredPrompt.userChoice
      
      console.log(`📱 PWA: Usuário ${outcome === 'accepted' ? 'aceitou' : 'rejeitou'} a instalação`)
      
      if (outcome === 'accepted') {
        setShowInstallModal(false)
        localStorage.removeItem('pwa-install-rejected')
      } else {
        localStorage.setItem('pwa-install-rejected', new Date().toISOString())
      }
      
      setDeferredPrompt(null)
    } catch (error) {
      console.error('❌ Erro ao instalar PWA:', error)
    }
  }

  const handleDismiss = () => {
    setShowInstallModal(false)
    localStorage.setItem('pwa-install-rejected', new Date().toISOString())
  }

  // Não mostrar se já está instalado
  if (isInstalled) {
    return null
  }

  return (
    <Dialog open={showInstallModal} onOpenChange={setShowInstallModal}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-green-400 rounded-xl flex items-center justify-center">
              <Download className="text-black" size={24} />
            </div>
            Instalar APP Dimpay
          </DialogTitle>
          <DialogDescription className="text-base">
            Deseja instalar o APP Dimpay em seu dispositivo? Tenha acesso rápido e trabalhe offline!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Benefícios */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <Zap className="text-blue-400 mt-0.5" size={20} />
              <div>
                <p className="font-medium text-blue-400">Acesso Rápido</p>
                <p className="text-sm text-muted-foreground">
                  Abra direto da tela inicial, sem navegador
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <Smartphone className="text-green-400 mt-0.5" size={20} />
              <div>
                <p className="font-medium text-green-400">Funciona Offline</p>
                <p className="text-sm text-muted-foreground">
                  Acesse suas carteiras mesmo sem internet
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <Monitor className="text-purple-400 mt-0.5" size={20} />
              <div>
                <p className="font-medium text-purple-400">Notificações</p>
                <p className="text-sm text-muted-foreground">
                  Receba alertas de pagamentos e faturas
                </p>
              </div>
            </div>
          </div>

          {/* Preview do ícone */}
          <div className="flex justify-center py-4">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-primary via-green-400 to-blue-400 rounded-2xl shadow-2xl flex items-center justify-center transform hover:scale-105 transition-transform">
                <span className="text-3xl font-bold text-black">D</span>
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <Download className="text-white" size={16} />
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              onClick={handleDismiss}
              variant="outline"
              className="flex-1"
            >
              <X size={18} className="mr-2" />
              Agora Não
            </Button>
            <Button
              onClick={handleInstall}
              className="flex-1 bg-gradient-to-r from-primary to-green-400 hover:from-primary/90 hover:to-green-400/90 text-black font-semibold"
            >
              <Download size={18} className="mr-2" />
              Instalar App
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Compatível com Android, iOS, Windows, Mac e Linux
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
