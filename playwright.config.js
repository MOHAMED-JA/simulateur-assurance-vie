// Tests de bout en bout : npx playwright test (voir README)
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'e2e',
  timeout: 30000,
  fullyParallel: true,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://127.0.0.1:8123', locale: 'fr-FR', acceptDownloads: true, serviceWorkers: 'block' },
  projects: [
    { name: 'bureau', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } }
  ],
  webServer: { command: 'node e2e/serveur.js', url: 'http://127.0.0.1:8123', reuseExistingServer: !process.env.CI }
});
