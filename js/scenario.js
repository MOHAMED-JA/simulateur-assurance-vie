/* Scénario complet : enchaîne calcul fiscal et projection à partir d'un état de saisie (fonctions pures).
   Sert à l'interface, au comparateur, au portefeuille, au lien de partage et au PDF. */
(function (racine, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require('./baremes.js'), require('./moteur-fiscal.js'), require('./projection.js'));
  else racine.Scenario = fabrique(racine.Baremes, racine.MoteurFiscal, racine.Projection);
})(typeof self !== 'undefined' ? self : this, function (Baremes, Moteur, Proj) {
  'use strict';

  var DUREE_MAX = 40;

  /* Supports : écart de rendement (± points) entre scénarios prudent et dynamique */
  var SUPPORTS = { euros: 1, equilibre: 2, dynamique: 4 };

  function defauts() {
    return {
      annee: Baremes.parDefaut,
      revenu: 0, chef: false, enfants: 0, infirmes: 0, etudiants: 0, parents: 0,
      frequence: 'Mensuel', versement: 0,
      dureeAns: 10, rendementPct: 6, fraisPct: 1, comparPct: 4, reinvestir: false,
      ecartPct: 2, croissancePct: 0, inflationPct: 0
    };
  }

  /* Contrôle des hypothèses de projection : renvoie null ou le code de la première erreur */
  function erreurHypotheses(e) {
    if (!isFinite(e.dureeAns) || e.dureeAns < 1 || e.dureeAns > DUREE_MAX || Math.floor(e.dureeAns) !== e.dureeAns) return { code: 'duree', max: DUREE_MAX };
    if (!isFinite(e.rendementPct) || e.rendementPct < 0 || e.rendementPct > 50) return { code: 'rendement' };
    if (!isFinite(e.fraisPct) || e.fraisPct < 0 || e.fraisPct > 20) return { code: 'frais' };
    if (!isFinite(e.comparPct) || e.comparPct < 0 || e.comparPct > 50) return { code: 'compar' };
    if (!isFinite(e.ecartPct) || e.ecartPct < 0 || e.ecartPct > 20) return { code: 'ecart' };
    if (!isFinite(e.croissancePct) || e.croissancePct < 0 || e.croissancePct > 20) return { code: 'croissance' };
    if (!isFinite(e.inflationPct) || e.inflationPct < 0 || e.inflationPct > 30) return { code: 'inflation' };
    return null;
  }

  function simulerAnnee(e, facteur, rang) {
    var g = Math.pow(1 + (e.croissancePct || 0) / 100, rang);
    return Moteur.simuler({
      revenu: e.revenu * g, chef: e.chef, enfants: e.enfants, infirmes: e.infirmes,
      etudiants: e.etudiants, parents: e.parents, investissement: e.versement * facteur * g
    }, e.annee);
  }

  /* e = état de saisie (voir defauts). Renvoie tout ce que l'interface affiche. */
  function calculer(e) {
    var facteur = Moteur.FACTEURS[e.frequence] || 12;
    var investissement = e.versement * facteur;
    var sim = Moteur.simuler({
      revenu: e.revenu, chef: e.chef, enfants: e.enfants, infirmes: e.infirmes,
      etudiants: e.etudiants, parents: e.parents, investissement: investissement
    }, e.annee);
    var res = { etat: e, facteur: facteur, investissement: investissement, sim: sim, erreur: erreurHypotheses(e), actif: false };
    if (res.erreur || !(e.versement > 0)) return res;

    var economies = null;
    if (e.croissancePct > 0) {
      economies = [];
      for (var a = 0; a < e.dureeAns; a++) economies.push(a === 0 ? sim.economie : simulerAnnee(e, facteur, a).economie);
    }
    var p = {
      versement: e.versement, periodesParAn: facteur, dureeAns: e.dureeAns,
      rendementPct: e.rendementPct, fraisPct: e.fraisPct,
      economieAnnuelle: sim.economie, economies: economies, reinvestir: e.reinvestir,
      croissancePct: e.croissancePct, inflationPct: e.inflationPct, ecartPct: e.ecartPct
    };
    var sc = Proj.scenarios(p);
    var med = sc.median;
    var valeurTotale = med.capitalFinal + (e.reinvestir ? 0 : med.economieCumulee);
    var classique = Proj.placementClassique(p, e.comparPct);
    res.actif = true;
    res.p = p;
    res.sc = sc;
    res.med = med;
    res.valeurTotale = valeurTotale;
    res.classique = classique;
    res.effectif = Proj.rendementEffectif(p);
    res.avantage = valeurTotale - classique;
    return res;
  }

  /* Chiffres clés d'un scénario, pour le portefeuille, le comparateur et les exports */
  function resume(calc) {
    var s = calc.sim;
    return {
      revenu: s.revenu,
      investissementAnnuel: calc.investissement,
      dureeAns: calc.etat.dureeAns,
      economie: s.economie,
      tauxReduction: s.tauxReduction,
      optimal: s.optimal,
      capitalPrudent: calc.actif ? calc.sc.prudent.capitalFinal : null,
      capitalMedian: calc.actif ? calc.med.capitalFinal : null,
      capitalDynamique: calc.actif ? calc.sc.dynamique.capitalFinal : null,
      capitalReel: calc.actif ? calc.med.capitalFinalReel : null,
      totalVerse: calc.actif ? calc.med.totalVerse : null,
      valeurTotale: calc.actif ? calc.valeurTotale : null,
      rendementEffectif: calc.actif ? calc.effectif : null,
      avantage: calc.actif ? calc.avantage : null
    };
  }

  return { DUREE_MAX: DUREE_MAX, SUPPORTS: SUPPORTS, defauts: defauts, erreurHypotheses: erreurHypotheses, calculer: calculer, resume: resume };
});
