/* Mode hors ligne : les fichiers de l'application sont gardés en cache.
   Stratégie « réseau d'abord » : en ligne, l'utilisateur reçoit toujours la dernière version publiée ;
   hors ligne (en agence sans réseau), la dernière version consultée est servie depuis le cache.
   Changer VERSION à chaque publication qui modifie la liste des fichiers. */
var VERSION = 'simulateur-av-v13';
var REGLAGES = 'simulateur-reglages'; /* réglages des rappels : jamais effacés à la mise à jour */
try { importScripts('js/rappels.js'); } catch (e) {}
var FICHIERS = [
  './', 'index.html', 'manifest.webmanifest',
  'assets/styles.css', 'assets/espace-bande.css', 'assets/fonts.css', 'assets/fonts/Inter-1.woff2', 'assets/fonts/PlusJakartaSans-2.woff2',
  'assets/favicon.svg', 'assets/icon-192.png', 'assets/icon-512.png', 'assets/icon-maskable-512.png',
  'assets/vendor/jspdf.umd.min.js', 'assets/vendor/qrcode.js',
  'js/baremes.js', 'js/moteur-fiscal.js', 'js/saisie.js', 'js/projection.js', 'js/scenario.js', 'js/rachat.js',
  'js/prevoyance.js', 'js/partage.js', 'js/export-tableur.js', 'js/portefeuille.js', 'js/conseil.js', 'js/montecarlo.js', 'js/strategie.js', 'js/contrats.js', 'js/calendrier.js', 'js/theme.js', 'js/stress.js', 'js/couple.js', 'js/objectifs.js', 'js/comparateur.js', 'js/historique.js', 'js/xlsx.js', 'js/releve.js', 'js/commandes.js', 'js/rappels.js', 'js/graphiques.js',
  'js/config.js', 'js/i18n.js', 'js/pdf.js', 'js/interface.js'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FICHIERS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (cles) {
    return Promise.all(cles.filter(function (k) { return k !== VERSION && k !== REGLAGES; }).map(function (k) { return caches.delete(k); }));
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

/* Rappel de versement en arrière-plan (synchronisation périodique, application installée) */
function verifierRappel() {
  if (!self.Rappels) return Promise.resolve();
  return caches.open(REGLAGES).then(function (c) {
    return c.match('reglages/rappel').then(function (r) { return r ? r.json() : null; }).then(function (r) {
      if (!r || !r.actif) return;
      var d = self.Rappels.estDu(r, new Date());
      if (!d) return;
      r.dernier = d.cle;
      return Promise.all([
        c.put('reglages/rappel', new Response(JSON.stringify(r), { headers: { 'Content-Type': 'application/json' } })),
        self.registration.showNotification(r.titre || 'Versement', { body: r.corps || '', icon: 'assets/icon-192.png', badge: 'assets/icon-192.png', tag: 'rappel-versement' })
      ]);
    });
  }).catch(function () {});
}
self.addEventListener('periodicsync', function (e) {
  if (e.tag === 'rappel-versement') e.waitUntil(verifierRappel());
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (l) {
    for (var i = 0; i < l.length; i++) if ('focus' in l[i]) return l[i].focus();
    return self.clients.openWindow('./');
  }));
});
