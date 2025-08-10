/**
 * CotAi Edge - Cloudflare Worker for Edge Caching and Optimization
 * Handles intelligent caching, API proxy, and static asset optimization
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cacheKey = new Request(url.toString(), request);
    const cache = caches.default;

    // Check if request is for static assets
    if (isStaticAsset(url.pathname)) {
      return handleStaticAsset(request, cache, cacheKey, env);
    }

    // Check if request is for API
    if (url.pathname.startsWith('/api/')) {
      return handleAPI(request, env);
    }

    // Handle document uploads
    if (url.pathname.startsWith('/uploads/')) {
      return handleDocuments(request, env);
    }

    // Handle main application
    return handleApplication(request, cache, cacheKey, env);
  },
};

/**
 * Check if the path is for a static asset
 */
function isStaticAsset(pathname) {
  const staticExtensions = [
    '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
    '.woff', '.woff2', '.ttf', '.eot', '.webp', '.avif'
  ];
  return staticExtensions.some(ext => pathname.endsWith(ext)) || 
         pathname.startsWith('/_next/static/');
}

/**
 * Handle static asset requests with aggressive caching
 */
async function handleStaticAsset(request, cache, cacheKey, env) {
  // Check cache first
  let response = await cache.match(cacheKey);
  
  if (response) {
    console.log('Cache HIT for static asset:', request.url);
    return response;
  }

  // Fetch from origin
  response = await fetch(request);
  
  if (response.ok) {
    // Clone response for caching
    const responseToCache = response.clone();
    
    // Add cache headers for static assets
    const headers = new Headers(responseToCache.headers);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('X-Cache-Status', 'MISS');
    
    const cachedResponse = new Response(responseToCache.body, {
      status: responseToCache.status,
      statusText: responseToCache.statusText,
      headers: headers
    });
    
    // Cache for 1 year
    ctx.waitUntil(cache.put(cacheKey, cachedResponse.clone()));
    console.log('Cache MISS for static asset:', request.url);
    
    return cachedResponse;
  }
  
  return response;
}

/**
 * Handle API requests with intelligent caching
 */
async function handleAPI(request, env) {
  const url = new URL(request.url);
  
  // Don't cache POST, PUT, DELETE requests
  if (request.method !== 'GET') {
    return fetch(request);
  }
  
  // Cache safe API endpoints for short periods
  const cachableEndpoints = [
    '/api/health',
    '/api/suppliers',
    '/api/pncp/opportunities'
  ];
  
  const shouldCache = cachableEndpoints.some(endpoint => 
    url.pathname.startsWith(endpoint)
  );
  
  if (!shouldCache) {
    return fetch(request);
  }
  
  // Try to get from KV cache
  const cacheKey = `api:${url.pathname}:${url.search}`;
  let cachedResponse = await env.CACHE?.get(cacheKey);
  
  if (cachedResponse) {
    console.log('KV Cache HIT for API:', request.url);
    return new Response(cachedResponse, {
      headers: {
        'Content-Type': 'application/json',
        'X-Cache-Status': 'HIT',
        'X-Cache-Source': 'KV'
      }
    });
  }
  
  // Fetch from origin
  const response = await fetch(request);
  
  if (response.ok && response.status === 200) {
    const responseText = await response.text();
    
    // Cache for 5 minutes
    ctx.waitUntil(
      env.CACHE?.put(cacheKey, responseText, { expirationTtl: 300 })
    );
    
    console.log('KV Cache MISS for API:', request.url);
    
    return new Response(responseText, {
      headers: {
        'Content-Type': 'application/json',
        'X-Cache-Status': 'MISS',
        'X-Cache-Source': 'ORIGIN'
      }
    });
  }
  
  return response;
}

/**
 * Handle document uploads and storage
 */
async function handleDocuments(request, env) {
  const url = new URL(request.url);
  
  if (request.method === 'GET') {
    // Serve documents from R2
    try {
      const objectKey = url.pathname.replace('/uploads/', '');
      const object = await env.DOCUMENTS?.get(objectKey);
      
      if (object) {
        const headers = new Headers();
        headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
        headers.set('Cache-Control', 'public, max-age=86400');
        headers.set('X-Storage-Source', 'R2');
        
        return new Response(object.body, { headers });
      }
    } catch (error) {
      console.error('R2 fetch error:', error);
    }
  }
  
  // Proxy to origin for other methods or fallback
  return fetch(request);
}

/**
 * Handle main application requests
 */
async function handleApplication(request, cache, cacheKey, env) {
  const url = new URL(request.url);
  
  // Don't cache dynamic pages for authenticated users
  if (request.headers.get('Authorization') || 
      request.headers.get('Cookie')?.includes('supabase-auth-token')) {
    return fetch(request);
  }
  
  // Cache public pages
  const publicPages = ['/', '/login', '/register'];
  const shouldCache = publicPages.includes(url.pathname);
  
  if (!shouldCache) {
    return fetch(request);
  }
  
  // Check cache
  let response = await cache.match(cacheKey);
  
  if (response) {
    console.log('Cache HIT for page:', request.url);
    return response;
  }
  
  // Fetch from origin
  response = await fetch(request);
  
  if (response.ok) {
    const responseToCache = response.clone();
    const headers = new Headers(responseToCache.headers);
    headers.set('Cache-Control', 'public, max-age=300, s-maxage=3600');
    headers.set('X-Cache-Status', 'MISS');
    
    const cachedResponse = new Response(responseToCache.body, {
      status: responseToCache.status,
      statusText: responseToCache.statusText,
      headers: headers
    });
    
    // Cache for 5 minutes
    ctx.waitUntil(cache.put(cacheKey, cachedResponse.clone()));
    console.log('Cache MISS for page:', request.url);
    
    return cachedResponse;
  }
  
  return response;
}