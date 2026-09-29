/* Partage d'une simulation par lien : l'état est encodé dans la partie « # » de l'adresse (rien n'est envoyé à un serveur).
   Les noms du client et du conseiller ne sont volontairement jamais inclus. */
(function (racine, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require('./baremes.js'), require('./moteur-fiscal.js'));
  else racine.Partage = fabrique(racine.Baremes, racine.MoteurFiscal);
})(typeof self !== 'undefined' ? self : this, function (Baremes, Moteur) {
  'use strict';

  /* clé courte -> [champ, type, min, max] */
  var CHAMPS = {
    r: ['revenu', 'nb', 0, 1e9], c: ['chef', 'bool'], e: ['enfants', 'int', 0, 99], i: ['infirmes', 'int', 0, 99],
    u: ['etudiants', 'int', 0, 99], p: ['parents', 'int', 0, 2], f: ['frequence', 'freq'], v: ['versement', 'nb', 0, 1e9],
    d: ['dureeAns', 'int', 1, 40], y: ['rendementPct', 'nb', 0, 50], x: ['fraisPct', 'nb', 0, 20], k: ['comparPct', 'nb', 0, 50],
    n: ['reinvestir', 'bool'], s: ['ecartPct', 'nb', 0, 20], g: ['croissancePct', 'nb', 0, 20], l: ['inflationPct', 'nb', 0, 30],
    t: ['impotInteretsPct', 'nb', 0, 50], q: ['ageActuel', 'int', 0, 80], o: ['ageDepart', 'int', 0, 80],
    a: ['annee', 'annee']
  };

  function encoder(etat) {
    return Object.keys(CHAMPS).map(function (cle) {
      var champ = CHAMPS[cle][0], type = CHAMPS[cle][1], v = etat[champ];
      if (v === undefined || v === null) return null;
      if (type === 'bool') v = v ? 1 : 0;
      else if (type === 'nb' || type === 'int') {
        if (typeof v !== 'number' || !isFinite(v)) return null;
        v = Math.round(v * 1e6) / 1e6;
      }
      return cle + '=' + encodeURIComponent(String(v));
    }).filter(Boolean).join('&');
  }

  /* Renvoie seulement les champs valides ; tout le reste est ignoré (lien altéré ou d'une autre version). */
  function decoder(texte) {
    var etat = {};
    String(texte || '').replace(/^#/, '').split('&').forEach(function (paire) {
      var i = paire.indexOf('=');
      if (i < 1) return;
      var cle = paire.slice(0, i), def = CHAMPS[cle];
      if (!def) return;
      var brut;
      try { brut = decodeURIComponent(paire.slice(i + 1)); } catch (e) { return; }
      var v;
      if (def[1] === 'bool') { if (brut !== '0' && brut !== '1') return; v = brut === '1'; }
      else if (def[1] === 'freq') { if (!Object.prototype.hasOwnProperty.call(Moteur.FACTEURS, brut)) return; v = brut; }
      else if (def[1] === 'annee') { if (!Object.prototype.hasOwnProperty.call(Baremes.annees, brut)) return; v = brut; }
      else {
        if (!/^\d+(\.\d+)?$/.test(brut)) return;
        v = Number(brut);
        if (!isFinite(v) || v < def[2] || v > def[3]) return;
        if (def[1] === 'int' && Math.floor(v) !== v) return;
      }
      etat[def[0]] = v;
    });
    return etat;
  }

  function lien(base, etat) { return String(base).split('#')[0] + '#' + encoder(etat); }

  return { encoder: encoder, decoder: decoder, lien: lien };
});
