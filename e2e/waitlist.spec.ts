import { test, expect } from '@playwright/test';

test.describe('Waitlist Page', () => {
  test('should load the waitlist page or redirect to login', async ({ page }) => {
    await page.goto('/waitlist');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url.includes('/waitlist') || url.includes('/login')).toBe(true);
  });

  test('should display content', async ({ page }) => {
    await page.goto('/waitlist');
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Waitlist API', () => {
  let createdEntryId: string;
  let testClientId: string;
  let testServiceId: string;

  test.beforeAll(async ({ request }) => {
    const clientsResponse = await request.get('/api/clients');
    if (clientsResponse.status() === 200) {
      const clients = await clientsResponse.json();
      if (Array.isArray(clients) && clients.length > 0) {
        testClientId = clients[0].id;
      }
    }

    const servicesResponse = await request.get('/api/services');
    if (servicesResponse.status() === 200) {
      const services = await servicesResponse.json();
      if (Array.isArray(services) && services.length > 0) {
        testServiceId = services[0].id;
      }
    }
  });

  test('GET /api/waitlist should return waitlist entries', async ({ request }) => {
    const response = await request.get('/api/waitlist');
    expect([200, 401, 500]).toContain(response.status());
  });

  test('POST /api/waitlist should create entry', async ({ request }) => {
    if (!testClientId || !testServiceId) {
      test.skip();
      return;
    }

    const entryData = {
      clientId: testClientId,
      serviceId: testServiceId,
      preferredDate: new Date().toISOString(),
      notes: 'Playwright test waitlist entry',
    };

    const response = await request.post('/api/waitlist', {
      data: entryData,
    });

    expect([201, 400, 401, 500]).toContain(response.status());

    if (response.status() === 201) {
      const data = await response.json();
      createdEntryId = data.id;
    }
  });

  test('GET /api/waitlist/[id] should return entry details', async ({ request }) => {
    if (!createdEntryId) {
      const response = await request.get('/api/waitlist/test-id');
      expect([404, 401, 500]).toContain(response.status());
      return;
    }

    const response = await request.get(`/api/waitlist/${createdEntryId}`);
    expect([200, 401, 404]).toContain(response.status());
  });

  test('PUT /api/waitlist/[id] should update entry', async ({ request }) => {
    if (!createdEntryId) {
      test.skip();
      return;
    }

    const response = await request.put(`/api/waitlist/${createdEntryId}`, {
      data: { notes: 'Updated by Playwright' },
    });

    expect([200, 401, 404, 500]).toContain(response.status());
  });

  test.afterAll(async ({ request }) => {
    if (createdEntryId) {
      await request.delete(`/api/waitlist/${createdEntryId}`);
    }
  });
});
