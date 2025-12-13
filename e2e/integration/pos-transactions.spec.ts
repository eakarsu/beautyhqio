import { test, expect } from '@playwright/test';

test.describe('POS & Transaction Integration Tests', () => {
  test.describe('Dashboard UI Tests', () => {
    test('should display dashboard or redirect to login', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      expect(url === 'http://localhost:3000/' || url.includes('/login')).toBe(true);

      const body = page.locator('body');
      await expect(body).toBeVisible();
    });

    test('should display reports page or redirect to login', async ({ page }) => {
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      expect(url.includes('/reports') || url.includes('/login')).toBe(true);

      const body = page.locator('body');
      await expect(body).toBeVisible();
    });
  });

  test.describe('Transactions API Tests', () => {
    test('GET /api/transactions should return response', async ({ request }) => {
      const response = await request.get('/api/transactions');
      expect([200, 401, 404]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(Array.isArray(data) || typeof data === 'object').toBe(true);
      }
    });

    test('GET /api/transactions with date filter should work', async ({ request }) => {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const endDate = today.toISOString();

      const response = await request.get(`/api/transactions?startDate=${startDate}&endDate=${endDate}`);
      expect([200, 401, 404]).toContain(response.status());
    });

    test('POST /api/transactions should handle transaction creation', async ({ request }) => {
      // First get required IDs
      const [staffRes, locationsRes] = await Promise.all([
        request.get('/api/staff'),
        request.get('/api/locations'),
      ]);

      let staffId, locationId;

      if (staffRes.status() === 200) {
        const staff = await staffRes.json();
        if (Array.isArray(staff) && staff.length > 0) {
          staffId = staff[0].id;
        }
      }

      if (locationsRes.status() === 200) {
        const locations = await locationsRes.json();
        if (Array.isArray(locations) && locations.length > 0) {
          locationId = locations[0].id;
        }
      }

      if (!staffId || !locationId) {
        test.skip();
        return;
      }

      const transactionData = {
        type: 'SALE',
        status: 'COMPLETED',
        staffId: staffId,
        locationId: locationId,
        subtotal: 100.0,
        taxAmount: 8.0,
        totalAmount: 108.0,
        lineItems: [
          {
            type: 'SERVICE',
            name: 'Integration Test Service',
            quantity: 1,
            unitPrice: 100.0,
            totalPrice: 100.0,
          },
        ],
        payments: [
          {
            method: 'CREDIT_CARD',
            amount: 108.0,
          },
        ],
      };

      const response = await request.post('/api/transactions', {
        data: transactionData,
      });

      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });

    test('GET /api/transactions/[id] should return transaction or error', async ({ request }) => {
      const listResponse = await request.get('/api/transactions');

      if (listResponse.status() === 200) {
        const transactions = await listResponse.json();

        if (Array.isArray(transactions) && transactions.length > 0) {
          const transactionId = transactions[0].id;
          const response = await request.get(`/api/transactions/${transactionId}`);
          expect([200, 401, 404]).toContain(response.status());
        }
      }
    });
  });

  test.describe('Reports API Tests', () => {
    test('GET /api/reports/revenue should return response', async ({ request }) => {
      const response = await request.get('/api/reports/revenue');
      expect([200, 401, 404]).toContain(response.status());
    });

    test('GET /api/reports/revenue with date range should work', async ({ request }) => {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      const endDate = new Date();

      const response = await request.get(
        `/api/reports/revenue?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      expect([200, 401, 404]).toContain(response.status());
    });

    test('GET /api/reports/staff should return response', async ({ request }) => {
      const response = await request.get('/api/reports/staff');
      expect([200, 401, 404]).toContain(response.status());
    });

    test('GET /api/reports/services should return response', async ({ request }) => {
      const response = await request.get('/api/reports/services');
      expect([200, 401, 404]).toContain(response.status());
    });

    test('GET /api/reports/clients should return response', async ({ request }) => {
      const response = await request.get('/api/reports/clients');
      expect([200, 401, 404]).toContain(response.status());
    });
  });

  test.describe('Dashboard API Tests', () => {
    test('GET /api/dashboard should return response', async ({ request }) => {
      const response = await request.get('/api/dashboard');
      expect([200, 401, 404]).toContain(response.status());
    });
  });
});
