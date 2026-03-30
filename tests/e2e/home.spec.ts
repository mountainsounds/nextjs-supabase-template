import { test, expect } from '@playwright/test'

test('home page title contains ichi', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/ichi/i)
})
