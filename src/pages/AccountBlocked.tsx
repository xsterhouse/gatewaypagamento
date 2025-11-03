import { useEffect, useState } from 'react'
import { Lock, Mail, Phone, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

export function AccountBlocked() {
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    try {
      setLoggingOut(true)
      
      // Limpar localStorage
      localStorage.clear()
      
      // Fazer logout no Supabase
      await supabase.auth.signOut()
      
      // Aguardar um pouco para garantir que o logout foi processado
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Redirecionar para login
      window.location.href = '/login'
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      // Mesmo com erro, redirecionar
      window.location.href = '/login'
    }
  }

  useEffect(() => {
    // Adicionar efeito de blur no fundo
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Efeito Glasgow - Círculos de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-200 dark:bg-red-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-orange-200 dark:bg-orange-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-yellow-200 dark:bg-yellow-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-pulse delay-2000"></div>
      </div>

      {/* Conteúdo Principal */}
      <Card className="max-w-2xl w-full relative z-10 shadow-2xl border-2 border-red-200 dark:border-red-800">
        <CardContent className="p-8 md:p-12">
          {/* Ícone de Bloqueio */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center animate-pulse">
                <Lock className="w-12 h-12 text-red-600 dark:text-red-400" />
              </div>
              <div className="absolute -top-2 -right-2">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Título */}
          <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-4">
            Conta Bloqueada
          </h1>

          {/* Mensagem */}
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
            <p className="text-center text-gray-700 dark:text-gray-300 text-lg mb-4">
              Sua conta foi temporariamente bloqueada por questões de segurança ou violação dos termos de uso.
            </p>
            <p className="text-center text-gray-600 dark:text-gray-400">
              Para mais informações ou para solicitar o desbloqueio, entre em contato com nossa equipe de suporte.
            </p>
          </div>

          {/* Informações de Contato */}
          <div className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-4">
              Entre em Contato
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <a 
                    href="mailto:gerencia@dimpay.com.br"
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline truncate block"
                  >
                    gerencia@dimpay.com.br
                  </a>
                </div>
              </div>

              {/* Telefone */}
              <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Telefone</p>
                  <a 
                    href="tel:+5563992940044"
                    className="text-sm font-medium text-green-600 dark:text-green-400 hover:underline"
                  >
                    (63) 99294-0044
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              <strong>Importante:</strong> Ao entrar em contato, tenha em mãos suas informações de cadastro para agilizar o atendimento.
            </p>
          </div>

          {/* Botão de Logout */}
          <div className="flex justify-center">
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="gap-2"
              disabled={loggingOut}
            >
              {loggingOut ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saindo...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Sair da Conta
                </>
              )}
            </Button>
          </div>

          {/* Rodapé */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              DimPay Gateway de Pagamentos • Suporte disponível 24/7
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
