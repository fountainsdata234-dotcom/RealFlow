const CACHE_NAME = 'realflow-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/reader.html',
  '/library.html',
  '/auth.html',
  '/profile.html',
  '/about.html',
  '/contact.html',
  '/library-app.js',
  '/reader-app.js',
  '/profile-app.js',
  '/auth-app.js',
  '/about-app.js',
  '/contact-app.js',
  '/app.js',
  '/components/Header.js',
  '/components/BookGrid.js',
  '/components/Footer.js',
  '/components/BookReader.js',
  '/components/ProfileContent.js',
  '/components/AuthForm.js',
  '/components/AboutContent.js',
  '/components/ContactForm.js',
  '/utils/firebase.js',
  'https://cdn.tailwindcss.com',
  'https://resource.trickle.so/vendor_lib/unpkg/lucide-static@0.516.0/font/lucide.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});