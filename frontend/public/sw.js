// CotAi Edge Service Worker
const CACHE_NAME = 'cotai-edge-v1.0.0'
const OFFLINE_URL = '/offline'

// Recursos essenciais para cache
const ESSENTIAL_RESOURCES = [
  '/',
  '/dashboard',
  '/login',
  '/offline',
  '/manifest.json'
]

// Recursos estáticos para cache
const STATIC_RESOURCES = [
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// Estratégias de cache
const CACHE_STRATEGIES = {
  // Cache first para recursos estáticos
  CACHE_FIRST: [
    /\.(js|css|woff|woff2|ttf|eot)$/,
    /\/icons\//,
    /\/images\//
  ],
  
  // Network first para APIs e dados dinâmicos
  NETWORK_FIRST: [
    /\/api\//,
    /supabase/,
    /pncp\.gov\.br/
  ],
  
  // Stale while revalidate para páginas
  STALE_WHILE_REVALIDATE: [
    /\/dashboard/,
    /\/cotai/,
    /\/pncp/
  ]
}

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 CotAi Edge SW: Instalando...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 CotAi Edge SW: Cache criado')
        return cache.addAll([...ESSENTIAL_RESOURCES, ...STATIC_RESOURCES])
      })
      .then(() => {
        console.log('✅ CotAi Edge SW: Recursos essenciais cacheados')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('❌ CotAi Edge SW: Erro na instalação:', error)
      })
  )
})

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('🚀 CotAi Edge SW: Ativando...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ CotAi Edge SW: Removendo cache antigo:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('✅ CotAi Edge SW: Ativado e cache limpo')
        return self.clients.claim()
      })
  )
})

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Ignorar requisições não-GET e de outros origins
  if (request.method !== 'GET' || !url.origin.includes(location.origin)) {
    return
  }

  // Determinar estratégia de cache
  const strategy = determineStrategy(url.pathname)
  
  switch (strategy) {
    case 'CACHE_FIRST':
      event.respondWith(handleCacheFirst(request))
      break
    case 'NETWORK_FIRST':
      event.respondWith(handleNetworkFirst(request))
      break
    case 'STALE_WHILE_REVALIDATE':
      event.respondWith(handleStaleWhileRevalidate(request))
      break
    default:
      event.respondWith(handleNetworkFirst(request))
  }
})

// Determinar estratégia baseada na URL
function determineStrategy(pathname) {
  for (const [strategy, patterns] of Object.entries(CACHE_STRATEGIES)) {
    if (patterns.some(pattern => pattern.test(pathname))) {
      return strategy
    }
  }
  return 'NETWORK_FIRST'
}

// Cache First Strategy
async function handleCacheFirst(request) {
  try {
    const cache = await caches.open(CACHE_NAME)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
    
  } catch (error) {
    console.error('❌ Cache First falhou:', error)
    return new Response('Recurso não disponível offline', { status: 503 })
  }
}

// Network First Strategy  
async function handleNetworkFirst(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
    
  } catch (error) {
    console.log('🌐 Rede indisponível, tentando cache...')
    
    const cache = await caches.open(CACHE_NAME)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Se for uma página HTML, retornar página offline
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match(OFFLINE_URL)
    }
    
    return new Response('Conteúdo não disponível offline', { status: 503 })
  }
}

// Stale While Revalidate Strategy
async function handleStaleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME)
  const cachedResponse = await cache.match(request)
  
  // Buscar atualização em background
  const networkRequest = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  }).catch(() => {
    // Ignorar erros de rede em background
  })
  
  // Retornar cache imediatamente se disponível
  return cachedResponse || networkRequest
}

// Push Notifications
self.addEventListener('push', (event) => {
  console.log('🔔 CotAi Edge SW: Push recebido')
  
  const options = {
    title: 'CotAi Edge',
    body: 'Nova notificação disponível',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'cotai-notification',
    renotify: true,
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: 'Ver Detalhes',
        icon: '/icons/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dispensar',
        icon: '/icons/action-dismiss.png'
      }
    ],
    data: {
      url: '/dashboard',
      timestamp: Date.now()
    }
  }
  
  if (event.data) {
    try {
      const payload = event.data.json()
      options.title = payload.title || options.title
      options.body = payload.body || options.body
      options.data.url = payload.url || options.data.url
      options.data.quotationId = payload.quotationId
    } catch (error) {
      console.error('❌ Erro ao processar payload push:', error)
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(options.title, options)
  )
})

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
  console.log('👆 CotAi Edge SW: Notificação clicada')
  
  event.notification.close()
  
  const url = event.notification.data?.url || '/dashboard'
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(url)
    )
  } else if (event.action === 'dismiss') {
    // Apenas fechar a notificação
    return
  } else {
    // Clique na notificação principal
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Tentar focar janela existente
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus()
          }
        }
        
        // Abrir nova janela se nenhuma existir
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      })
    )
  }
})

// Background Sync
self.addEventListener('sync', (event) => {
  console.log('🔄 CotAi Edge SW: Background sync')
  
  if (event.tag === 'background-quotation-sync') {
    event.waitUntil(syncQuotations())
  }
})

// Sincronização de cotações em background
async function syncQuotations() {
  try {
    // Aqui implementaria a lógica de sincronização
    // Por exemplo, enviar cotações pendentes quando a conexão for restaurada
    console.log('📊 Sincronizando cotações em background...')
    
    // Simular sincronização
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    console.log('✅ Cotações sincronizadas')
    
  } catch (error) {
    console.error('❌ Erro na sincronização:', error)
    throw error
  }
}

// Relatório de erro
self.addEventListener('error', (event) => {
  console.error('❌ CotAi Edge SW: Erro:', event.error)
})

// Relatório de erro de promise rejeitada
self.addEventListener('unhandledrejection', (event) => {
  console.error('❌ CotAi Edge SW: Promise rejeitada:', event.reason)
})

console.log('🚀 CotAi Edge Service Worker carregado')