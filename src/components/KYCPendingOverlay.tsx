import { AlertCircle, Clock, FileText, LogOut, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'

interface KYCPendingOverlayProps {
  status: 'pending' | 'rejected'
  rejectionReason?: string
}

export function KYCPendingOverlay({ status, rejectionReason }: KYCPendingOverlayProps) {
  const { signOut } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    
    // Navigate immediately using window.location
    window.location.replace('/login')
    
    // Sign out in background (non-blocking)
    signOut().catch(error => {
      console.error('Logout error:', error)
    })
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Glassmorphism Blur Background */}
      <div className="absolute inset-0 backdrop-blur-xl bg-black/30" />
      
      {/* Content */}
      <Card className="relative z-10 w-full max-w-md bg-[#1a1f2e]/95 border-gray-700 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            {status === 'pending' ? (
              <>
                <Clock className="text-yellow-500" size={28} />
                KYC em Análise
              </>
            ) : (
              <>
                <AlertCircle className="text-red-500" size={28} />
                KYC Rejeitado
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'pending' ? (
            <>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-yellow-200 text-sm">
                  Seu cadastro está em análise pela nossa equipe.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <FileText className="text-gray-400 mt-1" size={18} />
                  <div>
                    <p className="text-white font-medium text-sm">Documentos Enviados</p>
                    <p className="text-gray-400 text-xs">
                      Seus documentos foram recebidos e estão sendo verificados
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="text-gray-400 mt-1" size={18} />
                  <div>
                    <p className="text-white font-medium text-sm">Tempo Estimado</p>
                    <p className="text-gray-400 text-xs">
                      A análise pode levar até 24 horas úteis
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-gray-300 text-xs leading-relaxed">
                  Você receberá um email assim que seu cadastro for aprovado.
                  Enquanto isso, você pode explorar o painel, mas algumas funcionalidades
                  estarão limitadas até a aprovação.
                </p>
              </div>

              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full border-gray-700 text-gray-300 hover:text-white"
                disabled={loggingOut}
              >
                {loggingOut ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={16} />
                    Saindo...
                  </>
                ) : (
                  <>
                    <LogOut className="mr-2" size={16} />
                    Sair e Voltar ao Login
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-200 text-sm font-medium mb-2">
                  Seu KYC foi rejeitado
                </p>
                {rejectionReason && (
                  <p className="text-red-300 text-xs">
                    Motivo: {rejectionReason}
                  </p>
                )}
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-gray-300 text-xs leading-relaxed">
                  Entre em contato com nosso suporte para mais informações
                  ou para reenviar seus documentos.
                </p>
              </div>

              <div className="space-y-2">
                <button className="w-full bg-primary hover:bg-primary/90 text-black font-medium py-3 rounded-lg transition-colors">
                  Contatar Suporte
                </button>
                
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full border-gray-700 text-gray-300 hover:text-white"
                  disabled={loggingOut}
                >
                  {loggingOut ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" size={16} />
                      Saindo...
                    </>
                  ) : (
                    <>
                      <LogOut className="mr-2" size={16} />
                      Sair e Voltar ao Login
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
