# Simulateur Assurance Vie et CEA

Simulateur d'économie d'impôt sur le revenu (Tunisie, montants en TND) grâce à l'assurance vie et au Compte Épargne en Actions (CEA). Application 100 % statique : aucun serveur, aucune donnée envoyée.

## Fonctions

- Impôt avant et après investissement, économie annuelle et mensuelle, plancher légal de 45 %.
- Montant optimal à investir, application en un clic, courbe « économie selon le montant investi ».
- Détail des déductions et de l'impôt tranche par tranche.
- **Projection du capital** : durée, rendement, frais de gestion, trois scénarios (prudent, médian, dynamique), réinvestissement facultatif de l'économie d'impôt, rendement annuel effectif et comparaison avec un placement classique.
- **Export PDF** : bouton « Exporter en PDF » (boîte d'impression du navigateur, choisir « Enregistrer au format PDF »).
- **Mode conseiller** : ajoute le nom du client, du conseiller et la référence du dossier sur le rapport. Rien n'est enregistré ni transmis.
- Thème clair / sombre, adapté au mobile.

## Organisation

```
index.html            page
assets/styles.css     styles (dont la mise en page d'impression)
js/baremes.js         barème et déductions par année  <- à modifier à chaque loi de finances
js/moteur-fiscal.js   calcul de l'impôt (fonctions pures)
js/projection.js      projection du capital (fonctions pures)
js/graphiques.js      graphiques SVG
js/interface.js       lecture des saisies et affichage
tests/                tests unitaires (Node)
```

### Ajouter une année fiscale

Dans `js/baremes.js`, dupliquer l'entrée `'2025'` sous `annees`, adapter les tranches (contiguës : chaque `min` égale le `max` précédent) et les déductions. Un sélecteur d'année apparaît automatiquement dès qu'il y a plusieurs barèmes ; `parDefaut` désigne l'année proposée.

## Tests

```bash
npm test
```

Nécessite Node 18 ou plus, sans dépendance à installer. Les tests tournent aussi à chaque `push` (GitHub Actions).

## Publication

Le site est déployé sur GitHub Pages à chaque `push` sur `main` (workflow `static.yml`).

## Avertissement

Simulation indicative, non contractuelle. Les rendements de la projection sont des hypothèses non garanties. Les paramètres fiscaux sont à confirmer avec les textes officiels en vigueur.
