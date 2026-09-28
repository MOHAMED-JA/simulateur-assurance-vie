/* Projection du capital constitué : fonctions pures, hypothèses fournies par l'utilisateur.
   Les versements ont lieu en fin de période ; l'économie d'impôt de l'année est perçue en fin d'année. */
(function (racine, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique();
  else racine.Projection = fabrique();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var ECART_SCENARIOS = 2; /* points de rendement entre scénarios prudent, médian et dynamique */

  function tauxPeriode(rendementPct, periodesParAn) {
    var annuel = Math.max(rendementPct, -99) / 100;
    return Math.pow(1 + annuel, 1 / periodesParAn) - 1;
  }

  /* p = { versement (par période), periodesParAn, dureeAns, rendementPct, fraisPct, economieAnnuelle, reinvestir } */
  function projeter(p) {
    var tp = tauxPeriode(p.rendementPct - (p.fraisPct || 0), p.periodesParAn);
    var capital = 0, verse = 0, economieCumulee = 0;
    var annees = [{ annee: 0, verse: 0, capital: 0 }];
    for (var a = 1; a <= p.dureeAns; a++) {
      for (var k = 0; k < p.periodesParAn; k++) {
        capital = capital * (1 + tp) + p.versement;
        verse += p.versement;
      }
      economieCumulee += p.economieAnnuelle || 0;
      if (p.reinvestir) capital += p.economieAnnuelle || 0;
      annees.push({ annee: a, verse: verse, capital: capital });
    }
    return {
      annees: annees,
      capitalFinal: capital,
      totalVerse: verse,
      gain: capital - verse - (p.reinvestir ? economieCumulee : 0),
      economieCumulee: economieCumulee
    };
  }

  /* Trois scénarios autour du rendement médian saisi (jamais en dessous de 0 %) */
  function scenarios(p) {
    function avec(delta) {
      var copie = {};
      Object.keys(p).forEach(function (k) { copie[k] = p[k]; });
      copie.rendementPct = Math.max(0, p.rendementPct + delta);
      return projeter(copie);
    }
    return { prudent: avec(-ECART_SCENARIOS), median: avec(0), dynamique: avec(ECART_SCENARIOS) };
  }

  /* Capital d'un placement classique de mêmes versements, sans avantage fiscal ni frais */
  function placementClassique(p, tauxPct) {
    return projeter({
      versement: p.versement, periodesParAn: p.periodesParAn, dureeAns: p.dureeAns,
      rendementPct: tauxPct, fraisPct: 0, economieAnnuelle: 0, reinvestir: false
    }).capitalFinal;
  }

  /* Rendement annuel effectif de l'opération (TRI) : versements sortants, économie d'impôt annuelle
     et capital final entrants. Renvoie null s'il n'y a pas de versement ou pas de solution. */
  function rendementEffectif(p) {
    if (!(p.versement > 0) || !(p.dureeAns > 0)) return null;
    var proj = projeter({
      versement: p.versement, periodesParAn: p.periodesParAn, dureeAns: p.dureeAns,
      rendementPct: p.rendementPct, fraisPct: p.fraisPct, economieAnnuelle: p.economieAnnuelle, reinvestir: false
    });
    function vaNette(i) {
      var v = 0, t;
      for (var a = 0; a < p.dureeAns; a++) {
        for (var k = 1; k <= p.periodesParAn; k++) {
          t = a + k / p.periodesParAn;
          v -= p.versement / Math.pow(1 + i, t);
        }
        v += (p.economieAnnuelle || 0) / Math.pow(1 + i, a + 1);
      }
      return v + proj.capitalFinal / Math.pow(1 + i, p.dureeAns);
    }
    var bas = -0.99, haut = 10;
    if (vaNette(bas) * vaNette(haut) > 0) return null;
    for (var n = 0; n < 200; n++) {
      var milieu = (bas + haut) / 2;
      if (vaNette(bas) * vaNette(milieu) <= 0) haut = milieu; else bas = milieu;
    }
    return (bas + haut) / 2 * 100;
  }

  return {
    ECART_SCENARIOS: ECART_SCENARIOS,
    projeter: projeter,
    scenarios: scenarios,
    placementClassique: placementClassique,
    rendementEffectif: rendementEffectif
  };
});
