self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  // Clear old caches if needed
});

self.addEventListener('fetch', (e) => {
  // Serves requests online, satisfying PWA install criteria
});
