import { defineConfig } from '@playwright/test'
import { resolve } from 'node:path'
import { loginPassword } from './credentials'

loginPassword()
export default defineConfig({
  testDir: '../ui',
  testMatch: '**/*.spec.ts',
  outputDir: '../artifacts/results',
  reporter: 'line',
  workers: 1,
  retries: 0,
  use: {
    browserName: 'chromium', baseURL: 'http://127.0.0.1:4173',
    locale: 'ko-KR', timezoneId: 'Asia/Seoul', viewport: { width: 1440, height: 900 },
    serviceWorkers: 'block', trace: 'off', video: 'off', screenshot: 'off',
  },
  webServer: {
    command: 'pnpm dev --host 127.0.0.1 --port 4173 --strictPort',
    cwd: resolve('.'), url: 'http://127.0.0.1:4173',
    reuseExistingServer: false, timeout: 120_000,
  },
})
