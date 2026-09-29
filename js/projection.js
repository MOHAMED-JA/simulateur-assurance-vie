/* Projection du capital constitué : fonctions pures, hypothèses fournies par l'utilisateur.
   Les versements ont lieu en fin de période ; l'économie d'impôt de l'année est perçue en fin d'année. */
(function (racine, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique();
  else racine.Projection = fabrique();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var ECART_SCENARIOS = 2; /* écart par défaut (en points de rendement) entre scénarios prudent, médian et dynamique */

  function tauxPeriode(rendementPct, periodesParAn) {
    var annuel = Math.max(rendementPct, -99) / 100;
    return Math.pow(1 + annuel, 1 / periodesParAn) - 1;
  }

  /* p = { versement (par période), periodesParAn, dureeAns, rendementPct, fraisPct, economieAnnuelle, reinvestir,
           croissancePct (hausse annuelle des versements, défaut 0), economies (économie d'impôt de chaque année, facultatif),
           inflationPct (défaut 0, sert au capital en valeur réelle) } */
  function projeter(p) {
    var tp = tauxPeriode(p.rendementPct - (p.fraisPct || 0), p.periodesParAn);
    var croissance = 1 + (p.croissancePct || 0) / 100;
    var inflation = 1 + (p.inflationPct || 0) / 100;
    var capital = 0, verse = 0, economieCumulee = 0;
    var annees = [{ annee: 0, verse: 0, capital: 0, capitalReel: 0 }];
    var flux = [];
    for (var a = 1; a <= p.dureeAns; a++) {
      var versement = p.versement * Math.pow(croissance, a - 1);
      var economie = p.economies && p.economies[a - 1] != null ? p.economies[a - 1] : (p.economieAnnuelle || 0);
      for (var k = 0; k < p.periodesParAn; k++) {
        capital = capital * (1 + tp) + versement;
        verse += versement;
      }
      economieCumulee += economie;
      if (p.reinvestir) capital += economie;
      flux.push({ versement: versement, economie: economie });
      annees.push({ annee: a, verse: verse, capital: capital, capitalReel: capital / Math.pow(inflation, a) });
    }
    return {
      annees: annees,
      flux: flux,
      capitalFinal: capital,
      capitalFinalReel: annees[annees.length - 1].capitalReel,
      totalVerse: verse,
      gain: capital - verse - (p.reinvestir ? economieCumulee : 0),
      economieCumulee: economieCumulee
    };
  }

  function ecartDe(p) { return p.ecartPct != null && isFinite(p.ecartPct) ? Math.max(0, p.ecartPct) : ECART_SCENARIOS; }

  /* Trois scénarios autour du rendement médian saisi (jamais en dessous de 0 %) */
  function scenarios(p) {
    var ecart = ecartDe(p);
    function avec(delta) {
      var copie = {};
      Object.keys(p).forEach(function (k) { copie[k] = p[k]; });
      copie.rendementPct = Math.max(0, p.rendementPct + delta);
      return projeter(copie);
    }
    return { prudent: avec(-ecart), median: avec(0), dynamique: avec(ecart), ecart: ecart };
  }

  /* Capital d'un placement classique de mêmes versements, sans avantage fiscal ni frais */
  function placementClassique(p, tauxPct) {
    return projeter({
      versement: p.versement, periodesParAn: p.periodesParAn, dureeAns: p.dureeAns,
      rendementPct: tauxPct, fraisPct: 0, economieAnnuelle: 0, reinvestir: false,
      croissancePct: p.croissancePct, inflationPct: p.inflationPct
    }).capitalFinal;
  }

  /* Rendement annuel effectif de l'opération (TRI) : versements sortants, économie d'impôt annuelle
     et capital final entrants. Renvoie null s'il n'y a pas de versement ou pas de solution. */
  function rendementEffectif(p) {
    if (!(p.versement > 0) || !(p.dureeAns > 0)) return null;
    var proj = projeter({
      versement: p.versement, periodesParAn: p.periodesParAn, dureeAns: p.dureeAns,
      rendementPct: p.rendementPct, fraisPct: p.fraisPct, economieAnnuelle: p.economieAnnuelle, economies: p.economies,
      croissancePct: p.croissancePct, reinvestir: false
    });
    function vaNette(i) {
      var v = 0, t;
      for (var a = 0; a < p.dureeAns; a++) {
        for (var k = 1; k <= p.periodesParAn; k++) {
          t = a + k / p.periodesParAn;
          v -= proj.flux[a].versement / Math.pow(1 + i, t);
        }
        v += proj.flux[a].economie / Math.pow(1 + i, a + 1);
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
