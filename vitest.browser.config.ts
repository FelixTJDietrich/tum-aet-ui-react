import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

// Deliberately independent of vite.config.ts: no playground root or jsdom shims.
export default defineConfig({
  plugins: [react()],
  test: {
    include: ['tests/browser/**/*.browser.test.tsx'],
    setupFiles: ['tests/browser/setup.ts'],
    // Trace staging uses shared test-name paths across browser instances.
    // Keep browser instances sequential so those files cannot overwrite each other.
    maxWorkers: 1,
    reporters: [
      'default',
      ['junit', { suiteNameTemplate: '{displayName}: {filename}', classnameTemplate: '{displayName}.{filename}' }],
    ],
    outputFile: { junit: 'build/browser-results/junit.xml' },
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({ actionTimeout: 5_000 }),
      instances: (['chromium', 'firefox', 'webkit'] as const).map((browser) => ({
        browser,
        attachmentsDir: resolve(import.meta.dirname, `build/browser-results/${browser}/attachments`),
        screenshotDirectory: resolve(import.meta.dirname, `build/browser-results/${browser}/screenshots`),
      })),
      viewport: { width: 1000, height: 800 },
      screenshotFailures: true,
      trace: { mode: 'retain-on-failure', tracesDir: 'build/browser-results/traces' },
    },
  },
});
