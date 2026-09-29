/* Interface : lecture des saisies, affichage des résultats, projection, rachat, prévoyance,
   partage par lien, portefeuille du conseiller, comparateur, exports et langue.
   Les calculs sont dans les modules purs (moteur-fiscal, projection, scenario, rachat, prevoyance) testés sous Node. */
(function () {
  'use strict';

  var Moteur = window.MoteurFiscal;
  var Baremes = window.Baremes;
  var Graph = window.Graphiques;
  var Saisie = window.Saisie;
  var Scenario = window.Scenario;
  var Rachat = window.Rachat;
  var Prev = window.Prevoyance;
  var Partage = window.Partage;
  var XL = window.ExportTableur;
  var Port = window.Portefeuille;
  var I18n = window.I18n;
  var Conseil = window.Conseil;
  var t = I18n.t;

  var FACTEURS = Moteur.FACTEURS;
  var PERIODES = { Mensuel: 'par mois', Trimestriel: 'par trimestre', Semestriel: 'par semestre', Annuel: 'par an' };
  var NOMS_SCEN = { prudent: 'Prudent', median: 'Médian', dynamique: 'Dynamique' };

  /* ===================================================================
     Formatage (montants au format tunisien : espace des milliers, virgule, 3 décimales)
     =================================================================== */
  var mouvementReduit = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var nfLibre = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 });
  var nfEntier = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
  var nf1 = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  /* Espaces fines insécables remplacées par des espaces insécables (rendu homogène des polices) */
  function esp(s) { return s.replace(/[  ]/g, ' '); }
  function fmtAmount(v) {
    var s = (Math.abs(v) < 0.0005 ? 0 : v).toFixed(3);
    var neg = s.charAt(0) === '-';
    var p = (neg ? s.slice(1) : s).split('.');
    return (neg ? '−' : '') + p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ',' + p[1];
  }
  function fmtTND(v) { return fmtAmount(v) + ' TND'; }
  function fmtHtml(v) { return fmtAmount(v) + '<span class="unit">TND</span>'; }
  function fmtEntier(v) { return esp(nfEntier.format(Math.floor(v))); }
  function fmtPct(v) { return esp(nf1.format(v)) + ' %'; }
  function fmtSigne(v) { return (v >= 0.0005 ? '+' : '') + fmtTND(v); }
  function fmtLibre(v) { return esp(nfLibre.format(v)); }

  function $(id) { return document.getElementById(id); }
  function lire(id) { return Saisie.lireNombre($(id).value); }
  function nombre(id) { return lire(id).v; }

  function echapper(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }

  function animer(el, vers, rendu) {
    var de = parseFloat(el.dataset.val);
    el.dataset.val = vers;
    if (el._raf) cancelAnimationFrame(el._raf);
    if (mouvementReduit.matches || document.hidden || !isFinite(de) || de === vers) { el.innerHTML = rendu(vers); return; }
    var t0 = performance.now(), duree = 520;
    function pas(tps) {
      var p = Math.min(1, (tps - t0) / duree);
      var e = 1 - Math.pow(1 - p, 3);
      el.innerHTML = rendu(p < 1 ? de + (vers - de) * e : vers);
      if (p < 1) el._raf = requestAnimationFrame(pas);
    }
    el._raf = requestAnimationFrame(pas);
  }

  function toast(message, type) {
    var zone = $('toasts');
    var el = document.createElement('div');
    el.className = 'toast' + (type === 'erreur' ? ' toast-erreur' : '');
    el.innerHTML = '<span class="t-ico"><svg class="ico"><use href="#' + (type === 'erreur' ? 'i-alert' : 'i-check') + '"/></svg></span><span></span>';
    el.lastChild.textContent = message;
    zone.appendChild(el);
    while (zone.children.length > 2) zone.removeChild(zone.firstChild);
    setTimeout(function () { el.classList.add('sortie'); setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 240); }, 3200);
  }

  function telecharger(nom, contenu, type) {
    var blob = contenu instanceof Blob ? contenu : new Blob([contenu], { type: type });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = nom;
    document.body.appendChild(a);
    a.click();
    a.parentNode.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  function dateIso() { return new Date().toISOString().slice(0, 10); }

  /* ===================================================================
     État de l'interface
     =================================================================== */
  var ui = { chef: false, frequence: 'Mensuel', annee: Baremes.parDefaut, calc: null, rachat: null, prevoyance: null, inverse: null, portefeuille: [], selection: [] };
  var champsEntiers = ['children', 'disabled-children', 'students', 'parents'];
  var champsHypotheses = ['p-duree', 'p-rendement', 'p-frais', 'p-compar', 'p-ecart', 'p-croissance', 'p-inflation', 'p-impot-interets'];
  var depot = null;

  function lireEntier(id) {
    var el = $(id);
    var max = id === 'parents' ? 2 : 99;
    var n = parseInt(String(el.value).replace(/\D/g, ''), 10);
    if (!isFinite(n) || n < 0) n = 0;
    return Math.min(n, max);
  }

  /* État de saisie complet (format de Scenario.defauts) */
  function lireEtat() {
    var rev = lire('revenue'), per = lire('investment-amount-period');
    return {
      annee: ui.annee,
      revenu: isFinite(rev.v) ? rev.v : 0,
      chef: ui.chef,
      enfants: lireEntier('children'), infirmes: lireEntier('disabled-children'),
      etudiants: lireEntier('students'), parents: lireEntier('parents'),
      frequence: ui.frequence,
      versement: isFinite(per.v) ? per.v : 0,
      dureeAns: nombre('p-duree'), rendementPct: nombre('p-rendement'), fraisPct: nombre('p-frais'),
      comparPct: nombre('p-compar'), reinvestir: $('p-reinvest').checked,
      ecartPct: nombre('p-ecart'), croissancePct: nombre('p-croissance'), inflationPct: nombre('p-inflation'),
      impotInteretsPct: nombre('p-impot-interets'),
      ageActuel: ui.retraite ? ui.retraite.age : 0, ageDepart: ui.retraite ? ui.retraite.depart : 0
    };
  }

  /* Recharge un état (lien de partage, portefeuille) dans le formulaire */
  function appliquerEtat(partiel) {
    var e = Object.assign(Scenario.defauts(), partiel || {});
    if (Baremes.annees[e.annee]) { ui.annee = e.annee; $('annee-bareme').value = e.annee; majBareme(); }
    $('revenue').value = e.revenu > 0 ? fmtLibre(e.revenu) : '';
    $('investment-amount-period').value = e.versement > 0 ? fmtLibre(e.versement) : '';
    $('children').value = String(e.enfants);
    $('disabled-children').value = String(e.infirmes);
    $('students').value = String(e.etudiants);
    $('parents').value = String(e.parents);
    selectionnerSegment('chef', e.chef ? '1' : '0');
    selectionnerSegment('frequence', e.frequence);
    ui.chef = !!e.chef;
    ui.frequence = e.frequence;
    $('p-duree').value = String(e.dureeAns);
    $('p-rendement').value = fmtLibre(e.rendementPct);
    $('p-frais').value = fmtLibre(e.fraisPct);
    $('p-compar').value = fmtLibre(e.comparPct);
    $('p-ecart').value = fmtLibre(e.ecartPct);
    $('p-croissance').value = fmtLibre(e.croissancePct);
    $('p-inflation').value = fmtLibre(e.inflationPct);
    $('p-reinvest').checked = !!e.reinvestir;
    $('p-impot-interets').value = fmtLibre(e.impotInteretsPct);
    var retraite = e.ageActuel > 0 && e.ageDepart > 0;
    $('p-retraite').checked = retraite;
    $('p-age').value = retraite ? String(e.ageActuel) : '';
    $('p-depart').value = String(retraite ? e.ageDepart : 60);
    synchroniserSupport();
    if (e.croissancePct > 0 || e.inflationPct > 0 || e.ecartPct !== 2 || e.impotInteretsPct !== 20) $('p-avance').open = true;
    majCurseur();
    majSteppers();
    calculateAndDisplay();
  }

  function majCurseur() {
    var r = $('revenue-r');
    var v = lire('revenue').v;
    if (!isFinite(v)) v = 0;
    var borne = Math.min(+r.max, Math.max(0, v));
    r.value = borne;
    r.style.setProperty('--pct', (borne / +r.max * 100) + '%');
  }

  function majSteppers() {
    champsEntiers.forEach(function (id) {
      var n = lireEntier(id);
      var st = document.querySelector('.stepper[data-for="' + id + '"]');
      var max = +(st.dataset.max || 99);
      st.querySelector('[data-pas="-1"]').disabled = n <= 0;
      st.querySelector('[data-pas="1"]').disabled = n >= max;
    });
  }

  function libelleBareme() {
    var r = Baremes.annees[ui.annee];
    return t(r.libelle);
  }

  function majBareme() {
    var r = Baremes.annees[ui.annee];
    $('badge-bareme').textContent = t('Barème : {0}', [libelleBareme()]);
    $('badge-bareme').parentNode.classList.toggle('provisoire', !!r.provisoire);
    $('remarque-bareme').textContent = t('Ce tableau applique le barème suivant : {0}.', [libelleBareme()]) + ' ' + t(r.source);
  }

  /* ===================================================================
     Calcul et affichage
     =================================================================== */
  function afficherAmbiguite(idChamp, lecture, idMsg) {
    var el = $(idMsg);
    if (!lecture.ambigu) { el.hidden = true; el.innerHTML = ''; return; }
    el.hidden = false;
    el.innerHTML = '<svg class="ico ico-sm"><use href="#i-alert"/></svg><span></span> <button type="button" class="lien-btn"></button>';
    el.children[1].textContent = t('« {0} » est lu comme {1}. Vouliez-vous saisir {2} ?', [$(idChamp).value.trim(), fmtLibre(lecture.v) + '\u00a0TND', fmtLibre(lecture.alternative) + '\u00a0TND']);
    var b = el.children[2];
    b.textContent = t('Corriger en {0}', [fmtEntier(lecture.alternative)]);
    b.addEventListener('click', function () {
      $(idChamp).value = fmtLibre(lecture.alternative);
      if (idChamp === 'revenue') majCurseur();
      calculateAndDisplay();
      $(idChamp).focus();
    });
  }

  function calculateAndDisplay() {
    var rev = lire('revenue');
    var per = lire('investment-amount-period');

    $('f-revenue').classList.toggle('invalide', !isFinite(rev.v));
    $('revenue-err').textContent = isFinite(rev.v) ? '' : t('Saisissez un montant valide (ex. 45 000).');
    $('f-period').classList.toggle('invalide', !isFinite(per.v));
    $('period-err').textContent = isFinite(per.v) ? '' : t('Saisissez un montant valide (ex. 500).');
    afficherAmbiguite('revenue', rev, 'revenue-amb');
    afficherAmbiguite('investment-amount-period', per, 'period-amb');
    majRetraite();

    var etat = lireEtat();
    var calc = Scenario.calculer(etat);
    ui.calc = calc;
    var sim = calc.sim;
    var factor = calc.facteur;
    var investment = calc.investissement;

    $('lbl-period').textContent = t('Montant à investir {0}', [t(PERIODES[ui.frequence])]);
    $('total-formule').textContent = t('{0} × {1} versement(s) par an', [fmtAmount(etat.versement), factor]);
    animer($('investment-amount-total'), investment, fmtHtml);

    majSuggestion(sim.optimal, investment, factor);
    majInverse(sim);

    var aDesResultats = etat.revenu > 0;
    var etaitCache = $('resultats').hidden;
    $('vide').hidden = aDesResultats;
    $('resultats').hidden = !aDesResultats;
    if (!aDesResultats) {
      $('resume-vocal').textContent = '';
      $('panneau-partage').hidden = true;
      return;
    }

    if (etaitCache) ['tax-saved', 'tax-reduction-rate'].forEach(function (id) { delete $(id).dataset.val; });

    afficherIndicateurs(sim);
    afficherDeductions(sim, etat);
    afficherTranches(sim);
    afficherCourbeEconomie(sim, investment);
    majProjection(calc);
    majObjectif(calc);
    majRachat();
    majPrevoyance();
    if (!$('panneau-partage').hidden) majPartage();

    $('resume-vocal').textContent = t('Économie d\'impôt de {0} par an, soit {1} de réduction. Montant optimal à investir : {2}.', [fmtTND(sim.economie), fmtPct(sim.tauxReduction), fmtTND(sim.optimal)]);
  }

  function afficherIndicateurs(sim) {
    animer($('tax-saved'), sim.economie, fmtHtml);
    $('tax-saved-monthly').textContent = fmtTND(sim.economie / 12);
    animer($('tax-reduction-rate'), sim.tauxReduction, function (v) { return v.toFixed(1).replace('.', ',') + '<span class="unit">%</span>'; });
    var circ = 263.894;
    $('gauge-fg').style.strokeDashoffset = String(circ * (1 - Math.min(sim.tauxReduction, 55) / 55));
    $('gauge-txt').innerHTML = sim.tauxReduction >= 54.95 ? t('plafond<br>atteint') : esp(nf1.format(55 - sim.tauxReduction)) + ' %<br>' + t('restants');

    $('tax-before').innerHTML = fmtHtml(sim.impotAvant);
    $('tax-after').innerHTML = fmtHtml(sim.impotApres);
    $('min-tax').innerHTML = fmtHtml(sim.impotMinimum);
    $('optimal-investment').innerHTML = fmtHtml(sim.optimal);
    var ref = sim.impotAvant > 0 ? sim.impotAvant : 1;
    $('bar-avant').style.width = (sim.impotAvant > 0 ? 100 : 0) + '%';
    $('bar-apres').style.width = (sim.impotApres / ref * 100) + '%';
    $('bar-floor').style.insetInlineStart = (sim.impotAvant > 0 ? 45 : 0) + '%';
    $('bar-floor').style.display = sim.impotAvant > 0 ? '' : 'none';
    $('bar-floor').dataset.lib = t('plancher 45 %');
  }

  function lignesDeductions(sim, entree) {
    var det = sim.deductionsDetail;
    var d = sim.regles.deductions;
    function nb(n) { return n ? ' (' + n + ')' : ''; }
    return [
      [t('Revenu brut annuel imposable'), sim.revenu, ''],
      [t('Frais professionnels ({0} %, {1} max.)', [Math.round(d.fraisProfessionnelsTaux * 100), fmtEntier(d.fraisProfessionnelsMax)]), det.fraisProfessionnels, 'moins sous'],
      [t('Chef de famille'), det.chefDeFamille, 'moins sous'],
      [t('Enfants à charge') + nb(entree.enfants), det.enfants, 'moins sous'],
      [t('Enfants infirmes') + nb(entree.infirmes), det.enfantsInfirmes, 'moins sous'],
      [t('Étudiants sans bourse') + nb(entree.etudiants), det.etudiants, 'moins sous'],
      [t('Parents à charge') + nb(entree.parents), det.parents, 'moins sous'],
      [t('Revenu net imposable'), sim.revenuNet, 'total'],
      [t('Investissement déduit'), Math.min(sim.investissement, sim.revenuNet), 'moins inv'],
      [t('Revenu net après investissement'), sim.revenuNetApres, 'total']
    ];
  }

  function afficherDeductions(sim, entree) {
    $('deductions').innerHTML = lignesDeductions(sim, entree).map(function (l) {
      var moins = l[2].indexOf('moins') !== -1;
      var nul = moins && l[1] === 0 ? ' nul' : '';
      return '<div class="ded-row ' + l[2] + nul + '"><span>' + echapper(l[0]) + '</span><span class="v">' + (moins && l[1] > 0 ? '− ' : '') + fmtTND(l[1]) + '</span></div>';
    }).join('');
  }

  function afficherTranches(sim) {
    var couleurs = ['#64748b', '#0ea5e9', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];
    var totAv = 0, totAp = 0;
    $('tax-brackets-comparison').innerHTML = sim.avant.parTranche.map(function (bd, i) {
      var ad = sim.apres.parTranche[i] || { impot: 0 };
      var savings = bd.impot - ad.impot;
      totAv += bd.impot; totAp += ad.impot;
      var actif = bd.impot > 0 || ad.impot > 0 || bd.montant > 0;
      var debut = bd.min > 0 ? bd.min + 1 : 0;
      var maxAff = bd.max === Infinity ? '∞' : fmtEntier(bd.max);
      return '<tr' + (actif ? '' : ' class="inactive"') + '><td>' + fmtEntier(debut) + ' – ' + maxAff + '</td>' +
        '<td><span class="rate" style="background:' + couleurs[i % couleurs.length] + '">' + (bd.taux * 100).toFixed(0) + ' %</span></td>' +
        '<td>' + fmtAmount(bd.impot) + '</td><td>' + fmtAmount(ad.impot) + '</td>' +
        '<td' + (savings > 0.0005 ? ' class="eco"' : '') + '>' + fmtAmount(savings) + '</td></tr>';
    }).join('');
    $('tranches-total').innerHTML = '<tr><td>' + t('Total') + '</td><td></td><td>' + fmtAmount(totAv) + '</td><td>' + fmtAmount(totAp) + '</td><td class="eco">' + fmtAmount(totAv - totAp) + '</td></tr>';
  }

  function pointsEconomie(sim, investissement) {
    var xMax = Math.max(sim.optimal * 1.5, investissement * 1.15, 100);
    var points = [];
    for (var i = 0; i <= 40; i++) {
      var x = xMax * i / 40;
      points.push([x, Moteur.economiePourInvestissement(sim, x)]);
    }
    return points;
  }

  function afficherCourbeEconomie(sim, investissement) {
    $('graph-economie').innerHTML = Graph.courbeEconomie({
      points: pointsEconomie(sim, investissement), optimal: sim.optimal, courant: investissement,
      economieCourante: Moteur.economiePourInvestissement(sim, investissement)
    }, {
      aria: t('Courbe de l\'économie d\'impôt selon le montant investi par an'),
      x: t('Montant investi par an (TND)'),
      optimal: t('Optimal')
    });
  }

  /* ===================================================================
     Suggestion optimale et mode inverse
     =================================================================== */
  function majSuggestion(optimal, investment, factor) {
    var box = $('suggest');
    var rec = $('optimal-recommendation');
    var etatEl = $('suggest-state');
    var btn = $('appliquer');
    var alerte = $('alerte-plancher');
    if (optimal > 0) {
      box.classList.remove('vide');
      rec.innerHTML = fmtHtml(optimal);
      btn.hidden = false;
      var atteint = investment >= optimal - 0.0005;
      etatEl.hidden = !atteint;
      etatEl.innerHTML = '<svg class="ico ico-sm"><use href="#i-check"/></svg>' + t('Plancher atteint');
      btn.disabled = Math.abs(investment - optimal) < 0.0005 * factor + 1e-9;
      if (investment > optimal + 0.0005 * factor + 1e-9) {
        alerte.hidden = false;
        $('alerte-texte').textContent = t('Au-delà de {0} par an, l\'investissement supplémentaire ({1}) ne réduit plus votre impôt : le plancher de 45 % est déjà atteint.', [fmtTND(optimal), fmtTND(investment - optimal)]);
      } else {
        alerte.hidden = true;
      }
    } else {
      box.classList.add('vide');
      rec.textContent = '—';
      btn.hidden = true;
      etatEl.hidden = true;
      alerte.hidden = true;
    }
    box.dataset.optimal = optimal;
  }

  function majInverse(sim) {
    var r = lire('inv-cible');
    var res = $('inv-res');
    var btn = $('inv-appliquer');
    btn.hidden = true;
    ui.inverse = null;
    $('bloc-inverse').classList.remove('ok', 'ko');
    if (r.vide) { res.textContent = t('Indiquez l\'économie souhaitée : le simulateur calcule le montant à verser.'); return; }
    if (!isFinite(r.v)) { res.textContent = t('Saisissez un montant valide (ex. 500).'); $('bloc-inverse').classList.add('ko'); return; }
    if (!(sim.revenu > 0)) { res.textContent = t('Saisissez d\'abord votre revenu brut annuel imposable.'); return; }
    var inv = Moteur.investissementPourEconomie(sim, r.v);
    if (!inv.possible) {
      $('bloc-inverse').classList.add('ko');
      res.textContent = inv.economieMax > 0.0005
        ? t('Objectif impossible : l\'économie maximale est de {0} par an (plancher légal de 45 %).', [fmtTND(inv.economieMax)])
        : t('Aucune économie possible : votre impôt est déjà nul.');
      return;
    }
    var f = FACTEURS[ui.frequence];
    var periode = Math.ceil(inv.investissementAnnuel / f * 1000 - 1e-7) / 1000;
    $('bloc-inverse').classList.add('ok');
    res.textContent = t('Versez {0} par an, soit {1} {2}.', [fmtTND(periode * f), fmtTND(periode), t(PERIODES[ui.frequence])]);
    ui.inverse = periode;
    btn.hidden = !(periode > 0);
  }

  /* ===================================================================
     Projection du capital
     =================================================================== */
  function messageErreur(err) {
    switch (err.code) {
      case 'duree': return t('La durée doit être un nombre entier d\'années entre 1 et {0}.', [err.max]);
      case 'rendement': return t('Le rendement annuel doit être compris entre 0 et 50 %.');
      case 'frais': return t('Les frais de gestion doivent être compris entre 0 et 20 %.');
      case 'compar': return t('Le taux du placement classique doit être compris entre 0 et 50 %.');
      case 'ecart': return t('L\'écart entre scénarios doit être compris entre 0 et 20 points.');
      case 'croissance': return t('La hausse annuelle doit être comprise entre 0 et 20 %.');
      case 'inflation': return t('L\'inflation doit être comprise entre 0 et 30 %.');
      case 'impotInterets': return t('L\'impôt sur les intérêts doit être compris entre 0 et 50 %.');
      default: return '';
    }
  }

  function ligne(libelle, valeur, classe) {
    return '<div class="tax-row' + (classe ? ' ' + classe : '') + '"><span class="l">' + echapper(libelle) + '</span><span class="v">' + valeur + '</span></div>';
  }

  /* Lignes de la projection : [libellé, valeur, classe] (réutilisées par le PDF) */
  function lignesProjection(calc) {
    var e = calc.etat, med = calc.med;
    var l = [
      [t('Total versé sur {0} an(s)', [e.dureeAns]), fmtTND(med.totalVerse)],
      [t('Capital au terme (scénario médian)'), fmtTND(med.capitalFinal)]
    ];
    if (e.inflationPct > 0) l.push([t('Capital au terme en dinars constants (inflation {0})', [fmtPct(e.inflationPct)]), fmtTND(med.capitalFinalReel)]);
    if (e.croissancePct > 0) l.push([t('Versement de la dernière année (hausse de {0} par an)', [fmtPct(e.croissancePct)]), fmtTND(med.flux[med.flux.length - 1].versement * calc.facteur)]);
    l.push(
      [t('Gain financier'), fmtTND(med.gain)],
      [t('Économie d\'impôt cumulée') + (e.reinvestir ? ' ' + t('(réinvestie)') : ''), fmtTND(med.economieCumulee)],
      [t('Valeur totale (capital + économie d\'impôt)'), fmtTND(calc.valeurTotale), 'fort'],
      [t('Rendement annuel effectif, économie d\'impôt comprise'), calc.effectif === null ? '—' : fmtPct(calc.effectif)],
      [t('Placement classique à {0} (mêmes versements)', [fmtPct(e.comparPct)]), fmtTND(calc.classique)],
      [t('Placement classique après impôt sur les intérêts ({0})', [fmtPct(calc.impotInteretsPct)]), fmtTND(calc.classiqueNet)],
      [t('Avantage sur le placement classique'), fmtSigne(calc.avantage), calc.avantage >= 0 ? 'fort' : '']
    );
    return l;
  }

  function tauxScenario(calc, k) {
    return Math.max(0, calc.etat.rendementPct + (k === 'prudent' ? -calc.sc.ecart : k === 'dynamique' ? calc.sc.ecart : 0));
  }

  function majProjection(calc) {
    var err = calc.erreur;
    $('proj-err').textContent = err ? messageErreur(err) : '';
    champsHypotheses.forEach(function (id) { $(id).closest('.field').classList.remove('invalide'); });
    if (err) {
      var id = { duree: 'p-duree', rendement: 'p-rendement', frais: 'p-frais', compar: 'p-compar', ecart: 'p-ecart', croissance: 'p-croissance', inflation: 'p-inflation', impotInterets: 'p-impot-interets' }[err.code];
      if (id) $(id).closest('.field').classList.add('invalide');
      if (['p-ecart', 'p-croissance', 'p-inflation', 'p-impot-interets'].indexOf(id) !== -1) $('p-avance').open = true;
    }
    var actif = calc.actif;
    $('proj-vide').hidden = actif || !!err;
    $('proj-resultat').hidden = !actif;
    $('carte-rachat').hidden = !actif;
    $('carte-prevoyance').hidden = !actif;
    if (!actif) return;

    var sc = calc.sc;
    ['prudent', 'median', 'dynamique'].forEach(function (k) {
      $('scen-l-' + k).textContent = t(NOMS_SCEN[k]) + ' · ' + fmtPct(tauxScenario(calc, k));
      $('scen-' + k).textContent = fmtTND(sc[k].capitalFinal);
    });
    var reel = calc.etat.inflationPct > 0;
    $('graph-capital').innerHTML = Graph.courbeCapital(sc, { aria: t('Capital constitué par année selon trois scénarios de rendement'), x: t('Années') }, reel);
    $('leg-reel').hidden = !reel;
    $('proj-lignes').innerHTML = lignesProjection(calc).map(function (l) { return ligne(l[0], l[1], l[2]); }).join('');
    afficherComparatif(calc);
  }

  /* Comparatif des placements au terme (barres horizontales) */
  function elementsComparatif(calc) {
    var e = calc.etat;
    return [
      [t('Assurance vie ou CEA : capital + économie d\'impôt'), calc.valeurTotale, 'c1'],
      [t('Placement classique à {0}, avant impôt', [fmtPct(e.comparPct)]), calc.classique, 'c2'],
      [t('Placement classique à {0}, après impôt sur les intérêts ({1})', [fmtPct(e.comparPct), fmtPct(calc.impotInteretsPct)]), calc.classiqueNet, 'c3'],
      [t('Versements cumulés'), calc.med.totalVerse, 'c4']
    ];
  }

  function afficherComparatif(calc) {
    var el = elementsComparatif(calc);
    var max = Math.max.apply(null, el.map(function (x) { return x[1]; })) || 1;
    $('comparatif-barres').innerHTML = el.map(function (x) {
      return '<div class="cmp-ligne"><span class="cmp-lib">' + echapper(x[0]) + '</span>' +
        '<span class="cmp-trk"><span class="cmp-fill ' + x[2] + '" style="width:' + (Math.max(0, x[1]) / max * 100).toFixed(2) + '%"></span></span>' +
        '<b class="cmp-val">' + fmtTND(x[1]) + '</b></div>';
    }).join('');
  }

  /* ===================================================================
     Mode retraite et objectif de capital
     =================================================================== */
  function majRetraite() {
    var actif = $('p-retraite').checked;
    $('bloc-retraite').hidden = !actif;
    $('p-duree').readOnly = actif;
    $('p-duree').closest('.field').classList.toggle('verrouille', actif);
    $('retraite-err').textContent = '';
    ui.retraite = null;
    if (!actif) return;
    var a = lire('p-age'), d = lire('p-depart');
    if (a.vide) { $('retraite-err').textContent = t('Indiquez votre âge actuel.'); return; }
    var r = Conseil.dureeRetraite(a.v, d.v, Scenario.DUREE_MAX);
    if (r.erreur) {
      $('retraite-err').textContent = {
        age: t('L\'âge actuel doit être un nombre entier entre 18 et 75 ans.'),
        depart: t('L\'âge de départ doit être un nombre entier entre 40 et 80 ans.'),
        ecart: t('L\'écart entre les deux âges doit être compris entre 1 et {0} ans.', [Scenario.DUREE_MAX])
      }[r.erreur];
      return;
    }
    $('p-duree').value = String(r.duree);
    ui.retraite = { age: a.v, depart: d.v };
  }

  function majObjectif(calc) {
    var r = lire('obj-capital');
    var res = $('obj-res'), btn = $('obj-appliquer');
    btn.hidden = true;
    ui.objectif = null;
    $('bloc-objectif').classList.remove('ok', 'ko');
    if (r.vide) { res.textContent = t('Indiquez le capital souhaité au terme : le simulateur calcule le versement nécessaire.'); return; }
    if (!isFinite(r.v)) { res.textContent = t('Saisissez un montant valide (ex. 500).'); $('bloc-objectif').classList.add('ko'); return; }
    if (calc.erreur) { res.textContent = t('Corrigez d\'abord les hypothèses de projection.'); $('bloc-objectif').classList.add('ko'); return; }
    var o = Conseil.versementPourCapital(calc.etat, r.v);
    if (!o || !(o.versement > 0)) { res.textContent = ''; return; }
    var f = calc.facteur;
    $('bloc-objectif').classList.add('ok');
    res.textContent = t('Versez {0} {1} (soit {2} par an) pour atteindre {3} en {4} ans.', [fmtTND(o.versement), t(PERIODES[calc.etat.frequence]), fmtTND(o.versement * f), fmtTND(o.capital), calc.etat.dureeAns]) +
      (calc.etat.croissancePct > 0 ? ' ' + t('Montant de la première année, puis en hausse de {0} par an.', [fmtPct(calc.etat.croissancePct)]) : '');
    ui.objectif = o.versement;
    btn.hidden = Math.abs(o.versement - calc.etat.versement) < 0.0005;
  }

  /* ===================================================================
     Rachat anticipé
     =================================================================== */
  function bornerAnnee(id, duree) {
    var el = $(id);
    if (el.dataset.touche) return;
    var v = lire(id).v;
    if (!isFinite(v) || v > duree) el.value = String(Math.max(1, Math.min(duree, isFinite(v) ? v : 1)));
  }

  function lignesRachat(r) {
    var l = [
      [t('Capital racheté en fin d\'année {0} ({1})', [r.annee, fmtPct(r.partPct)]), fmtTND(r.capitalRachete)],
      [t('Pénalité de rachat'), (r.penalite > 0 ? '− ' : '') + fmtTND(r.penalite)],
      [t('Montant réintégré au revenu imposable'), fmtTND(r.montantReintegre)],
      [t('Impôt supplémentaire dû (réintégration)'), (r.impotReintegration > 0 ? '− ' : '') + fmtTND(r.impotReintegration)],
      [t('Montant net perçu'), fmtTND(r.netRecu), 'fort'],
      [t('Versements correspondants'), fmtTND(r.versementsRachetes)],
      [t('Gain ou perte nette sur les versements'), fmtSigne(r.gainNet), r.gainNet >= 0 ? 'fort' : 'perte'],
      [t('Économies d\'impôt déjà obtenues sur cette part'), fmtTND(r.economieObtenue)],
      [t('Coût total de la sortie (pénalité + impôt)'), fmtTND(r.coutSortie), r.coutSortie > 0 ? 'perte' : '']
    ];
    return l;
  }

  function majRachat() {
    var calc = ui.calc;
    ui.rachat = null;
    if (!calc || !calc.actif) return;
    var duree = calc.etat.dureeAns;
    bornerAnnee('r-annee', duree);
    var a = nombre('r-annee'), part = nombre('r-part'), pen = lire('r-penalite').vide ? 0 : nombre('r-penalite');
    var err = '';
    if (!(a >= 1 && a <= duree && Math.floor(a) === a)) err = t('L\'année du rachat doit être un nombre entier entre 1 et {0}.', [duree]);
    else if (!(part > 0 && part <= 100)) err = t('La part rachetée doit être comprise entre 0 et 100 %.');
    else if (!(pen >= 0 && pen < 100)) err = t('La pénalité doit être comprise entre 0 et 100 %.');
    $('rachat-err').textContent = err;
    if (err) { $('rachat-res').innerHTML = ''; return; }
    var r = Rachat.simuler(calc, { annee: a, partPct: part, penalitePct: pen });
    ui.rachat = r;
    var statut = r.anticipe
      ? '<div class="statut ko"><svg class="ico ico-sm"><use href="#i-alert"/></svg><span>' + echapper(t('Rachat avant {0} ans : les montants déduits sont réintégrés au revenu imposable de l\'année du rachat.', [r.dureeMinimale])) + '</span></div>'
      : '<div class="statut ok"><svg class="ico ico-sm"><use href="#i-check"/></svg><span>' + echapper(t('Contrat d\'au moins {0} ans : pas de réintégration fiscale.', [r.dureeMinimale])) + '</span></div>';
    $('rachat-res').innerHTML = statut + '<div class="tax-rows">' + lignesRachat(r).map(function (l) { return ligne(l[0], l[1], l[2]); }).join('') + '</div>';
    $('rachat-note').textContent = t('Hypothèses : rachat en fin d\'année, scénario médian. Réintégration si le contrat a moins de {0} ans : paramètre du barème, à confirmer avec le texte officiel et les conditions du contrat.', [r.dureeMinimale]);
  }

  /* ===================================================================
     Prévoyance
     =================================================================== */
  function lignesPrevoyance(p) {
    return [
      [t('Capital au terme (scénario médian)'), fmtTND(p.capital)],
      p.retraite
        ? [t('Rente annuelle estimée à partir de {0} ans, pendant {1} ans', [p.retraite.depart, p.dureeRente]), fmtTND(p.rente.annuelle), 'fort']
        : [t('Rente annuelle estimée pendant {0} ans', [p.dureeRente]), fmtTND(p.rente.annuelle), 'fort'],
      [t('Soit par mois'), fmtTND(p.rente.mensuelle)]
    ].concat(p.revenu ? [
      [t('Pension de retraite mensuelle estimée'), fmtTND(p.revenu.pension)],
      [t('Revenu mensuel à la retraite (pension + rente)'), fmtTND(p.revenu.total), 'fort'],
      [t('Part du revenu apportée par la rente'), fmtPct(p.revenu.partRente)]
    ] : []).concat([
      [t('Capital acquis en cas de décès en année {0}', [p.deces.annee]), fmtTND(p.deces.capitalAcquis)],
      [t('Versements cumulés à cette date'), fmtTND(p.deces.totalVerse)],
      [t('Capital versé aux bénéficiaires') + ' (' + t({ acquis: 'capital acquis', verses: 'versements remboursés', garanti: 'capital garanti' }[p.deces.origine]) + ')', fmtTND(p.deces.capitalDeces), 'fort']
    ]);
  }

  function majPrevoyance() {
    var calc = ui.calc;
    ui.prevoyance = null;
    if (!calc || !calc.actif) return;
    var duree = calc.etat.dureeAns;
    bornerAnnee('v-deces-annee', duree);
    var dr = nombre('v-duree-rente'), tx = nombre('v-taux-rente'), an = nombre('v-deces-annee');
    var g = lire('v-garanti');
    var pension = lire('v-pension');
    var err = '';
    if (!(dr >= 1 && dr <= 50 && Math.floor(dr) === dr)) err = t('La durée de la rente doit être un nombre entier entre 1 et 50 ans.');
    else if (!(tx >= 0 && tx <= 20)) err = t('Le taux technique doit être compris entre 0 et 20 %.');
    else if (!(an >= 1 && an <= duree && Math.floor(an) === an)) err = t('L\'année du décès doit être un nombre entier entre 1 et {0}.', [duree]);
    else if (!isFinite(g.v) || !isFinite(pension.v)) err = t('Saisissez un montant valide (ex. 500).');
    $('prev-err').textContent = err;
    if (err) { $('prev-lignes').innerHTML = ''; return; }
    var p = {
      capital: calc.med.capitalFinal,
      dureeRente: dr, tauxRente: tx,
      rente: Prev.renteEstimee(calc.med.capitalFinal, dr, tx),
      deces: Prev.capitalDeces(calc.med.annees, an, g.v),
      retraite: ui.retraite
    };
    p.revenu = pension.v > 0 ? Conseil.revenuRetraite(pension.v, p.rente.mensuelle) : null;
    ui.prevoyance = p;
    $('prev-lignes').innerHTML = lignesPrevoyance(p).map(function (l) { return ligne(l[0], l[1], l[2]); }).join('');
  }

  /* ===================================================================
     Lien de partage et QR code
     =================================================================== */
  function lienActuel() { return Partage.lien(location.href, lireEtat()); }

  /* Matrice du QR code (null si la bibliothèque n'est pas chargée) */
  function matriceQR(texte) {
    if (typeof window.qrcode !== 'function') return null;
    try {
      var qr = window.qrcode(0, 'M');
      qr.addData(texte);
      qr.make();
      return qr;
    } catch (e) { return null; }
  }

  function majPartage() {
    actualiser();
    var lien = lienActuel();
    $('lien-partage').value = lien;
    var qr = matriceQR(lien);
    $('qr-lien').innerHTML = qr ? qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true }) : '';
    var message = t('Voici votre simulation d\'assurance vie et de CEA : {0}', [lien]);
    $('envoi-whatsapp').href = 'https://wa.me/?text=' + encodeURIComponent(message);
    $('envoi-email').href = 'mailto:?subject=' + encodeURIComponent(t('Votre simulation d\'assurance vie et de CEA')) + '&body=' + encodeURIComponent(message + '\n\n' + t('Simulation indicative, non contractuelle.'));
  }

  /* Partage natif du PDF (téléphones et navigateurs qui le permettent) */
  function partagePdfPossible() {
    try {
      return !!(navigator.canShare && window.File && navigator.canShare({ files: [new File(['%PDF'], 'test.pdf', { type: 'application/pdf' })] }));
    } catch (e) { return false; }
  }

  function copier(texte) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(texte);
    return new Promise(function (ok, ko) {
      var champ = $('lien-partage');
      champ.focus();
      champ.select();
      try { document.execCommand('copy') ? ok() : ko(); } catch (e) { ko(e); }
    });
  }

  function chargerDepuisLien() {
    if (!location.hash || location.hash.length < 3) return false;
    var d = Partage.decoder(location.hash);
    if (!Object.keys(d).length) return false;
    appliquerEtat(d);
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    toast(t('Simulation chargée depuis le lien.'));
    return true;
  }

  /* ===================================================================
     Rapport PDF (jsPDF) et rapport imprimable de secours
     =================================================================== */
  function infosConseiller() {
    var actif = !$('carte-conseiller').hidden;
    return {
      client: actif ? $('c-client').value.trim() : '',
      conseiller: actif ? $('c-conseiller').value.trim() : '',
      ref: actif ? $('c-ref').value.trim() : ''
    };
  }

  /* Agence : coordonnées et logo mémorisés sur cet appareil (localStorage), jamais transmis */
  var CHAMPS_AGENCE = { nom: 'ag-nom', tel: 'ag-tel', email: 'ag-email', adresse: 'ag-adresse' };
  var agence = { nom: '', tel: '', email: '', adresse: '', logo: null, conseiller: '' };

  function chargerAgence() {
    try {
      var d = JSON.parse(localStorage.getItem('agence') || 'null');
      if (d && typeof d === 'object') {
        Object.keys(CHAMPS_AGENCE).concat(['conseiller']).forEach(function (k) { if (typeof d[k] === 'string') agence[k] = d[k]; });
        if (d.logo && typeof d.logo.src === 'string' && /^data:image\/(png|jpeg);base64,/.test(d.logo.src)) agence.logo = d.logo;
      }
    } catch (e) {}
    Object.keys(CHAMPS_AGENCE).forEach(function (k) { $(CHAMPS_AGENCE[k]).value = agence[k]; });
    if (agence.conseiller && !$('c-conseiller').value) $('c-conseiller').value = agence.conseiller;
    afficherLogo();
  }

  function sauverAgence() {
    Object.keys(CHAMPS_AGENCE).forEach(function (k) { agence[k] = $(CHAMPS_AGENCE[k]).value.trim(); });
    agence.conseiller = $('c-conseiller').value.trim();
    try { localStorage.setItem('agence', JSON.stringify(agence)); return true; } catch (e) { return false; }
  }

  function afficherLogo() {
    var ap = $('ag-logo-apercu');
    ap.innerHTML = agence.logo ? '<img alt="" src="' + agence.logo.src + '">' : '';
    ap.hidden = !agence.logo;
    $('ag-logo-retirer').hidden = !agence.logo;
  }

  /* Le logo est redimensionné (320 × 160 au plus) et converti en PNG ou JPEG pour le PDF */
  function lireLogo(fichier) {
    if (!fichier || !/^image\/(png|jpeg|webp)$/.test(fichier.type)) { toast(t('Choisissez une image PNG ou JPEG.'), 'erreur'); return; }
    var lecteur = new FileReader();
    lecteur.onload = function () {
      var img = new Image();
      img.onload = function () {
        var k = Math.min(1, 320 / img.width, 160 / img.height);
        var c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.width * k));
        c.height = Math.max(1, Math.round(img.height * k));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        var png = fichier.type !== 'image/jpeg';
        agence.logo = { src: c.toDataURL(png ? 'image/png' : 'image/jpeg', 0.9), format: png ? 'PNG' : 'JPEG', l: c.width, h: c.height };
        if (!sauverAgence()) { agence.logo = null; toast(t('Logo trop lourd pour être mémorisé.'), 'erreur'); }
        else toast(t('Logo enregistré : il figurera sur le rapport PDF.'));
        afficherLogo();
      };
      img.onerror = function () { toast(t('Choisissez une image PNG ou JPEG.'), 'erreur'); };
      img.src = lecteur.result;
    };
    lecteur.readAsDataURL(fichier);
  }

  function agencePourRapport() {
    if (!agence.nom && !agence.logo) return null;
    return { nom: agence.nom, tel: agence.tel, email: agence.email, adresse: agence.adresse, logo: agence.logo };
  }

  /* Numéro de dossier : la référence saisie, sinon un numéro stable tiré des paramètres */
  function numeroDossier(lien, ref) {
    if (ref) return ref;
    var h = 0;
    for (var i = 0; i < lien.length; i++) h = (h * 31 + lien.charCodeAt(i)) >>> 0;
    return 'SIM-' + dateIso().replace(/-/g, '') + '-' + ('000000' + h.toString(36).toUpperCase()).slice(-6);
  }

  function donneesRapport() {
    var calc = ui.calc;
    var sim = calc.sim;
    var lien = lienActuel();
    var meta = infosConseiller();
    var e = calc.etat;
    return {
      langue: I18n.langue() === 'en' ? 'en' : 'fr',
      t: t, fmtTND: fmtTND, fmtPct: fmtPct, fmtEntier: fmtEntier, fmtAmount: fmtAmount,
      date: new Date(),
      bareme: libelleBareme(),
      provisoire: !!sim.regles.provisoire,
      dossier: numeroDossier(lien, meta.ref),
      client: meta.client, conseiller: meta.conseiller,
      agence: agencePourRapport(),
      lien: lien, qr: matriceQR(lien),
      calc: calc,
      hypotheses: [
        [t('Revenu brut annuel imposable'), fmtTND(e.revenu)],
        [t('Situation familiale'), (e.chef ? t('Chef de famille') : t('Non chef de famille')) + ' · ' + t('{0} enfant(s), {1} infirme(s), {2} étudiant(s), {3} parent(s)', [e.enfants, e.infirmes, e.etudiants, e.parents])],
        [t('Investissement'), fmtTND(calc.investissement) + ' ' + t('par an') + ' (' + fmtTND(e.versement) + ' ' + t(PERIODES[e.frequence]) + ')']
      ].concat(ui.retraite ? [[t('Retraite'), t('Âge actuel {0} ans, départ à {1} ans', [ui.retraite.age, ui.retraite.depart])]] : []),
      comparatif: calc.actif ? elementsComparatif(calc).map(function (x) { return [x[0], fmtTND(x[1]), x[1]]; }) : null,
      deductions: lignesDeductions(sim, e),
      points: pointsEconomie(sim, calc.investissement),
      projection: calc.actif ? lignesProjection(calc) : null,
      hypothesesProjection: calc.actif ? t('{0} ans, rendement {1}, frais {2}, écart entre scénarios ± {3} pts', [e.dureeAns, fmtPct(e.rendementPct), fmtPct(e.fraisPct), esp(nf1.format(calc.sc.ecart))]) +
        (e.croissancePct > 0 ? ', ' + t('hausse annuelle {0}', [fmtPct(e.croissancePct)]) : '') +
        (e.inflationPct > 0 ? ', ' + t('inflation {0}', [fmtPct(e.inflationPct)]) : '') +
        (e.reinvestir ? ', ' + t('économie d\'impôt réinvestie') : '') : '',
      scenarios: calc.actif ? ['prudent', 'median', 'dynamique'].map(function (k) { return [t(NOMS_SCEN[k]) + ' · ' + fmtPct(tauxScenario(calc, k)), fmtTND(calc.sc[k].capitalFinal)]; }) : null,
      rachat: ui.rachat ? { titre: t('Simulation de rachat anticipé'), lignes: lignesRachat(ui.rachat) } : null,
      prevoyance: ui.prevoyance ? { titre: t('Prévoyance'), lignes: lignesPrevoyance(ui.prevoyance) } : null
    };
  }

  function preparerRapport() {
    var calc = ui.calc;
    $('er-date').textContent = t('Édité le {0}', [new Date().toLocaleDateString(I18n.locale(), { day: 'numeric', month: 'long', year: 'numeric' })]) + ' · ' + t('Barème : {0}', [libelleBareme()]);
    var meta = infosConseiller();
    var parts = [];
    if (meta.client) parts.push(t('Client : {0}', [meta.client]));
    if (meta.conseiller) parts.push(t('Conseiller : {0}', [meta.conseiller]));
    parts.push(t('Dossier : {0}', [numeroDossier(lienActuel(), meta.ref)]));
    $('er-conseiller').textContent = parts.join(' · ');
    if (!calc) { $('er-hypotheses').textContent = ''; return; }
    var e = calc.etat;
    $('er-hypotheses').textContent = t('Revenu brut annuel : {0} · Investissement : {1} par an ({2} {3})', [fmtTND(e.revenu), fmtTND(calc.investissement), fmtTND(e.versement), t(PERIODES[e.frequence])]);
  }

  /* Génère le PDF : { blob, nom } ou null si jsPDF est indisponible ou en erreur */
  function genererPdf() {
    if (!window.RapportPDF || !window.jspdf) return null;
    /* Les polices standard du PDF n'ont pas de glyphes arabes : le rapport est alors rédigé en français */
    var langue = I18n.langue();
    if (langue === 'ar') I18n.definir('fr');
    try {
      var d = donneesRapport();
      return { blob: window.RapportPDF.generer(d), nom: 'simulation-' + d.dossier.replace(/[^\w-]+/g, '_') + '.pdf' };
    } catch (err) {
      if (window.console) console.error(err);
      return null;
    } finally {
      I18n.definir(langue);
    }
  }

  function exporterPdf() {
    actualiser();
    if (!ui.calc || !(ui.calc.etat.revenu > 0)) { toast(t('Saisissez d\'abord votre revenu brut annuel imposable.'), 'erreur'); $('revenue').focus(); return; }
    var r = genererPdf();
    if (r) {
      telecharger(r.nom, r.blob, 'application/pdf');
      toast(t('Rapport PDF téléchargé.'));
      return;
    }
    preparerRapport();
    window.print();
  }

  /* ===================================================================
     Portefeuille du conseiller et comparateur
     =================================================================== */
  var COLONNES = [
    ['Revenu brut annuel', 'revenu', 'tnd', null],
    ['Investissement annuel', 'investissementAnnuel', 'tnd', null],
    ['Durée (ans)', 'dureeAns', 'ent', null],
    ['Économie d\'impôt annuelle', 'economie', 'tnd', 'max'],
    ['Taux de réduction', 'tauxReduction', 'pct', 'max'],
    ['Montant optimal', 'optimal', 'tnd', null],
    ['Capital prudent', 'capitalPrudent', 'tnd', null],
    ['Capital médian', 'capitalMedian', 'tnd', 'max'],
    ['Capital dynamique', 'capitalDynamique', 'tnd', null],
    ['Capital médian en dinars constants', 'capitalReel', 'tnd', 'max'],
    ['Total versé', 'totalVerse', 'tnd', null],
    ['Valeur totale (capital + économie d\'impôt)', 'valeurTotale', 'tnd', 'max'],
    ['Rendement annuel effectif', 'rendementEffectif', 'pct', 'max'],
    ['Avantage sur le placement classique', 'avantage', 'tnd', 'max']
  ];

  function fmtColonne(v, type) {
    if (v === null || v === undefined || !isFinite(v)) return '—';
    return type === 'pct' ? fmtPct(v) : type === 'ent' ? String(v) : fmtTND(v);
  }

  function resumeActuel(enr) {
    try { return Scenario.resume(Scenario.calculer(Object.assign(Scenario.defauts(), enr.etat))); } catch (e) { return enr.resume; }
  }

  function afficherPortefeuille() {
    var liste = ui.portefeuille;
    ui.selection = ui.selection.filter(function (id) { return liste.some(function (e) { return e.id === id; }); });
    $('port-vide').hidden = liste.length > 0;
    $('port-export').disabled = !liste.length;
    $('port-sauver').disabled = !liste.length;
    var st = Conseil.statistiques(liste.map(resumeActuel));
    $('port-stats').hidden = !liste.length;
    $('st-nombre').textContent = String(st.nombre);
    $('st-epargne').textContent = fmtTND(st.epargneAnnuelle);
    $('st-economie').textContent = fmtTND(st.economieAnnuelle);
    $('st-capital').textContent = fmtTND(st.capitalMedian);
    $('port-vider').disabled = !liste.length;
    $('port-liste').innerHTML = liste.map(function (enr) {
      var r = enr.resume || {};
      var coche = ui.selection.indexOf(enr.id) !== -1;
      var titre = enr.client || t('Simulation sans nom');
      var meta = [enr.date, enr.ref, t('revenu {0}', [fmtTND(r.revenu || 0)])].filter(Boolean).join(' · ');
      return '<li class="port-item' + (coche ? ' choisi' : '') + '">' +
        '<label class="port-sel"><input type="checkbox" data-id="' + echapper(enr.id) + '"' + (coche ? ' checked' : '') + '>' +
        '<span><span class="port-titre">' + echapper(titre) + '</span><span class="port-meta">' + echapper(meta) + '</span></span></label>' +
        '<span class="port-chiffres"><b>' + fmtTND(r.economie || 0) + '</b><small>' + echapper(t('économie par an')) + '</small></span>' +
        '<span class="port-chiffres"><b>' + (r.capitalMedian != null ? fmtTND(r.capitalMedian) : '—') + '</b><small>' + echapper(t('capital médian')) + '</small></span>' +
        '<span class="port-btns"><button type="button" class="btn btn-ghost btn-sm" data-ouvrir="' + echapper(enr.id) + '">' + echapper(t('Ouvrir')) + '</button>' +
        '<button type="button" class="btn btn-ghost btn-sm btn-icon" data-suppr="' + echapper(enr.id) + '" aria-label="' + echapper(t('Supprimer cette simulation')) + '" title="' + echapper(t('Supprimer cette simulation')) + '"><svg class="ico ico-sm"><use href="#i-trash"/></svg></button></span>' +
        '</li>';
    }).join('');
    majSelection();
  }

  function majSelection() {
    var n = ui.selection.length;
    Array.prototype.forEach.call($('port-liste').querySelectorAll('input[type="checkbox"]'), function (c) {
      c.disabled = !c.checked && n >= 3;
    });
    $('port-comparer').disabled = n < 2;
    $('port-comparer').lastChild.textContent = n >= 2 ? t('Comparer la sélection ({0})', [n]) : t('Comparer la sélection');
    if (!$('port-comparaison').hidden) {
      if (n >= 2) afficherComparaison(); else $('port-comparaison').hidden = true;
    }
  }

  function afficherComparaison() {
    var choisis = ui.selection.map(function (id) { return ui.portefeuille.filter(function (e) { return e.id === id; })[0]; }).filter(Boolean);
    if (choisis.length < 2) return;
    var resumes = choisis.map(resumeActuel);
    var tete = '<tr><th scope="col">' + echapper(t('Critère')) + '</th>' + choisis.map(function (e) {
      return '<th scope="col">' + echapper(e.client || t('Simulation sans nom')) + '<small>' + echapper([e.date, e.ref].filter(Boolean).join(' · ')) + '</small></th>';
    }).join('') + '</tr>';
    var corps = COLONNES.map(function (c) {
      var vals = resumes.map(function (r) { return r[c[1]]; });
      var meilleur = null;
      var valides = vals.filter(function (v) { return v !== null && v !== undefined && isFinite(v); });
      if (c[3] && valides.length > 1) {
        var m = Math.max.apply(null, valides);
        if (valides.some(function (v) { return Math.abs(v - m) > 0.0005; })) meilleur = m;
      }
      return '<tr><th scope="row">' + echapper(t(c[0])) + '</th>' + vals.map(function (v) {
        var top = meilleur !== null && v !== null && isFinite(v) && Math.abs(v - meilleur) <= 0.0005;
        return '<td' + (top ? ' class="meilleur"' : '') + '>' + fmtColonne(v, c[2]) + (top ? ' <span class="etoile" aria-label="' + echapper(t('meilleure valeur')) + '">★</span>' : '') + '</td>';
      }).join('') + '</tr>';
    }).join('');
    var zone = $('port-comparaison');
    zone.innerHTML = '<table class="tranches comparaison"><thead>' + tete + '</thead><tbody>' + corps + '</tbody></table><p class="legende">★ ' + echapper(t('meilleure valeur')) + '</p>';
    zone.hidden = false;
  }

  function rafraichirPortefeuille() {
    if (!depot) return Promise.resolve();
    return depot.lister().then(function (l) { ui.portefeuille = l; afficherPortefeuille(); }).catch(function () {});
  }

  function enregistrer() {
    actualiser();
    if (!depot) { toast(t('Le portefeuille n\'est pas disponible dans ce navigateur.'), 'erreur'); return; }
    if (!ui.calc || !(ui.calc.etat.revenu > 0)) { toast(t('Saisissez d\'abord votre revenu brut annuel imposable.'), 'erreur'); return; }
    var enr = Port.creerEnregistrement(ui.calc.etat, Scenario.resume(ui.calc), infosConseiller());
    depot.ajouter(enr).then(rafraichirPortefeuille).then(function () {
      toast(t('Simulation enregistrée dans le portefeuille.'));
    }).catch(function () { toast(t('Enregistrement impossible.'), 'erreur'); });
  }

  function restaurer(fichier) {
    if (!fichier || !depot) return;
    var lecteur = new FileReader();
    lecteur.onload = function () {
      var r = Conseil.importerSauvegarde(String(lecteur.result));
      if (r.erreur || !r.simulations.length) { toast(t('Fichier de sauvegarde non reconnu.'), 'erreur'); return; }
      r.simulations.reduce(function (p, enr) { return p.then(function () { return depot.ajouter(enr); }); }, Promise.resolve())
        .then(rafraichirPortefeuille)
        .then(function () { toast(t('{0} simulation(s) restaurée(s).', [r.simulations.length])); })
        .catch(function () { toast(t('Enregistrement impossible.'), 'erreur'); });
    };
    lecteur.onerror = function () { toast(t('Fichier de sauvegarde non reconnu.'), 'erreur'); };
    lecteur.readAsText(fichier);
  }

  function exporterPortefeuille() {
    var cols = COLONNES.map(function (c) { return [t(c[0]), c[1]]; });
    var liste = ui.portefeuille.map(function (e) { return Object.assign({}, e, { resume: resumeActuel(e) }); });
    telecharger('portefeuille-simulations-' + dateIso() + '.csv', XL.portefeuille(liste, cols), 'text/csv;charset=utf-8');
  }

  /* ===================================================================
     Langue
     =================================================================== */
  function appliquerLangue(l, initial) {
    I18n.definir(l);
    var html = document.documentElement;
    html.lang = I18n.langue();
    html.dir = I18n.langue() === 'ar' ? 'rtl' : 'ltr';
    $('langue').value = I18n.langue();
    I18n.traduireDom(document.body);
    document.title = t(I18n.titreOriginal());
    try { localStorage.setItem('langue', I18n.langue()); } catch (e) {}
    majBareme();
    calculateAndDisplay();
    afficherPortefeuille();
    if (!$('install-aide').hidden) $('install-texte').textContent = explicationInstallation();
    if (!initial) toast(t('Langue : français'));
  }

  /* ===================================================================
     Événements
     =================================================================== */
  var attente = null;
  function planifier() { clearTimeout(attente); attente = setTimeout(function () { attente = null; calculateAndDisplay(); }, 60); }
  /* Applique un recalcul encore en attente (clic juste après une saisie) */
  function actualiser() { if (attente) { clearTimeout(attente); attente = null; calculateAndDisplay(); } }

  $('revenue').addEventListener('input', function () { majCurseur(); planifier(); });
  $('revenue-r').addEventListener('input', function () {
    $('revenue').value = fmtLibre(+this.value);
    majCurseur();
    planifier();
  });
  ['revenue', 'investment-amount-period', 'inv-cible', 'v-garanti', 'v-pension', 'obj-capital'].forEach(function (id) {
    $(id).addEventListener('blur', function () {
      var r = Saisie.lireNombre(this.value);
      /* Une saisie ambiguë (« 45,000 ») est laissée telle quelle pour que l'avertissement reste visible */
      if (!r.vide && isFinite(r.v) && !r.ambigu) this.value = fmtLibre(r.v);
    });
  });
  $('investment-amount-period').addEventListener('input', planifier);
  $('inv-cible').addEventListener('input', planifier);
  ['obj-capital', 'p-age', 'p-depart'].forEach(function (id) { $(id).addEventListener('input', planifier); });
  $('p-retraite').addEventListener('change', function () {
    calculateAndDisplay();
    if (this.checked && !$('p-age').value) $('p-age').focus();
  });
  $('obj-appliquer').addEventListener('click', function () { actualiser(); if (ui.objectif > 0) appliquerMontantPeriode(ui.objectif); });
  champsHypotheses.forEach(function (id) { $(id).addEventListener('input', planifier); });
  $('p-reinvest').addEventListener('change', calculateAndDisplay);
  ['r-annee', 'r-part', 'r-penalite'].forEach(function (id) {
    $(id).addEventListener('input', function () { if (id === 'r-annee') this.dataset.touche = '1'; majRachat(); });
  });
  ['v-duree-rente', 'v-taux-rente', 'v-deces-annee', 'v-garanti', 'v-pension'].forEach(function (id) {
    $(id).addEventListener('input', function () { if (id === 'v-deces-annee') this.dataset.touche = '1'; majPrevoyance(); });
  });

  /* Type de support : fixe l'écart entre scénarios */
  function synchroniserSupport() {
    var v = nombre('p-ecart');
    var cle = Object.keys(Scenario.SUPPORTS).filter(function (k) { return Scenario.SUPPORTS[k] === v; })[0];
    $('p-support').value = cle || 'perso';
  }
  $('p-support').addEventListener('change', function () {
    var ecart = Scenario.SUPPORTS[this.value];
    if (ecart !== undefined) { $('p-ecart').value = fmtLibre(ecart); calculateAndDisplay(); }
    else $('p-ecart').focus();
  });
  $('p-ecart').addEventListener('input', synchroniserSupport);

  champsEntiers.forEach(function (id) {
    var el = $(id);
    el.addEventListener('input', function () {
      var brut = el.value.replace(/\D/g, '');
      if (el.value !== brut) el.value = brut;
      majSteppers();
      planifier();
    });
    el.addEventListener('blur', function () { el.value = String(lireEntier(id)); majSteppers(); });
    el.addEventListener('focus', function () { el.select(); });
  });
  document.querySelectorAll('.stepper').forEach(function (st) {
    st.addEventListener('click', function (e) {
      var b = e.target.closest('[data-pas]');
      if (!b || b.disabled) return;
      var id = st.dataset.for;
      var max = +(st.dataset.max || 99);
      var n = Math.min(max, Math.max(0, lireEntier(id) + Number(b.dataset.pas)));
      var input = $(id);
      input.value = String(n);
      input.classList.remove('bump'); void input.offsetWidth; input.classList.add('bump');
      majSteppers();
      calculateAndDisplay();
    });
  });

  var segments = {};
  function brancherSegments(id, surChoix) {
    var conteneur = $(id);
    var boutons = Array.prototype.slice.call(conteneur.querySelectorAll('[role="radio"]'));
    function marquer(b) { boutons.forEach(function (x) { var on = x === b; x.setAttribute('aria-checked', String(on)); x.tabIndex = on ? 0 : -1; }); }
    function choisir(b, focus) {
      marquer(b);
      if (focus) b.focus();
      surChoix(b.dataset.val);
    }
    boutons.forEach(function (b) {
      b.tabIndex = b.getAttribute('aria-checked') === 'true' ? 0 : -1;
      b.addEventListener('click', function () { choisir(b, false); });
      b.addEventListener('keydown', function (e) {
        var i = boutons.indexOf(b), n = null;
        var rtl = document.documentElement.dir === 'rtl';
        if (e.key === 'ArrowDown' || e.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) n = boutons[(i + 1) % boutons.length];
        if (e.key === 'ArrowUp' || e.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) n = boutons[(i - 1 + boutons.length) % boutons.length];
        if (n) { e.preventDefault(); choisir(n, true); }
      });
    });
    segments[id] = function (val) {
      var b = boutons.filter(function (x) { return x.dataset.val === val; })[0];
      if (b) marquer(b);
    };
  }
  function selectionnerSegment(id, val) { if (segments[id]) segments[id](val); }
  brancherSegments('chef', function (v) { ui.chef = v === '1'; calculateAndDisplay(); });
  brancherSegments('frequence', function (v) { ui.frequence = v; calculateAndDisplay(); });

  function appliquerMontantPeriode(periode) {
    $('investment-amount-period').value = fmtLibre(periode);
    calculateAndDisplay();
    toast(t('Montant appliqué : {0} {1}.', [fmtTND(periode), t(PERIODES[ui.frequence])]));
  }
  $('appliquer').addEventListener('click', function () {
    var optimal = parseFloat($('suggest').dataset.optimal) || 0;
    if (optimal <= 0) return;
    /* Arrondi au millime supérieur : le total couvre au moins le montant optimal */
    appliquerMontantPeriode(Math.ceil(optimal / FACTEURS[ui.frequence] * 1000 - 1e-7) / 1000);
  });
  $('inv-appliquer').addEventListener('click', function () { actualiser(); if (ui.inverse > 0) appliquerMontantPeriode(ui.inverse); });

  /* PDF, partage, enregistrement */
  window.addEventListener('beforeprint', preparerRapport);
  Array.prototype.forEach.call(document.querySelectorAll('.js-pdf'), function (b) { b.addEventListener('click', exporterPdf); });
  $('partager').addEventListener('click', function () {
    var p = $('panneau-partage');
    p.hidden = !p.hidden;
    this.setAttribute('aria-expanded', String(!p.hidden));
    if (!p.hidden) { majPartage(); $('lien-partage').select(); }
  });
  $('copier-lien').addEventListener('click', function () {
    copier($('lien-partage').value).then(function () { toast(t('Lien copié : envoyez-le à votre client.')); }, function () { toast(t('Copie impossible : sélectionnez le lien et copiez-le.'), 'erreur'); });
  });
  $('lien-partage').addEventListener('focus', function () { this.select(); });
  $('enregistrer').addEventListener('click', enregistrer);
  $('envoi-pdf').hidden = !partagePdfPossible();
  $('envoi-pdf').addEventListener('click', function () {
    actualiser();
    var r = genererPdf();
    if (!r) { toast(t('Envoi impossible depuis ce navigateur : téléchargez le PDF.'), 'erreur'); return; }
    navigator.share({ files: [new File([r.blob], r.nom, { type: 'application/pdf' })], title: t('Rapport de simulation'), text: $('lien-partage').value })
      .catch(function (e) { if (!e || e.name !== 'AbortError') toast(t('Envoi impossible depuis ce navigateur : téléchargez le PDF.'), 'erreur'); });
  });

  /* Infobulles d'explication */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.aide');
    if (!b) return;
    var cible = $(b.getAttribute('aria-controls'));
    var ouvert = b.getAttribute('aria-expanded') !== 'true';
    b.setAttribute('aria-expanded', String(ouvert));
    cible.hidden = !ouvert;
  });

  /* Agence */
  Object.keys(CHAMPS_AGENCE).forEach(function (k) { $(CHAMPS_AGENCE[k]).addEventListener('input', sauverAgence); });
  $('c-conseiller').addEventListener('input', sauverAgence);
  $('ag-logo').addEventListener('change', function () { lireLogo(this.files && this.files[0]); this.value = ''; });
  $('ag-logo-retirer').addEventListener('click', function () { agence.logo = null; sauverAgence(); afficherLogo(); toast(t('Logo retiré.')); });
  $('export-projection').addEventListener('click', function () {
    actualiser();
    var c = ui.calc;
    if (!c || !c.actif) return;
    telecharger('projection-' + dateIso() + '.csv', XL.projectionAnnuelle(c.med.annees, [t('Année'), t('Total versé'), t('Capital (scénario médian)'), t('Capital en dinars constants')]), 'text/csv;charset=utf-8');
  });

  $('mode-conseiller').addEventListener('click', function () {
    var carte = $('carte-conseiller');
    carte.hidden = !carte.hidden;
    this.setAttribute('aria-pressed', String(!carte.hidden));
    if (!carte.hidden) $('c-client').focus();
  });

  /* Portefeuille */
  $('port-liste').addEventListener('change', function (e) {
    var c = e.target.closest('input[type="checkbox"]');
    if (!c) return;
    var id = c.dataset.id;
    if (c.checked && ui.selection.indexOf(id) === -1) ui.selection.push(id);
    if (!c.checked) ui.selection = ui.selection.filter(function (x) { return x !== id; });
    c.closest('.port-item').classList.toggle('choisi', c.checked);
    majSelection();
  });
  $('port-liste').addEventListener('click', function (e) {
    var ouvrir = e.target.closest('[data-ouvrir]');
    var suppr = e.target.closest('[data-suppr]');
    if (ouvrir) {
      var enr = ui.portefeuille.filter(function (x) { return x.id === ouvrir.dataset.ouvrir; })[0];
      if (!enr) return;
      appliquerEtat(enr.etat);
      if (enr.client || enr.conseiller || enr.ref) {
        $('carte-conseiller').hidden = false;
        $('mode-conseiller').setAttribute('aria-pressed', 'true');
        $('c-client').value = enr.client || '';
        $('c-conseiller').value = enr.conseiller || '';
        $('c-ref').value = enr.ref || '';
      }
      window.scrollTo({ top: 0, behavior: mouvementReduit.matches ? 'auto' : 'smooth' });
      toast(t('Simulation ouverte.'));
    }
    if (suppr && depot) {
      depot.supprimer(suppr.dataset.suppr).then(rafraichirPortefeuille).then(function () { toast(t('Simulation supprimée.')); });
    }
  });
  $('port-comparer').addEventListener('click', function () {
    afficherComparaison();
    $('port-comparaison').scrollIntoView({ behavior: mouvementReduit.matches ? 'auto' : 'smooth', block: 'nearest' });
  });
  $('port-export').addEventListener('click', exporterPortefeuille);
  $('port-sauver').addEventListener('click', function () {
    telecharger('portefeuille-sauvegarde-' + dateIso() + '.json', Conseil.exporterSauvegarde(ui.portefeuille), 'application/json');
    toast(t('Sauvegarde téléchargée : conservez ce fichier pour restaurer le portefeuille sur un autre appareil.'));
  });
  $('port-restaurer').addEventListener('change', function () { restaurer(this.files && this.files[0]); this.value = ''; });
  $('port-vider').addEventListener('click', function () {
    if (!depot || !window.confirm(t('Supprimer toutes les simulations enregistrées dans ce navigateur ?'))) return;
    depot.vider().then(function () { ui.selection = []; $('port-comparaison').hidden = true; return rafraichirPortefeuille(); }).then(function () { toast(t('Portefeuille vidé.')); });
  });

  /* Thème (clé « theme » conservée : « light » ou « dark ») */
  $('theme-toggle').addEventListener('click', function () {
    var html = document.documentElement;
    var suivant = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', suivant);
    try { localStorage.setItem('theme', suivant); } catch (e) {}
    majMetaTheme();
  });
  function majMetaTheme() {
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', document.documentElement.getAttribute('data-theme') === 'dark' ? '#0b0a11' : '#4f46e5');
  }

  /* Sélecteur d'année : affiché seulement si plusieurs barèmes sont configurés */
  function initialiserAnnees() {
    var cles = Object.keys(Baremes.annees).sort();
    var sel = $('annee-bareme');
    if (cles.length < 2) return;
    sel.innerHTML = cles.map(function (k) { return '<option value="' + echapper(k) + '">' + echapper(Baremes.annees[k].libelle) + '</option>'; }).join('');
    sel.value = ui.annee;
    sel.hidden = false;
    sel.addEventListener('change', function () { ui.annee = sel.value; majBareme(); calculateAndDisplay(); });
  }

  $('langue').addEventListener('change', function () { appliquerLangue(this.value); });
  window.addEventListener('hashchange', chargerDepuisLien);

  /* Installation de l'application : invitation du navigateur (Chrome, Edge, Android),
     sinon explications selon l'appareil (iPhone et iPad, Safari sur Mac, autres navigateurs) */
  function estInstallee() {
    return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  }
  function explicationInstallation() {
    var ua = navigator.userAgent || '';
    var ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (ios) return t('Sur iPhone ou iPad : touchez le bouton Partager de Safari, puis « Sur l\'écran d\'accueil ».');
    if (/Safari/.test(ua) && !/Chrome|Chromium|Edg|Firefox/.test(ua)) return t('Sur Mac avec Safari : menu Fichier, puis « Ajouter au Dock ».');
    if (/Android/.test(ua)) return t('Sur Android : ouvrez le menu ⋮ du navigateur, puis « Installer l\'application » ou « Ajouter à l\'écran d\'accueil ».');
    return t('Ouvrez cette page avec Chrome ou Edge, puis cliquez sur l\'icône d\'installation dans la barre d\'adresse (ou menu ⋮, « Installer »).');
  }
  function majInstallation() { $('installer').hidden = estInstallee(); }
  $('installer').addEventListener('click', function () {
    var invitation = window.__invitationInstallation;
    if (invitation) {
      invitation.prompt();
      invitation.userChoice.then(function (choix) {
        window.__invitationInstallation = null;
        if (choix && choix.outcome === 'accepted') toast(t('Installation en cours : l\'application sera disponible depuis votre écran d\'accueil.'));
      }).catch(function () {});
      return;
    }
    $('install-texte').textContent = explicationInstallation();
    $('install-aide').hidden = false;
  });
  $('install-fermer').addEventListener('click', function () { $('install-aide').hidden = true; });
  document.addEventListener('installation-possible', majInstallation);
  window.addEventListener('appinstalled', function () {
    window.__invitationInstallation = null;
    $('installer').hidden = true;
    $('install-aide').hidden = true;
    toast(t('Application installée.'));
  });
  majInstallation();

  /* Mode hors ligne (PWA) : seulement en HTTPS ou en local */
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }

  /* Démarrage */
  $('annee').textContent = new Date().getFullYear();
  initialiserAnnees();
  chargerAgence();
  majMetaTheme();
  majCurseur();
  majSteppers();
  var langue = null;
  try { langue = localStorage.getItem('langue'); } catch (e) {}
  if (!langue) langue = (navigator.language || 'fr').slice(0, 2);
  appliquerLangue(langue, true);
  chargerDepuisLien();

  Port.ouvrir().then(function (d) { depot = d; return rafraichirPortefeuille(); }).catch(function () {
    $('port-vide').textContent = t('Le portefeuille n\'est pas disponible dans ce navigateur (stockage local désactivé).');
    $('enregistrer').disabled = true;
  });
})();
