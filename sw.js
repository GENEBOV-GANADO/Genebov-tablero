/* Genebov · Ganado — guarda la app para abrirla sin internet.
   Los datos, fotos y fichas los guarda la página en el celular (IndexedDB). */
var VERSION = 'genebov-v1';
var BASICOS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(BASICOS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var u = new URL(req.url);
  // Los datos del script de GANADO no pasan por aquí: los maneja la página.
  if (u.hostname.indexOf('script.google') >= 0 || u.hostname.indexOf('googleusercontent') >= 0) return;
  var mismaApp = u.origin === self.location.origin;
  var fuentes = u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com';
  if (!mismaApp && !fuentes) return;
  // Primero lo guardado (abre al instante y sin internet); en segundo plano se actualiza.
  e.respondWith(caches.open(VERSION).then(function (c) {
    return c.match(req, { ignoreSearch: mismaApp }).then(function (guardado) {
      var red = fetch(req).then(function (r) {
        if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone());
        return r;
      }).catch(function () { return guardado || (req.mode === 'navigate' ? c.match('./index.html') : undefined); });
      return guardado || red;
    });
  }));
});
