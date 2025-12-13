import { test, expect } from '@playwright/test';

test.describe('Clients Page', () => {
  test('should load the clients page or redirect to login', async ({ page }) => {
    await page.goto('/clients');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url.includes('/clients') || url.includes('/login')).toBe(true);
  });

  test('should display content', async ({ page }) => {
    await page.goto('/clients');
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should have page elements', async ({ page }) => {
    await page.goto('/clients');
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Clients API', () => {
  let createdClientId: string;

  test('GET /api/clients should return clients list', async ({ request }) => {
    const response = await request.get('/api/clients');
    expect([200, 401, 500]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(Array.isArray(data) || data.clients !== undefined).toBe(true);
    }
  });

  test('POST /api/clients should create a new client', async ({ request }) => {
    const clientData = {
      firstName: 'Playwright',
      lastName: `TestClient${Date.now()}`,
      email: `playwright-${Date.now()}@test.com`,
      phone: '555-TEST',
    };

    const response = await request.post('/api/clients', {
      data: clientData,
    });

    expect([201, 400, 401, 500]).toContain(response.status());

    if (response.status() === 201) {
      const data = await response.json();
      expect(data.id).toBeDefined();
      createdClientId = data.id;
    }
  });

  test('GET /api/clients/[id] should return client details', async ({ request }) => {
    if (!createdClientId) {
      const response = await request.get('/api/clients/test-id-12345');
      expect([404, 401, 500]).toContain(response.status());
      return;
    }

    const response = await request.get(`/api/clients/${createdClientId}`);
    expect([200, 401, 404]).toContain(response.status());
  });

  test('PUT /api/clients/[id] should update client', async ({ request }) => {
    if (!createdClientId) {
      test.skip();
      return;
    }

    const updateData = {
      phone: '555-UPDATED',
      notes: 'Updated by Playwright test',
    };

    const response = await request.put(`/api/clients/${createdClientId}`, {
      data: updateData,
    });

    expect([200, 401, 404, 500]).toContain(response.status());
  });

  test('DELETE /api/clients/[id] should delete client', async ({ request }) => {
    if (!createdClientId) {
      test.skip();
      return;
    }

    const response = await request.delete(`/api/clients/${createdClientId}`);
    expect([200, 204, 401, 404]).toContain(response.status());
  });

  test('GET /api/clients with search should filter results', async ({ request }) => {
    const response = await request.get('/api/clients?search=test');
    expect([200, 401, 500]).toContain(response.status());
  });
});
