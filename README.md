# Simulateur Assurance Vie et CEA

Simulateur d'économie d'impôt sur le revenu (Tunisie, montants en TND) grâce à l'assurance vie et au Compte Épargne en Actions (CEA). Application 100 % statique : aucun serveur, aucune donnée envoyée. Polices et bibliothèques sont hébergées dans le dépôt : aucune requête vers un service tiers.

## Fonctions

- Impôt avant et après investissement, économie annuelle et mensuelle, plancher légal de 45 %.
- Montant optimal à investir, application en un clic, courbe « économie selon le montant investi ».
- **Mode inverse** : « je veux économiser X TND par an » donne le montant à verser (par mois, trimestre, semestre ou an).
- Détail des déductions et de l'impôt tranche par tranche.
- **Saisie tolérante** : « 45 000 », « 45000,5 », « 45,000.5 » sont compris ; « 45,000 » (ambigu) déclenche un avertissement avec correction en un clic.
- **Projection du capital** : durée, rendement, frais, trois scénarios dont l'écart dépend du support (fonds en euros ± 1 pt, équilibré ± 2 pts, unités de compte ± 4 pts, ou personnalisé), hausse annuelle du revenu et des versements, inflation et capital en dinars constants, rendement effectif (TRI), comparaison avec un placement classique, export annuel en Excel (CSV).
- **Objectif de capital** : « je veux 150 000 TND au terme » donne le versement nécessaire (scénario médian, avec frais, hausse des versements et réinvestissement), appliqué en un clic.
- **Mode retraite** : l'âge actuel et l'âge de départ fixent la durée ; avec la pension estimée, la carte Prévoyance affiche le revenu mensuel à la retraite et la part apportée par la rente.
- **Comparatif des placements** : contrat (capital + économie d'impôt), placement classique avant et après impôt sur les intérêts (taux modifiable, 20 % par défaut, à confirmer) et versements cumulés.
- **Rachat anticipé** (partiel ou total, à l'année N) : pénalité du contrat, réintégration fiscale des montants déduits si le contrat a moins de 10 ans (paramètre `sortie.dureeMinimaleAns` du barème), montant net perçu et coût de la sortie.
- **Prévoyance** : rente estimée au terme (durée et taux technique saisis) et capital versé aux bénéficiaires en cas de décès.
- **Lien de partage** : les paramètres sont encodés dans l'adresse (partie `#`), avec un QR code et un envoi en un clic par WhatsApp ou e-mail (et partage direct du PDF sur les téléphones qui le permettent) ; les noms du client et du conseiller n'y figurent jamais.
- **Rapport PDF** (jsPDF) : en-tête et logo, numéro de dossier, indicateurs, tableaux, graphiques, rachat, prévoyance, QR code, mentions légales, pages numérotées. En arabe, le rapport est rédigé en français (les polices standard du PDF n'ont pas de glyphes arabes). Si jsPDF ne se charge pas, la boîte d'impression du navigateur prend le relais.
- **Mode conseiller et portefeuille** : nom du client, du conseiller et référence du dossier sur le rapport ; simulations enregistrées dans le navigateur (IndexedDB, 200 au plus), rouvertes en un clic, **comparées côte à côte** (2 ou 3, meilleure valeur signalée par ★) et exportées en Excel (CSV) ; **tableau de bord** (épargne proposée, économies d'impôt, capital projeté) et **sauvegarde / restauration** du portefeuille dans un fichier, pour changer d'appareil ou de navigateur.
- **PDF aux couleurs de l'agence** : logo, nom et coordonnées de l'agence, nom du conseiller pré-rempli ; mémorisés sur l'appareil uniquement.
- **Infobulles et questions fréquentes** : plancher de 45 %, scénarios et rendement effectif, rachat, rente, dinars constants.
- **Français, anglais et arabe** (lecture de droite à gauche) ; la langue du navigateur est proposée par défaut. Les montants gardent le format tunisien dans toutes les langues.
- Barème paramétrable par année : un sélecteur d'année apparaît dès qu'il y a plusieurs barèmes (la loi de finances 2026 n'a pas modifié le barème : un seul est affiché).
- **Application installable et hors ligne** (PWA) : utilisable en agence sans réseau ; en ligne, la dernière version publiée est toujours servie.
- Thème clair / sombre, adapté au mobile (dès 320 px de large).

## Organisation

```
index.html              page
manifest.webmanifest    application installable (PWA)
sw.js                   mode hors ligne (réseau d'abord, cache en secours)
assets/styles.css       styles (dont la mise en page d'impression)
assets/fonts*           polices hébergées localement
assets/vendor/          jsPDF et qrcode-generator (licences MIT, voir LICENCES.md)
js/baremes.js           barème, déductions et règle de sortie par année  <- à modifier à chaque loi de finances
js/moteur-fiscal.js     calcul de l'impôt et mode inverse (fonctions pures)
js/saisie.js            lecture des nombres saisis (fonctions pures)
js/projection.js        projection du capital (fonctions pures)
js/scenario.js          enchaînement calcul fiscal + projection (fonctions pures)
js/rachat.js            rachat anticipé (fonctions pures)
js/prevoyance.js        rente et capital décès (fonctions pures)
js/partage.js           lien de partage (fonctions pures)
js/export-tableur.js    exports CSV pour Excel (fonctions pures)
js/portefeuille.js      portefeuille du conseiller (IndexedDB)
js/conseil.js           objectif de capital, retraite, statistiques et sauvegarde du portefeuille (fonctions pures)
js/graphiques.js        graphiques SVG
js/i18n.js              traductions (anglais, arabe)
js/pdf.js               rapport PDF
js/interface.js         lecture des saisies et affichage
tests/                  tests unitaires (Node)
e2e/                    parcours de bout en bout (Playwright)
```

### Ajouter une année fiscale

Dans `js/baremes.js`, dupliquer l'entrée `'2025'` sous `annees`, adapter les tranches (contiguës : chaque `min` égale le `max` précédent), les déductions et `sortie`. Changer `parDefaut` pour proposer la nouvelle année ; `provisoire: true` affiche un avertissement tant que le texte n'est pas confirmé. Penser à ajouter la traduction du nouveau libellé et de la source dans `js/i18n.js` (le test des traductions le signale).

### Ajouter ou modifier un texte

Tout texte affiché en français doit avoir sa traduction anglaise et arabe dans `js/i18n.js` ; `npm test` échoue sinon et liste les textes manquants.

## Tests

```bash
npm test            # tests unitaires, Node 18 ou plus, sans dépendance
npm ci && npx playwright install chromium
npm run test:e2e    # parcours dans Chromium, format bureau et mobile
```

Les deux séries tournent à chaque `push` et à chaque pull request (GitHub Actions).

## Publication

Le site est déployé sur GitHub Pages à chaque `push` sur `main` (workflow `static.yml`), seulement si les tests unitaires passent. Seuls les fichiers de l'application sont publiés (`index.html`, `manifest.webmanifest`, `sw.js`, `assets/`, `js/`).

## Avertissement

Simulation indicative, non contractuelle. Les rendements de la projection sont des hypothèses non garanties. Les paramètres fiscaux (barème, plafonds, durée minimale avant réintégration en cas de rachat) sont à confirmer avec les textes officiels en vigueur.
