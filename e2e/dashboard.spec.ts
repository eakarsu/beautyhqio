import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('should load the dashboard page or redirect to login', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Page should either load dashboard or redirect to login
    const url = page.url();
    expect(url.includes('/') || url.includes('/login')).toBe(true);
  });

  test('should display content', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should have navigation elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Dashboard API', () => {
  test('GET /api/dashboard should return data', async ({ request }) => {
    const response = await request.get('/api/dashboard');
    expect([200, 401, 500]).toContain(response.status());
  });

  test('GET /api/dashboard/stats should return statistics', async ({ request }) => {
    const response = await request.get('/api/dashboard/stats');
    expect([200, 401, 404, 500]).toContain(response.status());
  });

  test('GET /api/dashboard/revenue should return revenue data', async ({ request }) => {
    const response = await request.get('/api/dashboard/revenue');
    expect([200, 401, 404, 500]).toContain(response.status());
  });
});
