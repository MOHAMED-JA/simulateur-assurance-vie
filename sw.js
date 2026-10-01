/* Mode hors ligne : les fichiers de l'application sont gardés en cache.
   Stratégie « réseau d'abord » : en ligne, l'utilisateur reçoit toujours la dernière version publiée ;
   hors ligne (en agence sans réseau), la dernière version consultée est servie depuis le cache.
   Changer VERSION à chaque publication qui modifie la liste des fichiers. */
var VERSION = 'simulateur-av-v8';
var FICHIERS = [
  './', 'index.html', 'manifest.webmanifest',
  'assets/styles.css', 'assets/fonts.css', 'assets/fonts/Inter-1.woff2', 'assets/fonts/PlusJakartaSans-2.woff2',
  'assets/favicon.svg', 'assets/icon-192.png', 'assets/icon-512.png',
  'assets/vendor/jspdf.umd.min.js', 'assets/vendor/qrcode.js',
  'js/baremes.js', 'js/moteur-fiscal.js', 'js/saisie.js', 'js/projection.js', 'js/scenario.js', 'js/rachat.js',
  'js/prevoyance.js', 'js/partage.js', 'js/export-tableur.js', 'js/portefeuille.js', 'js/conseil.js', 'js/montecarlo.js', 'js/strategie.js', 'js/contrats.js', 'js/calendrier.js', 'js/theme.js', 'js/graphiques.js',
  'js/config.js', 'js/i18n.js', 'js/pdf.js', 'js/interface.js'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FICHIERS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (cles) {
    return Promise.all(cles.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then(function (rep) {
      if (rep && rep.ok) {
        var copie = rep.clone();
        caches.open(VERSION).then(function (c) { c.put(req, copie); });
      }
      return rep;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (r) {
        return r || (req.mode === 'navigate' ? caches.match('index.html') : undefined);
      });
    })
  );
});
