import { toast as sonnerToast } from 'sonner'
import { CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react'

/**
 * Toast moderno e estilizado para o sistema
 * Usa Sonner com ícones do Lucide React
 */

export const toast = {
  /**
   * Toast de sucesso (verde)
   */
  success: (message: string, description?: string) => {
    return sonnerToast.success(message, {
      description,
      icon: <CheckCircle className="text-green-500" size={20} />,
    })
  },

  /**
   * Toast de erro (vermelho)
   */
  error: (message: string, description?: string) => {
    return sonnerToast.error(message, {
      description,
      icon: <XCircle className="text-red-500" size={20} />,
    })
  },

  /**
   * Toast de aviso (amarelo)
   */
  warning: (message: string, description?: string) => {
    return sonnerToast.warning(message, {
      description,
      icon: <AlertTriangle className="text-yellow-500" size={20} />,
    })
  },

  /**
   * Toast de informação (azul)
   */
  info: (message: string, description?: string) => {
    return sonnerToast.info(message, {
      description,
      icon: <Info className="text-blue-500" size={20} />,
    })
  },

  /**
   * Toast de loading (com spinner)
   */
  loading: (message: string, description?: string) => {
    return sonnerToast.loading(message, {
      description,
      icon: <Loader2 className="text-primary animate-spin" size={20} />,
    })
  },

  /**
   * Toast customizado
   */
  custom: (message: string, options?: any) => {
    return sonnerToast(message, options)
  },

  /**
   * Toast com promessa (mostra loading, depois success ou error)
   */
  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading,
      success: (data) => typeof success === 'function' ? success(data) : success,
      error: (err) => typeof error === 'function' ? error(err) : error,
    })
  },

  /**
   * Dismissar toast específico
   */
  dismiss: (toastId?: string | number) => {
    return sonnerToast.dismiss(toastId)
  },
}
