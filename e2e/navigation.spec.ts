import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to all main pages (with auth redirect handling)', async ({ page }) => {
    const pages = [
      { url: '/', pattern: /\// },
      { url: '/clients', pattern: /(clients|login)/ },
      { url: '/calendar', pattern: /(calendar|login)/ },
      { url: '/services', pattern: /(services|login)/ },
      { url: '/staff', pattern: /(staff|login)/ },
      { url: '/products', pattern: /(products|login)/ },
      { url: '/reports', pattern: /(reports|login)/ },
      { url: '/settings', pattern: /(settings|login)/ },
    ];

    for (const { url, pattern } of pages) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      expect(page.url()).toMatch(pattern);
    }
  });

  test('should display page content', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('pages should render without crashing', async ({ page }) => {
    const pages = [
      '/',
      '/clients',
      '/calendar',
      '/services',
      '/staff',
      '/products',
      '/reports',
      '/settings',
      '/gift-cards',
      '/loyalty',
      '/waitlist',
    ];

    for (const url of pages) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      const body = page.locator('body');
      await expect(body).toBeVisible();
    }
  });
});
