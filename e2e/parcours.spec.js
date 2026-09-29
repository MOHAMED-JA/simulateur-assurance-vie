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

test('aucun défilement horizontal, dans les trois langues', async ({ page }) => {
  await page.fill('#revenue', '45000');
  await page.fill('#investment-amount-period', '500');
  for (const l of ['fr', 'en', 'ar']) {
    await page.selectOption('#langue', l);
    const [large, visible] = await page.evaluate(() => [window.innerWidth, document.documentElement.clientWidth]);
    expect(large, l).toBe(visible);
  }
});
