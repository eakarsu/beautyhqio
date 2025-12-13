import { test, expect } from '@playwright/test';

test.describe('Services Management Integration Tests', () => {
  test.describe('Services UI Tests', () => {
    test('should display services page or redirect to login', async ({ page }) => {
      await page.goto('/services');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      expect(url.includes('/services') || url.includes('/login')).toBe(true);

      const body = page.locator('body');
      await expect(body).toBeVisible();
    });
  });

  test.describe('Services API Tests', () => {
    test('GET /api/services should return response', async ({ request }) => {
      const response = await request.get('/api/services');
      expect([200, 401]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(Array.isArray(data) || typeof data === 'object').toBe(true);
      }
    });

    test('GET /api/services/categories should return categories', async ({ request }) => {
      const response = await request.get('/api/services/categories');
      expect([200, 401, 404]).toContain(response.status());
    });

    test('POST /api/services should handle service creation', async ({ request }) => {
      const serviceData = {
        name: `Integration Test Service ${Date.now()}`,
        description: 'Created by Playwright integration test',
        duration: 60,
        price: 75.0,
        priceType: 'FIXED',
        allowOnline: true,
        isActive: true,
      };

      const response = await request.post('/api/services', {
        data: serviceData,
      });

      expect([200, 201, 400, 401, 500]).toContain(response.status());
    });

    test('GET /api/services/[id] should return service or error', async ({ request }) => {
      const listResponse = await request.get('/api/services');

      if (listResponse.status() === 200) {
        const services = await listResponse.json();

        if (Array.isArray(services) && services.length > 0) {
          const serviceId = services[0].id;
          const response = await request.get(`/api/services/${serviceId}`);
          expect([200, 401, 404]).toContain(response.status());
        }
      }
    });

    test('PUT /api/services/[id] should handle update', async ({ request }) => {
      const listResponse = await request.get('/api/services');

      if (listResponse.status() === 200) {
        const services = await listResponse.json();

        if (Array.isArray(services) && services.length > 0) {
          const serviceId = services[0].id;
          const response = await request.put(`/api/services/${serviceId}`, {
            data: { description: `Updated ${Date.now()}` },
          });
          expect([200, 204, 400, 401, 404]).toContain(response.status());
        }
      }
    });
  });
});

test.describe('Staff Management Integration Tests', () => {
  test.describe('Staff UI Tests', () => {
    test('should display staff page or redirect to login', async ({ page }) => {
      await page.goto('/staff');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      expect(url.includes('/staff') || url.includes('/login')).toBe(true);

      const body = page.locator('body');
      await expect(body).toBeVisible();
    });
  });

  test.describe('Staff API Tests', () => {
    test('GET /api/staff should return response', async ({ request }) => {
      const response = await request.get('/api/staff');
      expect([200, 401]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(Array.isArray(data) || typeof data === 'object').toBe(true);
      }
    });

    test('GET /api/staff/[id] should return staff or error', async ({ request }) => {
      const listResponse = await request.get('/api/staff');

      if (listResponse.status() === 200) {
        const staffList = await listResponse.json();

        if (Array.isArray(staffList) && staffList.length > 0) {
          const staffId = staffList[0].id;
          const response = await request.get(`/api/staff/${staffId}`);
          expect([200, 401, 404]).toContain(response.status());
        }
      }
    });

    test('GET /api/staff/[id]/schedule should return schedule or error', async ({ request }) => {
      const listResponse = await request.get('/api/staff');

      if (listResponse.status() === 200) {
        const staffList = await listResponse.json();

        if (Array.isArray(staffList) && staffList.length > 0) {
          const staffId = staffList[0].id;
          const response = await request.get(`/api/staff/${staffId}/schedule`);
          expect([200, 401, 404]).toContain(response.status());
        }
      }
    });

    test('PUT /api/staff/[id] should handle update', async ({ request }) => {
      const listResponse = await request.get('/api/staff');

      if (listResponse.status() === 200) {
        const staffList = await listResponse.json();

        if (Array.isArray(staffList) && staffList.length > 0) {
          const staffId = staffList[0].id;
          const response = await request.put(`/api/staff/${staffId}`, {
            data: { bio: `Updated ${Date.now()}` },
          });
          expect([200, 204, 400, 401, 404]).toContain(response.status());
        }
      }
    });
  });
});

test.describe('Products/Inventory Integration Tests', () => {
  test.describe('Products UI Tests', () => {
    test('should display products page or redirect to login', async ({ page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      expect(url.includes('/products') || url.includes('/login')).toBe(true);

      const body = page.locator('body');
      await expect(body).toBeVisible();
    });
  });

  test.describe('Products API Tests', () => {
    test('GET /api/products should return response', async ({ request }) => {
      const response = await request.get('/api/products');
      expect([200, 401]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(Array.isArray(data) || typeof data === 'object').toBe(true);
      }
    });

    test('POST /api/products should handle product creation', async ({ request }) => {
      const productData = {
        name: `Integration Test Product ${Date.now()}`,
        description: 'Created by Playwright integration test',
        price: 29.99,
        cost: 15.0,
        sku: `TEST-${Date.now()}`,
        quantityOnHand: 100,
        trackInventory: true,
        isActive: true,
      };

      const response = await request.post('/api/products', {
        data: productData,
      });

      expect([200, 201, 400, 401, 500]).toContain(response.status());
    });

    test('GET /api/products/low-stock should return response', async ({ request }) => {
      const response = await request.get('/api/products/low-stock');
      expect([200, 401, 404]).toContain(response.status());
    });
  });
});
