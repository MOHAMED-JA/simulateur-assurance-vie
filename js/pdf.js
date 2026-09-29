/* Rapport PDF généré dans le navigateur avec jsPDF (assets/vendor) : aucun envoi à un serveur.
   Entrée : les données préparées par interface.js (textes déjà traduits en français ou en anglais).
   Sortie : un Blob PDF. Polices standard du PDF (Helvetica) : alphabet latin uniquement. */
(function (racine) {
  'use strict';

  var W = 210, H = 297, M = 14, BAS = H - 18;
  var C = {
    encre: [18, 22, 49], texte: [54, 60, 92], gris: [103, 109, 140], trait: [225, 229, 240], fond: [244, 246, 251],
    indigo: [79, 70, 229], violet: [124, 58, 237], fuchsia: [192, 38, 211], vert: [5, 150, 105], vertClair: [236, 253, 245],
    orange: [234, 88, 12], rouge: [225, 29, 72], ambre: [245, 158, 11], ambreClair: [255, 247, 230], sarcelle: [20, 184, 166]
  };

  /* Caractères absents de l'encodage des polices standard */
  function txt(s) {
    return String(s == null ? '' : s)
      .replace(/−/g, '-').replace(/[   ]/g, ' ')
      .replace(/★/g, '*').replace(/≥/g, '>=').replace(/≤/g, '<=');
  }

  function melange(a, b, p) { return [0, 1, 2].map(function (i) { return Math.round(a[i] + (b[i] - a[i]) * p); }); }

  function fmtCourt(v) {
    var a = Math.abs(v);
    if (a >= 1e6) return (v / 1e6).toFixed(1).replace('.', ',') + ' M';
    if (a >= 1e3) return Math.round(v / 1e3) + ' k';
    return String(Math.round(v));
  }

  function generer(d) {
    var jsPDF = racine.jspdf.jsPDF;
    var doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    var t = d.t;
    var y = 0;

    function couleur(fn, c) { doc[fn](c[0], c[1], c[2]); }
    function police(taille, gras, c) {
      doc.setFont('helvetica', gras ? 'bold' : 'normal');
      doc.setFontSize(taille);
      couleur('setTextColor', c || C.encre);
    }

    function degrade(x, yy, w, h) {
      var n = 90;
      for (var i = 0; i < n; i++) {
        var p = i / (n - 1);
        var c = p < 0.5 ? melange(C.indigo, C.violet, p * 2) : melange(C.violet, C.fuchsia, (p - 0.5) * 2);
        couleur('setFillColor', c);
        doc.rect(x + w * i / n, yy, w / n + 0.3, h, 'F');
      }
    }

    function logo(x, yy, taille) {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x, yy, taille, taille, 3, 3, 'F');
      var k = taille / 16;
      couleur('setDrawColor', C.indigo);
      doc.setLineWidth(1.1 * k);
      doc.setLineJoin('round');
      doc.setLineCap('round');
      /* Bouclier (repère 16 × 16) puis coche */
      doc.lines([[5 * k, -2 * k], [5 * k, 2 * k], [0, 4 * k], [-5 * k, 6 * k], [-5 * k, -6 * k]], x + 3 * k, yy + 4 * k, [1, 1], 'S', true);
      couleur('setDrawColor', C.vert);
      doc.lines([[1.6 * k, 1.6 * k], [3 * k, -3.2 * k]], x + 5.8 * k, yy + 8 * k, [1, 1], 'S', false);
    }

    function enteteComplete() {
      degrade(0, 0, W, 36);
      logo(M, 9, 17);
      police(17, true, [255, 255, 255]);
      doc.text(txt(t('Rapport de simulation')), M + 22, 15.5);
      police(9.5, false, [255, 255, 255]);
      doc.text(txt(t('Assurance vie et CEA') + ' · ' + t('Barème : {0}', [d.bareme])), M + 22, 21.5);
      doc.text(txt(t('Édité le {0}', [d.date.toLocaleDateString(d.langue === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })])), M + 22, 26.5);
      police(8, false, [255, 255, 255]);
      doc.text(txt(t('Dossier')), W - M, 14, { align: 'right' });
      police(11, true, [255, 255, 255]);
      doc.text(txt(d.dossier), W - M, 19.5, { align: 'right' });
      y = 44;
    }

    function enteteSuite() {
      degrade(0, 0, W, 11);
      police(9, true, [255, 255, 255]);
      doc.text(txt(t('Rapport de simulation') + ' · ' + t('Assurance vie et CEA')), M, 7.2);
      doc.text(txt(t('Dossier') + ' ' + d.dossier), W - M, 7.2, { align: 'right' });
      y = 20;
    }

    function place(h) {
      if (y + h > BAS) { doc.addPage(); enteteSuite(); return true; }
      return false;
    }

    function titre(s) {
      place(22);
      y += 3;
      couleur('setFillColor', C.indigo);
      doc.roundedRect(M, y, 1.6, 6.2, 0.8, 0.8, 'F');
      police(12.5, true);
      doc.text(txt(s), M + 4.5, y + 5);
      y += 10;
    }

    function paragraphe(s, taille, c) {
      police(taille || 9, false, c || C.texte);
      var l = doc.splitTextToSize(txt(s), W - 2 * M);
      var h = l.length * (taille || 9) * 0.42 + 1.5;
      place(h);
      police(taille || 9, false, c || C.texte);
      doc.text(l, M, y + (taille || 9) * 0.35);
      y += h;
    }

    function rangee(lib, val, cls) {
      police(9.5, cls === 'fort', C.texte);
      var libs = doc.splitTextToSize(txt(lib), 128);
      var h = libs.length * 4.1 + 3;
      place(h);
      police(9.5, cls === 'fort', C.texte);
      if (cls === 'fort') { couleur('setFillColor', C.vertClair); doc.rect(M, y, W - 2 * M, h, 'F'); }
      doc.text(libs, M + 2, y + 4.6);
      police(9.5, true, cls === 'fort' ? C.vert : cls === 'perte' ? C.rouge : C.encre);
      doc.text(txt(val), W - M - 2, y + 4.6, { align: 'right' });
      couleur('setDrawColor', C.trait);
      doc.setLineWidth(0.2);
      doc.line(M, y + h, W - M, y + h);
      y += h;
    }

    function tuiles(liste) {
      var n = liste.length, ecart = 4, w = (W - 2 * M - ecart * (n - 1)) / n, h = 24;
      place(h + 4);
      liste.forEach(function (tl, i) {
        var x = M + i * (w + ecart);
        couleur('setFillColor', tl.c);
        doc.roundedRect(x, y, w, h, 3, 3, 'F');
        police(8.5, false, [255, 255, 255]);
        doc.text(txt(tl.lib), x + 4, y + 7);
        police(tl.val.length > 16 ? 12 : 14, true, [255, 255, 255]);
        doc.text(txt(tl.val), x + 4, y + 15.5);
        if (tl.sous) { police(7.5, false, [255, 255, 255]); doc.text(txt(tl.sous), x + 4, y + 20.5); }
      });
      y += h + 5;
    }

    /* Graphique en lignes : series = [{ pts: [[x, y]…], c, epaisseur, pointille, aire }] */
    function graphe(o) {
      var h = o.h || 58;
      place(h + 16);
      var x0 = M + 14, x1 = W - M - 2, y0 = y + 3, y1 = y + h;
      function X(v) { return x0 + (o.xMax > 0 ? v / o.xMax : 0) * (x1 - x0); }
      function Y(v) { return y1 - (o.yMax > 0 ? v / o.yMax : 0) * (y1 - y0); }
      doc.setLineWidth(0.15);
      police(7, false, C.gris);
      for (var i = 0; i <= 4; i++) {
        var vy = o.yMax * i / 4;
        couleur('setDrawColor', C.trait);
        doc.line(x0, Y(vy), x1, Y(vy));
        doc.text(fmtCourt(vy), x0 - 2, Y(vy) + 1, { align: 'right' });
        var vx = o.entier ? Math.round(o.xMax * i / 4) : o.xMax * i / 4;
        doc.text(fmtCourt(vx), X(vx), y1 + 4.2, { align: 'center' });
      }
      doc.text(txt(o.xLib), (x0 + x1) / 2, y1 + 8.5, { align: 'center' });
      o.series.forEach(function (s) {
        var pts = s.pts;
        if (s.aire) {
          couleur('setFillColor', s.aire);
          var rel = [];
          for (var k = 1; k < pts.length; k++) rel.push([X(pts[k][0]) - X(pts[k - 1][0]), Y(pts[k][1]) - Y(pts[k - 1][1])]);
          rel.push([0, Y(0) - Y(pts[pts.length - 1][1])]);
          rel.push([X(pts[0][0]) - X(pts[pts.length - 1][0]), 0]);
          doc.lines(rel, X(pts[0][0]), Y(pts[0][1]), [1, 1], 'F', true);
        }
        couleur('setDrawColor', s.c);
        doc.setLineWidth(s.epaisseur || 0.7);
        if (s.pointille) doc.setLineDashPattern([1.2, 1.2], 0);
        for (var j = 1; j < pts.length; j++) doc.line(X(pts[j - 1][0]), Y(pts[j - 1][1]), X(pts[j][0]), Y(pts[j][1]));
        if (s.pointille) doc.setLineDashPattern([], 0);
      });
      if (o.repere > 0 && o.repere <= o.xMax) {
        couleur('setDrawColor', C.vert);
        doc.setLineWidth(0.4);
        doc.setLineDashPattern([1, 1], 0);
        doc.line(X(o.repere), y0, X(o.repere), y1);
        doc.setLineDashPattern([], 0);
        police(7.5, true, C.vert);
        doc.text(txt(t('Optimal')), Math.min(X(o.repere) + 1.5, x1 - 12), y0 + 3);
      }
      if (o.point) {
        couleur('setDrawColor', C.indigo);
        doc.setFillColor(255, 255, 255);
        doc.setLineWidth(0.8);
        doc.circle(X(Math.min(o.point[0], o.xMax)), Y(o.point[1]), 1.3, 'FD');
      }
      y = y1 + 12;
      if (o.legende) {
        y += 3;
        var lx = M;
        police(7.5, false, C.gris);
        o.legende.forEach(function (l) {
          couleur('setDrawColor', l.c);
          doc.setLineWidth(0.9);
          if (l.pointille) doc.setLineDashPattern([1, 1], 0);
          doc.line(lx, y - 1, lx + 6, y - 1);
          doc.setLineDashPattern([], 0);
          doc.text(txt(l.lib), lx + 8, y);
          lx += 12 + doc.getTextWidth(txt(l.lib));
        });
        y += 5;
      }
    }

    function tableauTranches(sim) {
      var cols = [
        [t('Tranche (TND)'), 46, 'left'], [t('Taux'), 18, 'right'], [t('Impôt sans inv.'), 40, 'right'],
        [t('Impôt avec inv.'), 40, 'right'], [t('Économie'), 38, 'right']
      ];
      function enTete() {
        couleur('setFillColor', C.fond);
        doc.rect(M, y, W - 2 * M, 7, 'F');
        police(7.5, true, C.gris);
        var x = M;
        cols.forEach(function (c) {
          doc.text(txt(c[0]).toUpperCase(), c[2] === 'left' ? x + 2 : x + c[1] - 2, y + 4.7, { align: c[2] });
          x += c[1];
        });
        y += 7;
      }
      place(9 + 6.2 * 3);
      enTete();
      var totAv = 0, totAp = 0;
      function ligneT(vals, gras) {
        if (place(6.5)) enTete();
        var xx = M;
        vals.forEach(function (v, i) {
          police(8.5, gras, gras ? C.encre : (i === 4 && v.eco ? C.vert : C.texte));
          doc.text(txt(v.s), cols[i][2] === 'left' ? xx + 2 : xx + cols[i][1] - 2, y + 4.4, { align: cols[i][2] });
          xx += cols[i][1];
        });
        couleur('setDrawColor', C.trait);
        doc.setLineWidth(0.2);
        doc.line(M, y + 6.2, W - M, y + 6.2);
        y += 6.2;
      }
      sim.avant.parTranche.forEach(function (bd, i) {
        var ad = sim.apres.parTranche[i] || { impot: 0 };
        totAv += bd.impot; totAp += ad.impot;
        var debut = bd.min > 0 ? bd.min + 1 : 0;
        var fin = bd.max === Infinity ? t('et plus') : d.fmtEntier(bd.max);
        ligneT([
          { s: d.fmtEntier(debut) + (bd.max === Infinity ? ' ' : ' – ') + fin },
          { s: (bd.taux * 100).toFixed(0) + ' %' },
          { s: d.fmtAmount(bd.impot) }, { s: d.fmtAmount(ad.impot) },
          { s: d.fmtAmount(bd.impot - ad.impot), eco: bd.impot - ad.impot > 0.0005 }
        ], false);
      });
      ligneT([{ s: t('Total') }, { s: '' }, { s: d.fmtAmount(totAv) }, { s: d.fmtAmount(totAp) }, { s: d.fmtAmount(totAv - totAp) }], true);
      y += 3;
    }

    function qrCode(x, yy, taille) {
      var qr = d.qr, n = qr.getModuleCount(), cote = taille / n;
      doc.setFillColor(255, 255, 255);
      doc.rect(x - 1.5, yy - 1.5, taille + 3, taille + 3, 'F');
      couleur('setFillColor', C.encre);
      for (var r = 0; r < n; r++) {
        for (var c = 0; c < n; c++) {
          if (qr.isDark(r, c)) doc.rect(x + c * cote, yy + r * cote, cote + 0.02, cote + 0.02, 'F');
        }
      }
    }

    /* ------------------------------------------------------------------ */
    var calc = d.calc, sim = calc.sim;
    enteteComplete();

    if (d.client || d.conseiller) {
      couleur('setFillColor', C.fond);
      doc.roundedRect(M, y - 2, W - 2 * M, 10, 2, 2, 'F');
      police(9.5, false, C.texte);
      doc.text(txt([d.client ? t('Client : {0}', [d.client]) : '', d.conseiller ? t('Conseiller : {0}', [d.conseiller]) : ''].filter(Boolean).join('   ·   ')), M + 4, y + 4.4);
      y += 13;
    }
    if (d.provisoire) {
      couleur('setFillColor', C.ambreClair);
      doc.roundedRect(M, y - 2, W - 2 * M, 9, 2, 2, 'F');
      police(8.5, true, [146, 64, 14]);
      doc.text(txt(t('Barème provisoire : à confirmer avec le texte officiel.')), M + 4, y + 3.8);
      y += 12;
    }

    tuiles([
      { lib: t('Économie d\'impôt'), val: d.fmtTND(sim.economie), sous: t('par an'), c: C.vert },
      { lib: t('Taux de réduction d\'impôt'), val: d.fmtPct(sim.tauxReduction), sous: t('55 % au maximum'), c: C.violet },
      { lib: t('Montant optimal à investir'), val: d.fmtTND(sim.optimal), sous: t('par an'), c: C.orange }
    ]);

    titre(t('Hypothèses'));
    d.hypotheses.forEach(function (l) { rangee(l[0], l[1]); });

    titre(t('Impôt annuel'));
    rangee(t('Impôt total avant investissement'), d.fmtTND(sim.impotAvant));
    rangee(t('Impôt total après investissement'), d.fmtTND(sim.impotApres));
    rangee(t('Minimum d\'impôt (45 %)'), d.fmtTND(sim.impotMinimum));
    rangee(t('Économie d\'impôt'), d.fmtTND(sim.economie), 'fort');

    titre(t('Revenu net imposable'));
    d.deductions.forEach(function (l) {
      var moins = l[2].indexOf('moins') !== -1;
      if (moins && l[1] === 0) return;
      rangee(l[0], (moins && l[1] > 0 ? '− ' : '') + d.fmtTND(l[1]), l[2].indexOf('total') !== -1 ? 'fort' : '');
    });

    titre(t('Impôt par tranche'));
    tableauTranches(sim);

    titre(t('Économie selon le montant investi'));
    var pts = d.points;
    graphe({
      xMax: pts[pts.length - 1][0] || 1,
      yMax: Math.max.apply(null, pts.map(function (p) { return p[1]; })) || 1,
      xLib: t('Montant investi par an (TND)'),
      series: [{ pts: pts, c: C.indigo, aire: [232, 234, 252], epaisseur: 0.8 }],
      repere: sim.optimal,
      point: calc.investissement > 0 ? [calc.investissement, Math.min(sim.economie, Math.max.apply(null, pts.map(function (p) { return p[1]; })))] : null
    });

    if (d.projection) {
      titre(t('Projection du capital'));
      paragraphe(d.hypothesesProjection, 8.5, C.gris);
      y += 1;
      tuiles(d.scenarios.map(function (s, i) { return { lib: s[0], val: s[1], c: [C.orange, C.indigo, C.vert][i] }; }));
      var sc = calc.sc;
      function serie(p, cle) { return p.annees.map(function (a) { return [a.annee, a[cle]]; }); }
      var series = [
        { pts: serie(sc.median, 'verse'), c: C.gris, pointille: true, epaisseur: 0.5 },
        { pts: serie(sc.prudent, 'capital'), c: C.orange },
        { pts: serie(sc.median, 'capital'), c: C.indigo },
        { pts: serie(sc.dynamique, 'capital'), c: C.vert }
      ];
      var legende = [
        { lib: t('Dynamique'), c: C.vert }, { lib: t('Médian'), c: C.indigo },
        { lib: t('Prudent'), c: C.orange }, { lib: t('Versements cumulés'), c: C.gris, pointille: true }
      ];
      if (calc.etat.inflationPct > 0) {
        series.push({ pts: serie(sc.median, 'capitalReel'), c: C.sarcelle, pointille: true });
        legende.push({ lib: t('Médian en dinars constants'), c: C.sarcelle, pointille: true });
      }
      graphe({
        xMax: calc.etat.dureeAns, yMax: sc.dynamique.capitalFinal || 1, xLib: t('Années'), entier: true,
        series: series, legende: legende
      });
      d.projection.forEach(function (l) { rangee(l[0], l[1], l[2]); });
    }

    if (d.rachat) {
      titre(d.rachat.titre);
      d.rachat.lignes.forEach(function (l) { rangee(l[0], l[1], l[2]); });
    }
    if (d.prevoyance) {
      titre(d.prevoyance.titre);
      d.prevoyance.lignes.forEach(function (l) { rangee(l[0], l[1], l[2]); });
    }

    if (d.qr) {
      titre(t('Retrouver cette simulation'));
      place(40);
      qrCode(M + 1.5, y + 1.5, 32);
      police(9.5, false, C.texte);
      var l1 = doc.splitTextToSize(txt(t('Scannez le QR code ou ouvrez le lien ci-dessous pour retrouver la simulation dans le simulateur.')), W - 2 * M - 42);
      doc.text(l1, M + 40, y + 6);
      police(7.5, false, C.indigo);
      var l2 = doc.splitTextToSize(d.lien, W - 2 * M - 42);
      doc.text(l2.slice(0, 5), M + 40, y + 8 + l1.length * 4.3);
      doc.link(M, y, 36, 36, { url: d.lien });
      y += 40;
    }

    titre(t('Mentions légales'));
    paragraphe(t('Simulation indicative, non contractuelle.') + ' ' + t('Elle ne constitue ni un conseil en investissement ni un engagement de l\'assureur. Les rendements et les frais de la projection sont des hypothèses modifiables, non garanties : la valeur d\'un contrat peut varier à la hausse comme à la baisse. Le calcul de l\'impôt suit le Code de l\'impôt sur le revenu des personnes physiques et de l\'impôt sur les sociétés tel que saisi dans le simulateur ; seules les dispositions officielles en vigueur font foi.'), 8.2, C.texte);

    /* Pied de page numéroté */
    var n = doc.getNumberOfPages();
    for (var p = 1; p <= n; p++) {
      doc.setPage(p);
      couleur('setDrawColor', C.trait);
      doc.setLineWidth(0.3);
      doc.line(M, H - 12, W - M, H - 12);
      police(7.5, false, C.gris);
      doc.text(txt(t('Simulation indicative, non contractuelle') + ' · ' + t('Dossier') + ' ' + d.dossier), M, H - 7.5);
      doc.text(txt(t('Page {0} / {1}', [p, n])), W - M, H - 7.5, { align: 'right' });
    }
    doc.setProperties({ title: txt(t('Rapport de simulation') + ' ' + d.dossier), subject: txt(t('Assurance vie et CEA')), creator: 'Simulateur Assurance Vie et CEA' });
    return doc.output('blob');
  }

  racine.RapportPDF = { generer: generer };
})(typeof self !== 'undefined' ? self : this);
