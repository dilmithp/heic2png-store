const CACHE_NAME = 'heic2png-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/about.html',
  '/contact.html',
  '/privacy.html',
  '/terms.html',
  '/css/styles.css',
  '/css/ads.css',
  '/js/heic-converter.js',
  '/js/ui.js',
  '/js/adsense.js',
  '/js/analytics.js',
  '/images/logo.png',
  '/images/logo-192.png',
  '/images/logo-512.png',
  '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }

        return fetch(event.request).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for analytics
self.addEventListener('sync', (event) => {
  if (event.tag === 'analytics-sync') {
    event.waitUntil(syncAnalytics());
  }
});

async function syncAnalytics() {
  // Sync offline analytics data when online
  try {
    const analyticsData = await getStoredAnalytics();
    if (analyticsData.length > 0) {
      await sendAnalyticsData(analyticsData);
      await clearStoredAnalytics();
    }
  } catch (error) {
    console.error('Analytics sync failed:', error);
  }
}

async function getStoredAnalytics() {
  // Get analytics data from IndexedDB or localStorage
  return JSON.parse(localStorage.getItem('offline_analytics') || '[]');
}

async function sendAnalyticsData(data) {
  // Send analytics data to server
  // Implementation depends on your analytics setup
}

async function clearStoredAnalytics() {
  localStorage.removeItem('offline_analytics');
}
