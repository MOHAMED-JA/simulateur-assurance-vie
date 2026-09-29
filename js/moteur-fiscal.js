/* Moteur de calcul fiscal : fonctions pures, sans accès au DOM (testables sous Node). */
(function (racine, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require('./baremes.js'));
  else racine.MoteurFiscal = fabrique(racine.Baremes);
})(typeof self !== 'undefined' ? self : this, function (Baremes) {
  'use strict';

  var FACTEURS = { Mensuel: 12, Trimestriel: 4, Semestriel: 2, Annuel: 1 };

  function regles(cle) {
    var k = cle || Baremes.parDefaut;
    var r = Baremes.annees[k];
    if (!r) throw new Error('Barème inconnu : ' + k);
    return r;
  }

  function largeur(tranche) { return tranche.max === Infinity ? Infinity : tranche.max - tranche.min; }

  function detailDeductions(revenu, chefDeFamille, enfants, enfantsInfirmes, etudiants, parents, r) {
    var d = (r || regles()).deductions;
    return {
      fraisProfessionnels: Math.min(d.fraisProfessionnelsTaux * revenu, d.fraisProfessionnelsMax),
      chefDeFamille: chefDeFamille ? d.chefDeFamille : 0,
      enfants: Math.min(enfants * d.enfant, d.enfantsMax),
      enfantsInfirmes: enfantsInfirmes * d.enfantInfirme,
      etudiants: Math.min(etudiants * d.etudiant, d.etudiantsMax),
      parents: parents * d.parent
    };
  }

  function totalDeductions(det) {
    return det.fraisProfessionnels + det.chefDeFamille + det.enfants + det.enfantsInfirmes + det.etudiants + det.parents;
  }

  /* Impôt progressif par tranche, avec le détail de chacune */
  function impotDetaille(revenuNet, r) {
    var tranches = (r || regles()).tranches;
    var reste = Math.max(revenuNet, 0);
    var total = 0;
    var parTranche = tranches.map(function (t) {
      var montant = Math.min(reste, largeur(t));
      var impot = montant * t.taux;
      reste -= montant;
      total += impot;
      return { min: t.min, max: t.max, taux: t.taux, montant: montant, impot: impot };
    });
    return { total: total, parTranche: parTranche };
  }

  /* Ramène l'impôt au minimum légal en le répartissant sur les tranches, de la plus basse à la plus haute */
  function appliquerImpotMinimum(details, impotMinimum, r) {
    if (details.total >= impotMinimum) return details;
    var tranches = (r || regles()).tranches;
    var reste = impotMinimum;
    var ajuste = { total: 0, parTranche: [] };
    tranches.forEach(function (t) {
      var w = largeur(t);
      var impotMax = w === Infinity ? Infinity : w * t.taux;
      var impot = reste > 0 ? Math.min(reste, impotMax) : 0;
      ajuste.parTranche.push({ min: t.min, max: t.max, taux: t.taux, montant: t.taux > 0 ? impot / t.taux : 0, impot: impot });
      ajuste.total += impot;
      reste -= impot;
    });
    return ajuste;
  }

  /* Investissement qui ramène l'impôt au minimum légal */
  function investissementOptimal(revenuNet, impotInitial, r) {
    var rg = r || regles();
    if (revenuNet <= rg.tranches[0].max) {
      return { investissementOptimal: 0, revenuNetApres: revenuNet, impotApres: impotInitial };
    }
    var impotMin = rg.impotMinimumTaux * impotInitial;
    var netApres = 0;
    var reste = impotMin;
    for (var i = 0; i < rg.tranches.length; i++) {
      var t = rg.tranches[i];
      var w = largeur(t);
      var impotMaxTranche = w === Infinity ? Infinity : w * t.taux;
      if (reste <= impotMaxTranche) {
        netApres += t.taux > 0 ? reste / t.taux : 0;
        break;
      }
      netApres += w;
      reste -= impotMaxTranche;
    }
    return { investissementOptimal: Math.min(revenuNet - netApres, revenuNet), revenuNetApres: netApres, impotApres: impotMin };
  }

  /* Impôt après un investissement donné (plancher appliqué) */
  function impotApresInvestissement(revenuNet, impotInitial, investissement, r) {
    var rg = r || regles();
    var netApres = Math.max(revenuNet - investissement, 0);
    var details = impotDetaille(netApres, rg);
    var impotMin = impotInitial * rg.impotMinimumTaux;
    var ajuste = details.total < impotMin ? appliquerImpotMinimum(details, impotMin, rg) : details;
    return { revenuNetApres: netApres, details: ajuste };
  }

  /* Simulation complète : entrée = saisies de l'utilisateur, sortie = tous les chiffres affichés */
  function simuler(entree, cle) {
    var rg = regles(cle);
    var revenu = entree.revenu || 0;
    var det = detailDeductions(revenu, !!entree.chef, entree.enfants || 0, entree.infirmes || 0, entree.etudiants || 0, entree.parents || 0, rg);
    var deductions = totalDeductions(det);
    var revenuNet = Math.max(revenu - deductions, 0);
    var avant = impotDetaille(revenuNet, rg);
    var investissement = entree.investissement || 0;
    var apres = impotApresInvestissement(revenuNet, avant.total, investissement, rg);
    var economie = Math.max(0, avant.total - apres.details.total);
    return {
      regles: rg,
      revenu: revenu,
      deductionsDetail: det,
      deductions: deductions,
      revenuNet: revenuNet,
      avant: avant,
      impotAvant: avant.total,
      impotMinimum: avant.total * rg.impotMinimumTaux,
      investissement: investissement,
      revenuNetApres: apres.revenuNetApres,
      apres: apres.details,
      impotApres: apres.details.total,
      economie: economie,
      tauxReduction: avant.total > 0 ? economie / avant.total * 100 : 0,
      optimal: investissementOptimal(revenuNet, avant.total, rg).investissementOptimal
    };
  }

  /* Économie d'impôt pour un investissement annuel donné (courbe de sensibilité) */
  function economiePourInvestissement(sim, investissement) {
    var apres = impotApresInvestissement(sim.revenuNet, sim.impotAvant, investissement, sim.regles);
    return Math.max(0, sim.impotAvant - apres.details.total);
  }

  /* Mode inverse : investissement annuel minimal qui procure l'économie d'impôt visée.
     L'économie croît avec l'investissement jusqu'au plancher légal : recherche par dichotomie.
     Renvoie { possible, investissementAnnuel, economieMax } (économieMax = économie au plancher). */
  function investissementPourEconomie(sim, cible) {
    var economieMax = sim.impotAvant - sim.impotMinimum;
    if (!(cible > 0)) return { possible: true, investissementAnnuel: 0, economieMax: economieMax };
    if (cible > economieMax + 0.0005) return { possible: false, investissementAnnuel: null, economieMax: economieMax };
    var bas = 0, haut = Math.max(sim.optimal, 1);
    for (var n = 0; n < 100; n++) {
      var milieu = (bas + haut) / 2;
      if (economiePourInvestissement(sim, milieu) >= cible) haut = milieu; else bas = milieu;
    }
    return { possible: true, investissementAnnuel: haut, economieMax: economieMax };
  }

  return {
    FACTEURS: FACTEURS,
    regles: regles,
    detailDeductions: detailDeductions,
    totalDeductions: totalDeductions,
    impotDetaille: impotDetaille,
    appliquerImpotMinimum: appliquerImpotMinimum,
    investissementOptimal: investissementOptimal,
    impotApresInvestissement: impotApresInvestissement,
    simuler: simuler,
    economiePourInvestissement: economiePourInvestissement,
    investissementPourEconomie: investissementPourEconomie
  };
});
