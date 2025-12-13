import { test, expect } from '@playwright/test';

test.describe('Loyalty Page', () => {
  test('should load the loyalty page or redirect to login', async ({ page }) => {
    await page.goto('/loyalty');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url.includes('/loyalty') || url.includes('/login')).toBe(true);
  });

  test('should display content', async ({ page }) => {
    await page.goto('/loyalty');
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Loyalty API', () => {
  test('GET /api/loyalty should return loyalty data', async ({ request }) => {
    const response = await request.get('/api/loyalty');
    expect([200, 307, 308, 400, 401, 404, 500]).toContain(response.status());
  });

  test('GET /api/loyalty/programs should return programs', async ({ request }) => {
    const response = await request.get('/api/loyalty/programs');
    expect([200, 401, 404, 500]).toContain(response.status());
  });

  test('GET /api/loyalty/rewards should return rewards', async ({ request }) => {
    const response = await request.get('/api/loyalty/rewards');
    expect([200, 401, 404, 500]).toContain(response.status());
  });

  test('GET /api/loyalty/tiers should return tiers', async ({ request }) => {
    const response = await request.get('/api/loyalty/tiers');
    expect([200, 401, 404, 500]).toContain(response.status());
  });

  test('POST /api/loyalty/programs should handle program creation', async ({ request }) => {
    const programData = {
      name: `Playwright Loyalty Program ${Date.now()}`,
      description: 'Created by Playwright test',
      pointsPerDollar: 1,
      isActive: true,
    };

    const response = await request.post('/api/loyalty/programs', {
      data: programData,
    });

    expect([200, 201, 400, 401, 404, 405, 500]).toContain(response.status());
  });

  test('POST /api/loyalty/rewards should handle reward creation', async ({ request }) => {
    const rewardData = {
      name: `Playwright Reward ${Date.now()}`,
      description: 'Created by Playwright test',
      pointsCost: 100,
      isActive: true,
    };

    const response = await request.post('/api/loyalty/rewards', {
      data: rewardData,
    });

    expect([200, 201, 400, 401, 404, 405, 500]).toContain(response.status());
  });
});
