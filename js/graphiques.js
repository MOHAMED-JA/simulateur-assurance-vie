/* Graphiques SVG sans dépendance : chaque fonction renvoie une chaîne SVG (couleurs par variables CSS). */
(function (racine, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique();
  else racine.Graphiques = fabrique();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var L = 640, H = 260, MG = { g: 62, d: 16, h: 16, b: 34 };

  function arrondi(v) { return Math.round(v * 10) / 10; }

  function gabarit(xMax, yMax) {
    var w = L - MG.g - MG.d, h = H - MG.h - MG.b;
    return {
      x: function (v) { return arrondi(MG.g + (xMax > 0 ? v / xMax : 0) * w); },
      y: function (v) { return arrondi(MG.h + h - (yMax > 0 ? v / yMax : 0) * h); }
    };
  }

  function fmtCourt(v) {
    if (v >= 1e6) return (v / 1e6).toFixed(1).replace('.', ',') + ' M';
    if (v >= 1e3) return Math.round(v / 1e3) + ' k';
    return String(Math.round(v));
  }

  function axes(g, xMax, yMax, xLibelle) {
    var s = '';
    for (var i = 0; i <= 4; i++) {
      var vy = yMax * i / 4;
      s += '<line x1="' + MG.g + '" x2="' + (L - MG.d) + '" y1="' + g.y(vy) + '" y2="' + g.y(vy) + '" class="g-grille"/>';
      s += '<text x="' + (MG.g - 8) + '" y="' + (g.y(vy) + 4) + '" text-anchor="end" class="g-txt">' + fmtCourt(vy) + '</text>';
    }
    for (var j = 0; j <= 4; j++) {
      var vx = xMax * j / 4;
      s += '<text x="' + g.x(vx) + '" y="' + (H - MG.b + 18) + '" text-anchor="middle" class="g-txt">' + fmtCourt(vx) + '</text>';
    }
    return s + '<text x="' + (MG.g + (L - MG.g - MG.d) / 2) + '" y="' + (H - 4) + '" text-anchor="middle" class="g-txt">' + xLibelle + '</text>';
  }

  function chemin(points, g) {
    return points.map(function (p, i) { return (i ? 'L' : 'M') + g.x(p[0]) + ' ' + g.y(p[1]); }).join(' ');
  }

  /* Économie d'impôt en fonction du montant investi par an.
     donnees = { points: [[montant, economie]…], optimal, courant } */
  function courbeEconomie(donnees) {
    var pts = donnees.points;
    var xMax = pts[pts.length - 1][0] || 1;
    var yMax = Math.max.apply(null, pts.map(function (p) { return p[1]; })) || 1;
    var g = gabarit(xMax, yMax);
    var s = '<svg viewBox="0 0 ' + L + ' ' + H + '" class="graphique" role="img" aria-label="Courbe de l\'économie d\'impôt selon le montant investi par an">';
    s += axes(g, xMax, yMax, 'Montant investi par an (TND)');
    s += '<path d="' + chemin(pts, g) + ' L' + g.x(xMax) + ' ' + g.y(0) + ' L' + g.x(0) + ' ' + g.y(0) + 'Z" class="g-aire"/>';
    s += '<path d="' + chemin(pts, g) + '" class="g-ligne g-l1"/>';
    if (donnees.optimal > 0) {
      s += '<line x1="' + g.x(donnees.optimal) + '" x2="' + g.x(donnees.optimal) + '" y1="' + g.y(0) + '" y2="' + MG.h + '" class="g-repere"/>';
      s += '<text x="' + Math.min(g.x(donnees.optimal) + 6, L - 70) + '" y="' + (MG.h + 12) + '" class="g-txt g-fort">Optimal</text>';
    }
    if (donnees.courant > 0) {
      var ec = donnees.economieCourante;
      s += '<circle cx="' + g.x(Math.min(donnees.courant, xMax)) + '" cy="' + g.y(ec) + '" r="5" class="g-point"/>';
    }
    return s + '</svg>';
  }

  /* Capital constitué par année pour les trois scénarios, avec les versements cumulés.
     donnees = { prudent, median, dynamique } (résultats de Projection.scenarios) */
  function courbeCapital(donnees) {
    var ann = donnees.median.annees;
    var xMax = ann[ann.length - 1].annee || 1;
    var yMax = donnees.dynamique.annees[ann.length - 1].capital || 1;
    var g = gabarit(xMax, yMax);
    function serie(proj, cle) { return proj.annees.map(function (a) { return [a.annee, a[cle]]; }); }
    var s = '<svg viewBox="0 0 ' + L + ' ' + H + '" class="graphique" role="img" aria-label="Capital constitué par année selon trois scénarios de rendement">';
    s += axes(g, xMax, yMax, 'Années');
    s += '<path d="' + chemin(serie(donnees.median, 'verse'), g) + '" class="g-ligne g-verse"/>';
    s += '<path d="' + chemin(serie(donnees.prudent, 'capital'), g) + '" class="g-ligne g-l3"/>';
    s += '<path d="' + chemin(serie(donnees.median, 'capital'), g) + '" class="g-ligne g-l1"/>';
    s += '<path d="' + chemin(serie(donnees.dynamique, 'capital'), g) + '" class="g-ligne g-l2"/>';
    return s + '</svg>';
  }

  return { courbeEconomie: courbeEconomie, courbeCapital: courbeCapital };
});
