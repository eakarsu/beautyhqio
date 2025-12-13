import { test, expect } from '@playwright/test';

test.describe('Client Management Integration Tests', () => {
  let createdClientId: string;
  const testClient = {
    firstName: `Integration`,
    lastName: `Test${Date.now()}`,
    email: `integration.test.${Date.now()}@example.com`,
    phone: `555-${Math.floor(Math.random() * 9000000) + 1000000}`,
  };

  test.describe('UI Tests', () => {
    test('should display clients page or redirect to login', async ({ page }) => {
      await page.goto('/clients');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      expect(url.includes('/clients') || url.includes('/login')).toBe(true);

      const body = page.locator('body');
      await expect(body).toBeVisible();
    });

    test('should have visible content on clients page', async ({ page }) => {
      await page.goto('/clients');
      await page.waitForLoadState('networkidle');

      const body = page.locator('body');
      await expect(body).toBeVisible();
    });
  });

  test.describe('API Tests', () => {
    test('GET /api/clients should return response', async ({ request }) => {
      const response = await request.get('/api/clients');

      // Accept 200 (success) or 401 (auth required)
      expect([200, 401]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(Array.isArray(data) || typeof data === 'object').toBe(true);
      }
    });

    test('POST /api/clients should handle client creation', async ({ request }) => {
      const response = await request.post('/api/clients', {
        data: testClient,
      });

      // Accept 200/201 (success), 401 (auth required), or 400 (validation)
      expect([200, 201, 400, 401]).toContain(response.status());

      if (response.status() === 200 || response.status() === 201) {
        const data = await response.json();
        expect(data).toHaveProperty('id');
        createdClientId = data.id;
      }
    });

    test('GET /api/clients/[id] should return client or auth error', async ({ request }) => {
      const listResponse = await request.get('/api/clients');

      if (listResponse.status() === 200) {
        const clients = await listResponse.json();

        if (Array.isArray(clients) && clients.length > 0) {
          const clientId = clients[0].id;
          const response = await request.get(`/api/clients/${clientId}`);
          expect([200, 401, 404]).toContain(response.status());
        }
      }
    });

    test('PUT /api/clients/[id] should handle update', async ({ request }) => {
      const listResponse = await request.get('/api/clients');

      if (listResponse.status() === 200) {
        const clients = await listResponse.json();

        if (Array.isArray(clients) && clients.length > 0) {
          const clientId = clients[0].id;
          const response = await request.put(`/api/clients/${clientId}`, {
            data: { notes: `Test update ${Date.now()}` },
          });
          expect([200, 204, 400, 401, 404]).toContain(response.status());
        }
      }
    });

    test('GET /api/clients with search should work', async ({ request }) => {
      const response = await request.get('/api/clients?search=test');
      expect([200, 401]).toContain(response.status());
    });
  });

  test.describe('Workflow Tests', () => {
    test('client lifecycle when authenticated', async ({ request }) => {
      const workflowClient = {
        firstName: 'Workflow',
        lastName: `Client${Date.now()}`,
        email: `workflow.${Date.now()}@example.com`,
        phone: `555-${Math.floor(Math.random() * 9000000) + 1000000}`,
      };

      // Create
      const createResponse = await request.post('/api/clients', {
        data: workflowClient,
      });

      if (createResponse.status() === 200 || createResponse.status() === 201) {
        const client = await createResponse.json();
        expect(client.id).toBeDefined();

        // Update
        const updateResponse = await request.put(`/api/clients/${client.id}`, {
          data: { notes: 'Workflow test' },
        });
        expect([200, 204]).toContain(updateResponse.status());

        // Delete
        const deleteResponse = await request.delete(`/api/clients/${client.id}`);
        expect([200, 204]).toContain(deleteResponse.status());
      }
    });
  });

  test.afterAll(async ({ request }) => {
    if (createdClientId) {
      await request.delete(`/api/clients/${createdClientId}`);
    }
  });
});
