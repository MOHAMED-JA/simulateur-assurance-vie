/* Simulation d'un rachat (partiel ou total) de l'assurance vie à l'année N : fonctions pures.
   Modèle simplifié : si le contrat a duré moins de la durée minimale du barème, la part des montants
   déduits correspondant à la fraction rachetée est réintégrée au revenu net imposable de l'année du rachat. */
(function (racine, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require('./moteur-fiscal.js'));
  else racine.Rachat = fabrique(racine.MoteurFiscal);
})(typeof self !== 'undefined' ? self : this, function (Moteur) {
  'use strict';

  /* calc = résultat de Scenario.calculer (actif) ; r = { annee, partPct, penalitePct }
     Renvoie null si le scénario n'est pas exploitable ou si les paramètres sont hors bornes. */
  function simuler(calc, r) {
    if (!calc || !calc.actif) return null;
    var n = r.annee, part = r.partPct / 100, pen = (r.penalitePct || 0) / 100;
    if (!(n >= 1 && n <= calc.etat.dureeAns) || Math.floor(n) !== n) return null;
    if (!(part > 0 && part <= 1) || !(pen >= 0 && pen < 1)) return null;

    var regles = calc.sim.regles;
    var dureeMin = regles.sortie ? regles.sortie.dureeMinimaleAns : 0;
    var g = 1 + (calc.etat.croissancePct || 0) / 100;
    var anticipe = n < dureeMin;

    /* Montants déduits pendant les N années (plafonnés au revenu net de chaque année) */
    var deduit = 0;
    for (var a = 1; a <= n; a++) {
      var revenuNetAnnee = calc.sim.revenuNet * Math.pow(g, a - 1);
      deduit += Math.min(calc.p.versement * Math.pow(g, a - 1) * calc.facteur, revenuNetAnnee);
    }
    var reintegre = anticipe ? deduit * part : 0;
    var base = calc.sim.revenuNet * Math.pow(g, n - 1);
    var impotReintegration = reintegre > 0
      ? Moteur.impotDetaille(base + reintegre, regles).total - Moteur.impotDetaille(base, regles).total
      : 0;

    var annee = calc.med.annees[n];
    var capitalRachete = annee.capital * part;
    var penalite = capitalRachete * pen;
    var netRecu = capitalRachete - penalite - impotReintegration;
    var versementsRachetes = annee.verse * part;
    var economieObtenue = 0;
    for (var k = 0; k < n; k++) economieObtenue += calc.med.flux[k].economie;

    return {
      annee: n, partPct: r.partPct, anticipe: anticipe, dureeMinimale: dureeMin,
      capitalRachete: capitalRachete, penalite: penalite,
      montantReintegre: reintegre, impotReintegration: impotReintegration,
      netRecu: netRecu, versementsRachetes: versementsRachetes,
      coutSortie: penalite + impotReintegration,
      gainNet: netRecu - versementsRachetes,
      economieObtenue: economieObtenue * part
    };
  }

  return { simuler: simuler };
});
