/* Configuration de la publication : coordonnées de l'agence proposées à tous les visiteurs pour le bouton
   « Être rappelé par un conseiller » et le rapport PDF. Laisser vide pour ne rien afficher.
   Un conseiller peut saisir ses propres coordonnées dans le mode conseiller (mémorisées sur son appareil). */
(function (racine) {
  racine.ConfigSimulateur = {
    agence: {
      nom: '',
      tel: '',      /* format international conseillé, ex. +216 71 000 000 (utilisé pour WhatsApp) */
      email: '',
      adresse: ''
    }
  };
})(typeof self !== 'undefined' ? self : this);
