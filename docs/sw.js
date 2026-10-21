/* Sato Anti-Infective — keeps the web version working offline.
   build-web.sh fills in the version and the file list; a new version replaces the old copy. */
var CACHE = 'sato-1.0.8';
var FILES = ["apple-touch-icon.png","css/app.css","favicon.png","fonts/Playfair-700.woff","fonts/Playfair-900.woff","fonts/Poppins-Bold.ttf","fonts/Poppins-Light.ttf","fonts/Poppins-Medium.ttf","fonts/Poppins-Regular.ttf","fonts/Poppins-SemiBold.ttf","icon-192.png","icon-512.png","img/b-antioxidant.png","img/b-blood.png","img/b-cognitive.png","img/b-eye.png","img/b-fertility.png","img/b-foot.png","img/b-vertigo.png","img/c-brain.jpg","img/c-ear.jpg","img/c-foot.jpg","img/c-nerve.jpg","img/capsule.png","img/eda-qr.png","img/grain.png","img/leaf-a.png","img/leaf-b.png","img/r-cap.jpg","img/r-lung.jpg","img/r-sinus.jpg","img/r-uti.jpg","img/royafloxacin-500-carton.png","img/saginkgo-120-carton.png","img/saginkgo-pack.png","img/sato-arabic-navy.png","img/sato-pharma-reverse.png","index.html","js/app.js","js/sp.js","js/tools.js","manifest.webmanifest","pages/roya-1.jpg","pages/roya-2.jpg","pages/roya-3.jpg","pages/roya-4.jpg","pages/roya-5.jpg","pages/roya-6.jpg","pages/roya-7.jpg","pages/roya-8.jpg","pages/sag-1.jpg","pages/sag-2.jpg","version.json","viewer.html","web.css","web.js"];

self.addEventListener('install', function (e) {
  // Straight from the server, never the browser's own cache, so a new version never keeps an old file.
  var fresh = FILES.map(function (f) { return new Request(f, { cache: 'reload' }); });
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(fresh); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

// The saved copy answers first, so the app opens at once even with no signal.
// version.json always asks the network, so the version line stays true.
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (/version\.json$/.test(new URL(req.url).pathname)) {
    e.respondWith(fetch(req).catch(function () { return caches.match(req, { ignoreSearch: true }); }));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(function (hit) { return hit || fetch(req); }));
});
