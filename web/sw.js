/* ==========================================
   Service Worker - 离线支持
   ========================================== */

const CACHE_NAME = 'mc-coords-v4';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/utils.js',
  '/js/data.js',
  '/js/app.js',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon.svg'
];

// 安装 - 缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// 激活 - 清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 网络优先，离线回退缓存
self.addEventListener('fetch', (event) => {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') return;

  // API 请求不缓存
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 缓存成功的响应
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // 离线时从缓存读取
        return caches.match(event.request).then((cached) => {
          return cached || new Response('离线模式', { status: 503 });
        });
      })
  );
});
