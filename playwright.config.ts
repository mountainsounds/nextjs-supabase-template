import { defineConfig, devices } from '@playwright/test'

const isCI = Boolean(process.env.CI)

// Vercel Protection Bypass for Automation — only sent when the secret is present (CI).
// https://vercel.com/docs/security/deployment-protection/methods-to-bypass-deployment-protection
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
const extraHTTPHeaders = bypassSecret
  ? { 'x-vercel-protection-bypass': bypassSecret }
  : undefined

export default defineConfig({
  testDir: './tests/e2e',
  retries: isCI ? 2 : 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    extraHTTPHeaders,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // No webServer — tests always run against an already-deployed URL.
})
