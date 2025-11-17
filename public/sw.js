// Service Worker para Dimpay Pagamentos PWA
const CACHE_NAME = 'dimpay-v1';

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Instalando...');
  // Pular a espera e ativar imediatamente
  self.skipWaiting();
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Ativado');
  // Limpar caches antigos
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Tomar controle imediatamente
  return self.clients.claim();
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  // Apenas fazer cache de requisições GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorar requisições de API
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retornar do cache se existir
        if (response) {
          return response;
        }
        
        // Caso contrário, buscar da rede
        return fetch(event.request)
          .then((response) => {
            // Verificar se é uma resposta válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar a resposta
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.error('❌ Erro ao buscar:', error);
            // Retornar uma resposta offline se disponível
            return caches.match('/index.html');
          });
      })
  );
});

// Sincronização em background
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Sincronização em background');
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// Notificações push
self.addEventListener('push', (event) => {
  console.log('📬 Service Worker: Push recebido');
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Dimpay Pagamentos';
  const options = {
    body: data.body || 'Você tem uma nova notificação',
    icon: '/icons/icon.svg',
    badge: '/icons/icon.svg',
    vibrate: [200, 100, 200],
    data: data.url || '/',
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Fechar' }
    ]
  };
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Service Worker: Notificação clicada');
  event.notification.close();
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data || '/')
    );
  }
});

// Função auxiliar para sincronizar dados
async function syncData() {
  try {
    console.log('🔄 Sincronizando dados...');
    // Implementar lógica de sincronização aqui
    return Promise.resolve();
  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
    return Promise.reject(error);
  }
}
