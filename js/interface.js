/* Interface : lecture des saisies, affichage des résultats, projection, rapport imprimable.
   Les calculs sont dans moteur-fiscal.js et projection.js (fonctions pures testées). */
(function () {
  'use strict';

  var Moteur = window.MoteurFiscal;
  var Baremes = window.Baremes;
  var Proj = window.Projection;
  var Graph = window.Graphiques;

  var FACTEURS = Moteur.FACTEURS;
  var PERIODES = { Mensuel: 'par mois', Trimestriel: 'par trimestre', Semestriel: 'par semestre', Annuel: 'par an' };
  var DUREE_MAX = 40;

  /* ===================================================================
     Formatage et saisie
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

  function $(id) { return document.getElementById(id); }

  function lireNombre(s) {
    var t = String(s == null ? '' : s).trim().replace(/[\s  ]/g, '').replace(',', '.');
    if (t === '') return { vide: true, v: 0 };
    if (!/^(\d+\.?\d*|\.\d+)$/.test(t)) return { vide: false, v: NaN };
    return { vide: false, v: Number(t) };
  }

  function echapper(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }

  function animer(el, vers, rendu) {
    var de = parseFloat(el.dataset.val);
    el.dataset.val = vers;
    if (el._raf) cancelAnimationFrame(el._raf);
    if (mouvementReduit.matches || document.hidden || !isFinite(de) || de === vers) { el.innerHTML = rendu(vers); return; }
    var t0 = performance.now(), duree = 520;
    function pas(t) {
      var p = Math.min(1, (t - t0) / duree);
      var e = 1 - Math.pow(1 - p, 3);
      el.innerHTML = rendu(p < 1 ? de + (vers - de) * e : vers);
      if (p < 1) el._raf = requestAnimationFrame(pas);
    }
    el._raf = requestAnimationFrame(pas);
  }

  function toast(message) {
    var zone = $('toasts');
    var el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = '<span class="t-ico"><svg class="ico"><use href="#i-check"/></svg></span><span></span>';
    el.lastChild.textContent = message;
    zone.appendChild(el);
    while (zone.children.length > 2) zone.removeChild(zone.firstChild);
    setTimeout(function () { el.classList.add('sortie'); setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 240); }, 2800);
  }

  /* ===================================================================
     État de l'interface
     =================================================================== */
  var etat = { chef: false, frequence: 'Mensuel', annee: Baremes.parDefaut, derniere: null };
  var champsEntiers = ['children', 'disabled-children', 'students', 'parents'];

  function lireEntier(id) {
    var el = $(id);
    var max = id === 'parents' ? 2 : 99;
    var n = parseInt(String(el.value).replace(/\D/g, ''), 10);
    if (!isFinite(n) || n < 0) n = 0;
    return Math.min(n, max);
  }

  function majCurseur() {
    var r = $('revenue-r');
    var v = lireNombre($('revenue').value).v;
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

  function majBareme() {
    var r = Baremes.annees[etat.annee];
    $('badge-bareme').textContent = 'Barème de la ' + r.libelle.charAt(0).toLowerCase() + r.libelle.slice(1);
    $('remarque-bareme').textContent = 'Ce tableau applique le barème de la ' + r.libelle.charAt(0).toLowerCase() + r.libelle.slice(1) + '. ' + r.source;
  }

  /* ===================================================================
     Calcul et affichage
     =================================================================== */
  function calculateAndDisplay() {
    var rev = lireNombre($('revenue').value);
    var per = lireNombre($('investment-amount-period').value);

    $('f-revenue').classList.toggle('invalide', !isFinite(rev.v));
    $('revenue-err').textContent = isFinite(rev.v) ? '' : 'Saisissez un montant valide (ex. 45 000).';
    $('f-period').classList.toggle('invalide', !isFinite(per.v));
    $('period-err').textContent = isFinite(per.v) ? '' : 'Saisissez un montant valide (ex. 500).';

    var revenue = isFinite(rev.v) ? rev.v : 0;
    var period = isFinite(per.v) ? per.v : 0;
    var factor = FACTEURS[etat.frequence];
    var investment = period * factor;

    $('lbl-period').textContent = 'Montant à investir ' + PERIODES[etat.frequence];
    $('total-formule').textContent = fmtAmount(period) + ' × ' + factor + ' versement' + (factor > 1 ? 's' : '') + ' par an';
    animer($('investment-amount-total'), investment, fmtHtml);

    var entree = {
      revenu: revenue, chef: etat.chef,
      enfants: lireEntier('children'), infirmes: lireEntier('disabled-children'),
      etudiants: lireEntier('students'), parents: lireEntier('parents'),
      investissement: investment
    };
    var sim = Moteur.simuler(entree, etat.annee);
    etat.derniere = { entree: entree, sim: sim, period: period, factor: factor };

    majSuggestion(sim.optimal, investment, factor);

    var aDesResultats = revenue > 0;
    var etaitCache = $('resultats').hidden;
    $('vide').hidden = aDesResultats;
    $('resultats').hidden = !aDesResultats;
    if (!aDesResultats) { $('resume-vocal').textContent = ''; return; }

    if (etaitCache) ['tax-saved', 'tax-reduction-rate'].forEach(function (id) { delete $(id).dataset.val; });

    afficherIndicateurs(sim);
    afficherDeductions(sim, entree);
    afficherTranches(sim);
    afficherCourbeEconomie(sim, investment);
    majProjection();

    $('resume-vocal').textContent = 'Économie d\'impôt de ' + fmtTND(sim.economie) + ' par an, soit ' + fmtPct(sim.tauxReduction) + ' de réduction. Montant optimal à investir : ' + fmtTND(sim.optimal) + '.';
  }

  function afficherIndicateurs(sim) {
    animer($('tax-saved'), sim.economie, fmtHtml);
    $('tax-saved-monthly').textContent = fmtTND(sim.economie / 12);
    animer($('tax-reduction-rate'), sim.tauxReduction, function (v) { return v.toFixed(1).replace('.', ',') + '<span class="unit">%</span>'; });
    var circ = 263.894;
    $('gauge-fg').style.strokeDashoffset = String(circ * (1 - Math.min(sim.tauxReduction, 55) / 55));
    $('gauge-txt').innerHTML = sim.tauxReduction >= 54.95 ? 'plafond<br>atteint' : esp(nf1.format(55 - sim.tauxReduction)) + ' %<br>restants';

    $('tax-before').innerHTML = fmtHtml(sim.impotAvant);
    $('tax-after').innerHTML = fmtHtml(sim.impotApres);
    $('min-tax').innerHTML = fmtHtml(sim.impotMinimum);
    $('optimal-investment').innerHTML = fmtHtml(sim.optimal);
    var ref = sim.impotAvant > 0 ? sim.impotAvant : 1;
    $('bar-avant').style.width = (sim.impotAvant > 0 ? 100 : 0) + '%';
    $('bar-apres').style.width = (sim.impotApres / ref * 100) + '%';
    $('bar-floor').style.left = (sim.impotAvant > 0 ? 45 : 0) + '%';
    $('bar-floor').style.display = sim.impotAvant > 0 ? '' : 'none';
  }

  function afficherDeductions(sim, entree) {
    var det = sim.deductionsDetail;
    var lignes = [
      ['Revenu brut annuel imposable', sim.revenu, ''],
      ['Frais professionnels (10 %, 2 000 max.)', det.professionalExpenses, 'moins sous'],
      ['Chef de famille', det.headOfFamily, 'moins sous'],
      ['Enfants à charge' + (entree.enfants ? ' (' + entree.enfants + ')' : ''), det.children, 'moins sous'],
      ['Enfants infirmes' + (entree.infirmes ? ' (' + entree.infirmes + ')' : ''), det.disabledChildren, 'moins sous'],
      ['Étudiants sans bourse' + (entree.etudiants ? ' (' + entree.etudiants + ')' : ''), det.students, 'moins sous'],
      ['Parents à charge' + (entree.parents ? ' (' + entree.parents + ')' : ''), det.parents, 'moins sous'],
      ['Revenu net imposable', sim.revenuNet, 'total'],
      ['Investissement déduit', Math.min(sim.investissement, sim.revenuNet), 'moins inv'],
      ['Revenu net après investissement', sim.revenuNetApres, 'total']
    ];
    $('deductions').innerHTML = lignes.map(function (l) {
      var moins = l[2].indexOf('moins') !== -1;
      var nul = moins && l[1] === 0 ? ' nul' : '';
      return '<div class="ded-row ' + l[2] + nul + '"><span>' + l[0] + '</span><span class="v">' + (moins && l[1] > 0 ? '− ' : '') + fmtTND(l[1]) + '</span></div>';
    }).join('');
  }

  function afficherTranches(sim) {
    var couleurs = ['#64748b', '#0ea5e9', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];
    var totAv = 0, totAp = 0;
    $('tax-brackets-comparison').innerHTML = sim.avant.byBracket.map(function (bd, i) {
      var ad = sim.apres.byBracket[i] || { tax: 0 };
      var savings = bd.tax - ad.tax;
      totAv += bd.tax; totAp += ad.tax;
      var actif = bd.tax > 0 || ad.tax > 0 || bd.amount > 0;
      var debut = bd.min > 0 ? bd.min + 1 : 0;
      var maxAff = bd.max === Infinity ? '∞' : fmtEntier(bd.max);
      return '<tr' + (actif ? '' : ' class="inactive"') + '><td>' + fmtEntier(debut) + ' – ' + maxAff + '</td>' +
        '<td><span class="rate" style="background:' + couleurs[i % couleurs.length] + '">' + (bd.rate * 100).toFixed(0) + ' %</span></td>' +
        '<td>' + fmtAmount(bd.tax) + '</td><td>' + fmtAmount(ad.tax) + '</td>' +
        '<td' + (savings > 0.0005 ? ' class="eco"' : '') + '>' + fmtAmount(savings) + '</td></tr>';
    }).join('');
    $('tranches-total').innerHTML = '<tr><td>Total</td><td></td><td>' + fmtAmount(totAv) + '</td><td>' + fmtAmount(totAp) + '</td><td class="eco">' + fmtAmount(totAv - totAp) + '</td></tr>';
  }

  function afficherCourbeEconomie(sim, investissement) {
    var xMax = Math.max(sim.optimal * 1.5, investissement * 1.15, 100);
    var points = [];
    for (var i = 0; i <= 40; i++) {
      var x = xMax * i / 40;
      points.push([x, Moteur.economiePourInvestissement(sim, x)]);
    }
    $('graph-economie').innerHTML = Graph.courbeEconomie({
      points: points, optimal: sim.optimal, courant: investissement,
      economieCourante: Moteur.economiePourInvestissement(sim, investissement)
    });
  }

  /* ===================================================================
     Projection du capital
     =================================================================== */
  function lireHypotheses() {
    var duree = lireNombre($('p-duree').value);
    var rend = lireNombre($('p-rendement').value);
    var frais = lireNombre($('p-frais').value);
    var compar = lireNombre($('p-compar').value);
    var erreur = '';
    if (!isFinite(duree.v) || duree.v < 1 || duree.v > DUREE_MAX || Math.floor(duree.v) !== duree.v) erreur = 'La durée doit être un nombre entier d\'années entre 1 et ' + DUREE_MAX + '.';
    else if (!isFinite(rend.v) || rend.v > 50) erreur = 'Le rendement annuel doit être compris entre 0 et 50 %.';
    else if (!isFinite(frais.v) || frais.v > 20) erreur = 'Les frais de gestion doivent être compris entre 0 et 20 %.';
    else if (!isFinite(compar.v) || compar.v > 50) erreur = 'Le taux du placement classique doit être compris entre 0 et 50 %.';
    return { erreur: erreur, dureeAns: duree.v, rendementPct: rend.v, fraisPct: frais.v, comparPct: compar.v, reinvestir: $('p-reinvest').checked };
  }

  function ligne(libelle, valeur, classe) {
    return '<div class="tax-row' + (classe ? ' ' + classe : '') + '"><span class="l">' + libelle + '</span><span class="v">' + valeur + '</span></div>';
  }

  function majProjection() {
    var d = etat.derniere;
    if (!d) return;
    var h = lireHypotheses();
    $('proj-err').textContent = h.erreur;
    var actif = !h.erreur && d.period > 0;
    $('proj-vide').hidden = actif || !!h.erreur;
    $('proj-resultat').hidden = !actif;
    if (!actif) return;

    var p = {
      versement: d.period, periodesParAn: d.factor, dureeAns: h.dureeAns,
      rendementPct: h.rendementPct, fraisPct: h.fraisPct,
      economieAnnuelle: d.sim.economie, reinvestir: h.reinvestir
    };
    var sc = Proj.scenarios(p);
    ['prudent', 'median', 'dynamique'].forEach(function (k) {
      var taux = Math.max(0, h.rendementPct + (k === 'prudent' ? -Proj.ECART_SCENARIOS : k === 'dynamique' ? Proj.ECART_SCENARIOS : 0));
      $('scen-l-' + k).textContent = { prudent: 'Prudent', median: 'Médian', dynamique: 'Dynamique' }[k] + ' · ' + esp(nf1.format(taux)) + ' %';
      $('scen-' + k).textContent = fmtTND(sc[k].capitalFinal);
    });
    $('graph-capital').innerHTML = Graph.courbeCapital(sc);

    var med = sc.median;
    var valeurTotale = med.capitalFinal + (h.reinvestir ? 0 : med.economieCumulee);
    var classique = Proj.placementClassique(p, h.comparPct);
    var effectif = Proj.rendementEffectif(p);
    var lignes = [
      ligne('Total versé sur ' + h.dureeAns + ' an' + (h.dureeAns > 1 ? 's' : ''), fmtTND(med.totalVerse)),
      ligne('Capital au terme (scénario médian)', fmtTND(med.capitalFinal)),
      ligne('Gain financier', fmtTND(med.gain)),
      ligne('Économie d\'impôt cumulée' + (h.reinvestir ? ' (réinvestie)' : ''), fmtTND(med.economieCumulee)),
      ligne('Valeur totale (capital + économie d\'impôt)', fmtTND(valeurTotale), 'fort'),
      ligne('Rendement annuel effectif, économie d\'impôt comprise', effectif === null ? '—' : fmtPct(effectif)),
      ligne('Placement classique à ' + fmtPct(h.comparPct) + ' (mêmes versements)', fmtTND(classique)),
      ligne('Avantage sur le placement classique', (valeurTotale - classique >= 0 ? '+' : '') + fmtTND(valeurTotale - classique), valeurTotale >= classique ? 'fort' : '')
    ];
    $('proj-lignes').innerHTML = lignes.join('');
  }

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
      etatEl.innerHTML = '<svg class="ico ico-sm"><use href="#i-check"/></svg>Plancher atteint';
      btn.disabled = Math.abs(investment - optimal) < 0.0005 * factor + 1e-9;
      if (investment > optimal + 0.0005 * factor + 1e-9) {
        alerte.hidden = false;
        $('alerte-texte').textContent = 'Au-delà de ' + fmtTND(optimal) + ' par an, l\'investissement supplémentaire (' + fmtTND(investment - optimal) + ') ne réduit plus votre impôt : le plancher de 45 % est déjà atteint.';
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

  /* ===================================================================
     Rapport imprimable (export PDF) et mode conseiller
     =================================================================== */
  function preparerRapport() {
    var d = etat.derniere;
    var r = Baremes.annees[etat.annee];
    $('er-date').textContent = 'Édité le ' + new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) + ' · Barème : ' + r.libelle;
    var enConseiller = !$('carte-conseiller').hidden;
    var parts = [];
    if (enConseiller) {
      if ($('c-client').value.trim()) parts.push('Client : ' + $('c-client').value.trim());
      if ($('c-conseiller').value.trim()) parts.push('Conseiller : ' + $('c-conseiller').value.trim());
      if ($('c-ref').value.trim()) parts.push('Dossier : ' + $('c-ref').value.trim());
    }
    $('er-conseiller').textContent = parts.join(' · ');
    if (!d) { $('er-hypotheses').textContent = ''; return; }
    var txt = 'Revenu brut annuel : ' + fmtTND(d.entree.revenu) + ' · Investissement : ' + fmtTND(d.entree.investissement) + ' par an (' + fmtTND(d.period) + ' ' + PERIODES[etat.frequence] + ')';
    var h = lireHypotheses();
    if (!h.erreur && d.period > 0) {
      txt += ' · Projection : ' + h.dureeAns + ' ans, rendement ' + fmtPct(h.rendementPct) + ', frais ' + fmtPct(h.fraisPct) + (h.reinvestir ? ', économie d\'impôt réinvestie' : '');
    }
    $('er-hypotheses').textContent = txt;
  }

  window.addEventListener('beforeprint', preparerRapport);
  Array.prototype.forEach.call(document.querySelectorAll('.js-pdf'), function (b) {
    b.addEventListener('click', function () { preparerRapport(); window.print(); });
  });
  $('mode-conseiller').addEventListener('click', function () {
    var carte = $('carte-conseiller');
    carte.hidden = !carte.hidden;
    this.setAttribute('aria-pressed', String(!carte.hidden));
    if (!carte.hidden) $('c-client').focus();
  });

  /* ===================================================================
     Événements
     =================================================================== */
  var attente = null;
  function planifier() { clearTimeout(attente); attente = setTimeout(calculateAndDisplay, 60); }

  $('revenue').addEventListener('input', function () { majCurseur(); planifier(); });
  $('revenue-r').addEventListener('input', function () {
    $('revenue').value = esp(nfLibre.format(+this.value));
    majCurseur();
    planifier();
  });
  ['revenue', 'investment-amount-period'].forEach(function (id) {
    $(id).addEventListener('blur', function () {
      var r = lireNombre(this.value);
      if (!r.vide && isFinite(r.v)) this.value = esp(nfLibre.format(r.v));
    });
  });
  $('investment-amount-period').addEventListener('input', planifier);
  ['p-duree', 'p-rendement', 'p-frais', 'p-compar'].forEach(function (id) { $(id).addEventListener('input', function () { majProjection(); }); });
  $('p-reinvest').addEventListener('change', majProjection);

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

  function brancherSegments(conteneur, surChoix) {
    var boutons = Array.prototype.slice.call(conteneur.querySelectorAll('[role="radio"]'));
    function choisir(b, focus) {
      boutons.forEach(function (x) { var on = x === b; x.setAttribute('aria-checked', String(on)); x.tabIndex = on ? 0 : -1; });
      if (focus) b.focus();
      surChoix(b.dataset.val);
    }
    boutons.forEach(function (b) {
      b.tabIndex = b.getAttribute('aria-checked') === 'true' ? 0 : -1;
      b.addEventListener('click', function () { choisir(b, false); });
      b.addEventListener('keydown', function (e) {
        var i = boutons.indexOf(b), n = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = boutons[(i + 1) % boutons.length];
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = boutons[(i - 1 + boutons.length) % boutons.length];
        if (n) { e.preventDefault(); choisir(n, true); }
      });
    });
  }
  brancherSegments($('chef'), function (v) { etat.chef = v === '1'; calculateAndDisplay(); });
  brancherSegments($('frequence'), function (v) { etat.frequence = v; calculateAndDisplay(); });

  $('appliquer').addEventListener('click', function () {
    var optimal = parseFloat($('suggest').dataset.optimal) || 0;
    if (optimal <= 0) return;
    var factor = FACTEURS[etat.frequence];
    /* Arrondi au millime supérieur : le total couvre au moins le montant optimal */
    var period = Math.ceil(optimal / factor * 1000 - 1e-7) / 1000;
    $('investment-amount-period').value = esp(nfLibre.format(period));
    calculateAndDisplay();
    toast('Montant optimal appliqué : ' + fmtTND(period) + ' ' + PERIODES[etat.frequence] + '.');
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
    var cles = Object.keys(Baremes.annees).sort().reverse();
    var sel = $('annee-bareme');
    if (cles.length < 2) return;
    sel.innerHTML = cles.map(function (k) { return '<option value="' + echapper(k) + '">' + echapper(Baremes.annees[k].libelle) + '</option>'; }).join('');
    sel.value = etat.annee;
    sel.hidden = false;
    sel.addEventListener('change', function () { etat.annee = sel.value; majBareme(); calculateAndDisplay(); });
  }

  $('annee').textContent = new Date().getFullYear();
  initialiserAnnees();
  majBareme();
  majMetaTheme();
  majCurseur();
  majSteppers();
  calculateAndDisplay();
})();
