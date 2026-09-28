/* Paramètres fiscaux par année (barème et déductions), en TND.
   Ajouter une année = ajouter une entrée dans `annees` ; aucun autre fichier à modifier.
   Les tranches sont contiguës : chaque tranche commence là où la précédente se termine. */
(function (racine, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique();
  else racine.Baremes = fabrique();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  return {
    parDefaut: '2025',
    annees: {
      '2025': {
        annee: 2025,
        libelle: 'Loi de finances 2025',
        source: 'Paramètres repris de la version précédente du simulateur ; à confirmer avec le texte officiel (Code de l\'IRPP et de l\'IS).',
        tranches: [
          { min: 0,     max: 5000,     taux: 0.00 },
          { min: 5000,  max: 10000,    taux: 0.15 },
          { min: 10000, max: 20000,    taux: 0.25 },
          { min: 20000, max: 30000,    taux: 0.30 },
          { min: 30000, max: 40000,    taux: 0.33 },
          { min: 40000, max: 50000,    taux: 0.36 },
          { min: 50000, max: 70000,    taux: 0.38 },
          { min: 70000, max: Infinity, taux: 0.40 }
        ],
        deductions: {
          fraisProfessionnelsTaux: 0.10, fraisProfessionnelsMax: 2000,
          chefDeFamille: 300,
          enfant: 100, enfantsMax: 400,
          enfantInfirme: 2000,
          etudiant: 1000, etudiantsMax: 4000,
          parent: 450, parentsMax: 2
        },
        /* Impôt après investissement jamais inférieur à 45 % de l'impôt initial (réduction de 55 % au plus) */
        impotMinimumTaux: 0.45
      }
    }
  };
});
