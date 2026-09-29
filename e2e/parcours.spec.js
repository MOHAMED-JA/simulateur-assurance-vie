// Parcours utilisateur de bout en bout (bureau et mobile). Lancement : npx playwright test
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

const nb = (s) => s.replace(/[\s  ]/g, '');

test.beforeEach(async ({ page }) => {
  const erreurs = [];
  page.on('pageerror', (e) => erreurs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
  page.erreurs = erreurs;
  await page.goto('/');
});

test.afterEach(async ({ page }) => {
  expect(page.erreurs, 'aucune erreur JavaScript').toEqual([]);
});

test('saisie du revenu et du versement : résultats calculés', async ({ page }) => {
  await expect(page.locator('#vide')).toBeVisible();
  await page.fill('#revenue', '45000');
  await page.fill('#investment-amount-period', '500');
  await expect(page.locator('#resultats')).toBeVisible();
  await expect(page.locator('#tax-saved')).toHaveText(/2\s?070,000/);
  await expect(page.locator('#tax-before')).toHaveText(/10\s?630,000/);
  await expect(page.locator('#tax-brackets-comparison tr')).toHaveCount(8);
  await expect(page.locator('#graph-economie svg')).toBeVisible();
  await expect(page.locator('#graph-capital svg')).toBeVisible();
});

test('« 45,000 » est signalé et corrigé en 45 000', async ({ page }) => {
  await page.fill('#revenue', '45,000');
  await expect(page.locator('#revenue-amb')).toBeVisible();
  await expect(page.locator('#revenue-amb')).toContainText('45 000');
  await page.locator('#revenue-amb button').click();
  expect(nb(await page.inputValue('#revenue'))).toBe('45000');
  await expect(page.locator('#revenue-amb')).toBeHidden();
});

test('« Appliquer ce montant » atteint le plancher légal', async ({ page }) => {
  await page.fill('#revenue', '45000');
  await page.click('#appliquer');
  await expect(page.locator('#suggest-state')).toBeVisible();
  await expect(page.locator('#tax-reduction-rate')).toHaveText(/55,0/);
});

test('mode inverse : montant à verser pour une économie visée', async ({ page }) => {
  await page.fill('#revenue', '45000');
  await page.fill('#inv-cible', '1500');
  await expect(page.locator('#inv-res')).toContainText('356,061');
  await page.click('#inv-appliquer');
  expect(nb(await page.inputValue('#investment-amount-period'))).toBe('356,061');
  await expect(page.locator('#tax-saved')).toHaveText(/1\s?500,0/);
  await page.fill('#inv-cible', '999999');
  await expect(page.locator('#inv-res')).toContainText('5 846,500');
});

test('rapport PDF téléchargé', async ({ page }) => {
  await page.fill('#revenue', '45000');
  await page.fill('#investment-amount-period', '500');
  await expect(page.locator('#proj-resultat')).toBeVisible();
  const [telechargement] = await Promise.all([page.waitForEvent('download'), page.locator('.barre-rapport .js-pdf').click()]);
  expect(telechargement.suggestedFilename()).toMatch(/^simulation-SIM-\d{8}-\w+\.pdf$/);
  const contenu = fs.readFileSync(await telechargement.path());
  expect(contenu.subarray(0, 5).toString()).toBe('%PDF-');
  expect(contenu.length).toBeGreaterThan(10000);
});

test('lien de partage : QR code et restauration de la simulation', async ({ page, context }) => {
  await page.fill('#revenue', '52000');
  await page.fill('#investment-amount-period', '700');
  await page.locator('#chef [data-val="1"]').click();
  await page.click('#partager');
  await expect(page.locator('#qr-lien svg')).toBeVisible();
  const lien = await page.inputValue('#lien-partage');
  expect(lien).toContain('r=52000');
  expect(lien).toContain('c=1');
  const autre = await context.newPage();
  await autre.goto(lien);
  expect(nb(await autre.inputValue('#revenue'))).toBe('52000');
  expect(nb(await autre.inputValue('#investment-amount-period'))).toBe('700');
  await expect(autre.locator('#chef [data-val="1"]')).toHaveAttribute('aria-checked', 'true');
  await expect(autre.locator('#tax-saved')).toHaveText(await page.locator('#tax-saved').textContent());
});

test('rachat anticipé et prévoyance', async ({ page }) => {
  await page.fill('#revenue', '45000');
  await page.fill('#investment-amount-period', '500');
  await expect(page.locator('#carte-rachat')).toBeVisible();
  await expect(page.locator('#rachat-res .statut.ko')).toBeVisible();
  await expect(page.locator('#rachat-res')).toContainText('11 320,000');
  await page.fill('#r-annee', '12');
  await expect(page.locator('#rachat-err')).not.toBeEmpty();
  await page.fill('#p-duree', '12');
  await page.fill('#r-annee', '10');
  await expect(page.locator('#rachat-res .statut.ok')).toBeVisible();
  await expect(page.locator('#prev-lignes')).toContainText(/\d/);
});

test('portefeuille : enregistrer, comparer et exporter', async ({ page }) => {
  await page.fill('#revenue', '45000');
  await page.fill('#investment-amount-period', '500');
  await page.click('#enregistrer');
  await expect(page.locator('.port-item')).toHaveCount(1);
  await page.fill('#investment-amount-period', '1000');
  await page.click('#enregistrer');
  await expect(page.locator('.port-item')).toHaveCount(2);
  for (const c of await page.locator('.port-item input[type="checkbox"]').all()) await c.check();
  await page.click('#port-comparer');
  await expect(page.locator('#port-comparaison table')).toBeVisible();
  await expect(page.locator('#port-comparaison .meilleur').first()).toBeVisible();
  const [csv] = await Promise.all([page.waitForEvent('download'), page.click('#port-export')]);
  const texte = fs.readFileSync(await csv.path(), 'utf8');
  expect(texte.split('\r\n').filter(Boolean)).toHaveLength(3);
  await page.reload();
  await expect(page.locator('.port-item')).toHaveCount(2);
});

test('langues : anglais puis arabe (droite à gauche)', async ({ page }) => {
  await page.fill('#revenue', '45000');
  await page.selectOption('#langue', 'en');
  await expect(page.locator('#t-famille')).toHaveText('Family situation');
  await expect(page).toHaveTitle(/Simulator/);
  await page.selectOption('#langue', 'ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('#t-famille')).toHaveText('الوضعية العائلية');
  await page.selectOption('#langue', 'fr');
  await expect(page.locator('#t-famille')).toHaveText('Situation familiale');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
});

test.describe('petit téléphone (320 px)', () => {
  test.use({ viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  test('aucun défilement horizontal, dans les trois langues', async ({ page }) => {
    await page.fill('#revenue', '60000');
    await page.fill('#investment-amount-period', '400');
    await page.fill('#cea-period', '300');
    await page.click('#p-avance summary');
    await page.click('#libre-ajouter');
    for (const l of ['fr', 'en', 'ar']) {
      await page.selectOption('#langue', l);
      const [large, visible] = await page.evaluate(() => [window.innerWidth, document.documentElement.clientWidth]);
      expect(large, l).toBe(visible);
    }
  });
});

test('aucun défilement horizontal, dans les trois langues', async ({ page }) => {
  await page.fill('#revenue', '45000');
  await page.fill('#investment-amount-period', '500');
  for (const l of ['fr', 'en', 'ar']) {
    await page.selectOption('#langue', l);
    await page.check('#p-retraite'); await page.click('#partager');
    const [large, visible] = await page.evaluate(() => [window.innerWidth, document.documentElement.clientWidth]);
    expect(large, l).toBe(visible);
  }
});

test('objectif de capital et mode retraite', async ({ page }) => {
  await page.fill('#revenue', '45000');
  await page.check('#p-retraite');
  await page.fill('#p-age', '35');
  await page.fill('#p-depart', '60');
  await expect(page.locator('#p-duree')).toHaveValue('25');
  await page.fill('#obj-capital', '150000');
  await expect(page.locator('#obj-res')).toContainText('150 000');
  await page.click('#obj-appliquer');
  await expect(page.locator('#scen-median')).toHaveText(/^150\s?000,\d{3}/);
  await page.fill('#p-age', '70');
  await expect(page.locator('#retraite-err')).not.toBeEmpty();
});

test('comparatif des placements et revenu à la retraite', async ({ page }) => {
  await page.fill('#revenue', '45000');
  await page.fill('#investment-amount-period', '500');
  await expect(page.locator('#comparatif-barres .cmp-ligne')).toHaveCount(4);
  await page.fill('#v-pension', '1500');
  await expect(page.locator('#prev-lignes')).toContainText('1 500,000');
});

test('agence : coordonnées mémorisées et logo', async ({ page }) => {
  await page.click('#mode-conseiller');
  await page.click('#agence summary');
  await page.fill('#ag-nom', 'Agence Test');
  await page.fill('#c-conseiller', 'A. Conseiller');
  await page.setInputFiles('#ag-logo', { name: 'logo.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64') });
  await expect(page.locator('#ag-logo-apercu img')).toBeVisible();
  await page.reload();
  await expect(page.locator('#ag-nom')).toHaveValue('Agence Test');
  await expect(page.locator('#c-conseiller')).toHaveValue('A. Conseiller');
  await expect(page.locator('#ag-logo-apercu img')).toHaveCount(1);
});

test('portefeuille : tableau de bord, sauvegarde et restauration', async ({ page }) => {
  await page.fill('#revenue', '45000');
  await page.fill('#investment-amount-period', '500');
  await page.click('#enregistrer');
  await expect(page.locator('#port-stats')).toBeVisible();
  await expect(page.locator('#st-nombre')).toHaveText('1');
  const [fichier] = await Promise.all([page.waitForEvent('download'), page.click('#port-sauver')]);
  const contenu = fs.readFileSync(await fichier.path(), 'utf8');
  page.once('dialog', (d) => d.accept());
  await page.click('#port-vider');
  await expect(page.locator('.port-item')).toHaveCount(0);
  await page.setInputFiles('#port-restaurer', { name: 'sauvegarde.json', mimeType: 'application/json', buffer: Buffer.from(contenu) });
  await expect(page.locator('.port-item')).toHaveCount(1);
  await page.setInputFiles('#port-restaurer', { name: 'faux.json', mimeType: 'application/json', buffer: Buffer.from('{"x":1}') });
  await expect(page.locator('.toast-erreur')).toBeVisible();
});

test('partage : liens WhatsApp et e-mail, infobulles et FAQ', async ({ page }) => {
  await page.fill('#revenue', '45000');
  await page.click('#partager');
  await expect(page.locator('#envoi-whatsapp')).toHaveAttribute('href', /^https:\/\/wa\.me\/\?text=.*r%3D45000/);
  await expect(page.locator('#envoi-email')).toHaveAttribute('href', /^mailto:\?subject=/);
  await page.click('[aria-controls="aide-plancher"]');
  await expect(page.locator('#aide-plancher')).toBeVisible();
  await page.click('[aria-controls="aide-plancher"]');
  await expect(page.locator('#aide-plancher')).toBeHidden();
  await page.locator('.faq summary').first().click();
  await expect(page.locator('.faq details').first()).toHaveAttribute('open', '');
});

test('installer l\'application : invitation du navigateur ou explications', async ({ page }) => {
  await expect(page.locator('#installer')).toBeVisible();
  /* Sans invitation du navigateur : explications selon l'appareil */
  await page.click('#installer');
  await expect(page.locator('#install-aide')).toBeVisible();
  await expect(page.locator('#install-texte')).not.toBeEmpty();
  await page.click('#install-fermer');
  await expect(page.locator('#install-aide')).toBeHidden();
  /* Avec invitation (événement beforeinstallprompt simulé) : la fenêtre du navigateur s'ouvre */
  await page.evaluate(() => {
    const e = new Event('beforeinstallprompt', { cancelable: true });
    e.prompt = () => { window.__invite = true; };
    e.userChoice = Promise.resolve({ outcome: 'accepted' });
    window.dispatchEvent(e);
  });
  await page.click('#installer');
  expect(await page.evaluate(() => window.__invite)).toBe(true);
  await expect(page.locator('#install-aide')).toBeHidden();
  await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
  await expect(page.locator('#installer')).toBeHidden();
});

test('assurance vie et CEA : règles distinctes et répartition', async ({ page }) => {
  await page.fill('#revenue', '60000');
  await page.fill('#cea-period', '4000');
  /* CEA seul : réduction plafonnée à 40 % de l'impôt */
  await expect(page.locator('#tax-reduction-rate')).toHaveText(/^40,0/);
  await expect(page.locator('#suggest-cea')).toContainText('40 %');
  /* Complément d'assurance vie jusqu'au plancher de 45 % */
  await page.click('#appliquer');
  await expect(page.locator('#tax-reduction-rate')).toHaveText(/^55,0/);
  await expect(page.locator('#repartition-economie')).toBeVisible();
  await expect(page.locator('#deductions')).toContainText('CEA');
  /* Plafond de 100 000 TND */
  await page.fill('#cea-initial', '120000');
  await expect(page.locator('#alerte-plafond')).toBeVisible();
});

test('rachat CEA (blocage 5 ans) et avance sur contrat', async ({ page }) => {
  await page.fill('#revenue', '60000');
  await page.fill('#investment-amount-period', '500');
  await page.fill('#cea-period', '300');
  await expect(page.locator('#bloc-r-produit')).toBeVisible();
  await page.locator('#r-produit [data-val="cea"]').click();
  await page.fill('#r-annee', '3');
  await expect(page.locator('#rachat-res .statut.ko')).toContainText(/bloqués/);
  await page.locator('#r-produit [data-val="av"]').click();
  await page.fill('#r-annee', '5');
  await page.click('#bloc-avance summary');
  await page.fill('#a-montant', '5000');
  await expect(page.locator('#avance-res')).toContainText('Mensualité');
  await page.fill('#a-montant', '9999999');
  await expect(page.locator('#avance-err')).not.toBeEmpty();
});

test('versement initial, versements libres, retraits programmés et taux garanti', async ({ page }) => {
  await page.fill('#revenue', '45000');
  await page.fill('#av-initial', '10000');
  await expect(page.locator('#proj-resultat')).toBeVisible();
  await page.fill('#p-garanti', '3');
  await expect(page.locator('#p-participation')).toContainText('3,0');
  await expect(page.locator('#scen-l-prudent')).toContainText('4,0');
  await page.fill('#p-garanti', '5');
  await expect(page.locator('#scen-l-prudent')).toContainText('5,0');
  await page.click('#p-avance summary');
  await page.click('#libre-ajouter');
  await page.locator('.libre-annee').first().fill('3');
  await page.locator('.libre-montant').first().fill('2000');
  await page.fill('#p-duree', '12');
  await page.fill('#p-retrait-debut', '5');
  await page.fill('#p-retrait-montant', '1000');
  await expect(page.locator('#proj-err')).toContainText('8');
  await page.fill('#p-retrait-debut', '9');
  await expect(page.locator('#proj-err')).toBeEmpty();
  await expect(page.locator('#proj-lignes')).toContainText('Retraits programmés perçus');
  /* Le lien de partage transporte ces hypothèses */
  await page.click('#partager');
  const lien = await page.inputValue('#lien-partage');
  expect(lien).toContain('L=3%3A2000');
  expect(lien).toContain('b=10000');
});

test('être rappelé : visible seulement si l\'agence a un téléphone ou un e-mail', async ({ page }) => {
  await page.fill('#revenue', '45000');
  await expect(page.locator('#rappel')).toBeHidden();
  await page.click('#mode-conseiller');
  await page.click('#agence summary');
  await page.fill('#ag-tel', '+216 71 000 000');
  await expect(page.locator('#rappel')).toBeVisible();
  await page.context().route('https://wa.me/**', (r) => r.fulfill({ status: 200, body: 'ok' }));
  const [requete] = await Promise.all([page.context().waitForEvent('request', (r) => r.url().startsWith('https://wa.me/')), page.click('#rappel')]);
  expect(requete.url()).toContain('wa.me/21671000000?text=');
});
