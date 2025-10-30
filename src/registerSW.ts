// Registrar Service Worker para PWA
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registrado:', registration.scope)
          
          // Verificar atualizações
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('🔄 Nova versão disponível! Recarregue a página.')
                  // Você pode mostrar uma notificação aqui
                  if (confirm('Nova versão disponível! Deseja atualizar?')) {
                    window.location.reload()
                  }
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('❌ Erro ao registrar Service Worker:', error)
        })
    })
  } else {
    console.log('⚠️ Service Worker não suportado neste navegador')
  }
}

// Desregistrar Service Worker (útil para desenvolvimento)
export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister()
        console.log('🗑️ Service Worker desregistrado')
      })
      .catch((error) => {
        console.error('❌ Erro ao desregistrar Service Worker:', error)
      })
  }
}
