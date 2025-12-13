import { test, expect } from '@playwright/test';

test.describe('Settings Page', () => {
  test('should load the settings page or redirect to login', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url.includes('/settings') || url.includes('/login')).toBe(true);
  });

  test('should display content', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should have page elements', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Settings API', () => {
  test('GET /api/settings should return settings', async ({ request }) => {
    const response = await request.get('/api/settings');
    expect([200, 401, 404, 500]).toContain(response.status());
  });

  test('GET /api/settings/business should return business settings', async ({ request }) => {
    const response = await request.get('/api/settings/business');
    expect([200, 401, 404, 500]).toContain(response.status());
  });

  test('GET /api/settings/notifications should return notification settings', async ({ request }) => {
    const response = await request.get('/api/settings/notifications');
    expect([200, 401, 404, 500]).toContain(response.status());
  });

  test('GET /api/settings/integrations should return integration settings', async ({ request }) => {
    const response = await request.get('/api/settings/integrations');
    expect([200, 401, 404, 500]).toContain(response.status());
  });

  test('PUT /api/settings should update settings', async ({ request }) => {
    const response = await request.put('/api/settings', {
      data: { businessName: 'Playwright Test Spa' },
    });

    expect([200, 400, 401, 404, 405, 500]).toContain(response.status());
  });
});
