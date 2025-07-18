const CACHE_NAME = "tabungan-siswa-v2"; // Ubah nama cache untuk memastikan Service Worker baru diinstal
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  // Pastikan Anda memiliki folder /icons/ di root aplikasi Anda
  // dan file-file ini ada di dalamnya.
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "https://cdn.tailwindcss.com", // Tailwind CSS CDN
  "https://cdn.jsdelivr.net/npm/chart.js", // Chart.js CDN
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap", // Google Fonts CSS
  // Tambahkan URL Firebase SDK agar dapat di-cache
  "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js",
  "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js",
  "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js",
];

// Install event: Cache assets
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] Caching all content");
        return cache.addAll(urlsToCache).catch((error) => {
          console.error("[Service Worker] Failed to cache some URLs:", error);
          // Anda bisa memilih untuk melempar error atau melanjutkan
          // Jika Anda ingin instalasi gagal jika ada satu file yang hilang, lempar error
          // throw error;
        });
      })
      .then(() => self.skipWaiting()) // Memaksa Service Worker baru untuk segera aktif
  );
});

// Activate event: Clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...");
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              console.log("[Service Worker] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim()) // Memaksa Service Worker untuk mengambil kendali klien segera
  );
});

// Fetch event: Serve from cache first, then network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }
      // No cache hit - fetch from network
      return fetch(event.request)
        .then(function (response) {
          // Check if we received a valid response
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // IMPORTANT: Clone the response. A response is a stream
          // and can only be consumed once. We consume it once to cache it,
          // and once the browser consumes it.
          var responseToCache = response.clone();

          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch((error) => {
          // Tangani kesalahan fetch (misalnya, offline dan tidak ada di cache)
          console.error(
            "[Service Worker] Fetch failed:",
            event.request.url,
            error
          );
          // Anda bisa mengembalikan fallback page di sini jika diperlukan
          // return caches.match('/offline.html');
          return new Response(
            "<h1>Offline</h1><p>Anda sedang offline dan halaman ini tidak di-cache.</p>",
            {
              headers: { "Content-Type": "text/html" },
            }
          );
        });
    })
  );
});
