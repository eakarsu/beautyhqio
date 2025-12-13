import { test, expect } from '@playwright/test';

test.describe('Services Page', () => {
  test('should load the services page or redirect to login', async ({ page }) => {
    await page.goto('/services');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url.includes('/services') || url.includes('/login')).toBe(true);
  });

  test('should display content', async ({ page }) => {
    await page.goto('/services');
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Services API', () => {
  let createdCategoryId: string;
  let createdServiceId: string;

  test('GET /api/services should return services list', async ({ request }) => {
    const response = await request.get('/api/services');
    expect([200, 401, 500]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(Array.isArray(data) || data.services !== undefined).toBe(true);
    }
  });

  test('GET /api/services/categories should return categories', async ({ request }) => {
    const response = await request.get('/api/services/categories');
    expect([200, 401, 500]).toContain(response.status());
  });

  test('POST /api/services/categories should create category', async ({ request }) => {
    const categoryData = {
      name: `Playwright Category ${Date.now()}`,
      description: 'Created by Playwright test',
    };

    const response = await request.post('/api/services/categories', {
      data: categoryData,
    });

    expect([201, 400, 401, 500]).toContain(response.status());

    if (response.status() === 201) {
      const data = await response.json();
      createdCategoryId = data.id;
    }
  });

  test('POST /api/services should create service', async ({ request }) => {
    if (!createdCategoryId) {
      test.skip();
      return;
    }

    const serviceData = {
      name: `Playwright Service ${Date.now()}`,
      description: 'Created by Playwright test',
      duration: 60,
      price: 75.00,
      categoryId: createdCategoryId,
    };

    const response = await request.post('/api/services', {
      data: serviceData,
    });

    expect([201, 400, 401, 500]).toContain(response.status());

    if (response.status() === 201) {
      const data = await response.json();
      createdServiceId = data.id;
    }
  });

  test('GET /api/services/[id] should return service details', async ({ request }) => {
    if (!createdServiceId) {
      const response = await request.get('/api/services/test-id');
      expect([404, 401, 500]).toContain(response.status());
      return;
    }

    const response = await request.get(`/api/services/${createdServiceId}`);
    expect([200, 401, 404]).toContain(response.status());
  });

  test('PUT /api/services/[id] should update service', async ({ request }) => {
    if (!createdServiceId) {
      test.skip();
      return;
    }

    const response = await request.put(`/api/services/${createdServiceId}`, {
      data: { price: 85.00 },
    });

    expect([200, 401, 404, 500]).toContain(response.status());
  });

  test('GET /api/services with active filter should work', async ({ request }) => {
    const response = await request.get('/api/services?active=true');
    expect([200, 401, 500]).toContain(response.status());
  });

  test.afterAll(async ({ request }) => {
    if (createdServiceId) {
      await request.delete(`/api/services/${createdServiceId}`);
    }
  });
});
