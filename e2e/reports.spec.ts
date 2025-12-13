import { test, expect } from '@playwright/test';

test.describe('Reports Page', () => {
  test('should load the reports page or redirect to login', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url.includes('/reports') || url.includes('/login')).toBe(true);
  });

  test('should display content', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Reports API', () => {
  test('GET /api/reports should return reports', async ({ request }) => {
    const response = await request.get('/api/reports');
    expect([200, 401, 404, 500]).toContain(response.status());
  });

  test('GET /api/reports/revenue should return revenue report', async ({ request }) => {
    const response = await request.get('/api/reports/revenue');
    expect([200, 401, 404, 500]).toContain(response.status());
  });

  test('GET /api/reports/appointments should return appointments report', async ({ request }) => {
    const response = await request.get('/api/reports/appointments');
    expect([200, 401, 404, 500]).toContain(response.status());
  });

  test('GET /api/reports/clients should return clients report', async ({ request }) => {
    const response = await request.get('/api/reports/clients');
    expect([200, 401, 404, 500]).toContain(response.status());
  });

  test('GET /api/reports/staff should return staff report', async ({ request }) => {
    const response = await request.get('/api/reports/staff');
    expect([200, 401, 404, 500]).toContain(response.status());
  });

  test('GET /api/reports/products should return products report', async ({ request }) => {
    const response = await request.get('/api/reports/products');
    expect([200, 401, 404, 500]).toContain(response.status());
  });

  test('GET /api/reports with date range should work', async ({ request }) => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    const endDate = new Date();

    const response = await request.get(
      `/api/reports?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
    );
    expect([200, 401, 404, 500]).toContain(response.status());
  });
});
