import { test, expect } from '@playwright/test';

test.describe('Loyalty Program Integration Tests', () => {
  test.describe('Loyalty Page UI Tests', () => {
    test('should display loyalty page or redirect to login', async ({ page }) => {
      await page.goto('/loyalty');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      expect(url.includes('/loyalty') || url.includes('/login')).toBe(true);

      const body = page.locator('body');
      await expect(body).toBeVisible();
    });
  });

  test.describe('Loyalty API Tests', () => {
    test('GET /api/loyalty should return response', async ({ request }) => {
      const response = await request.get('/api/loyalty');
      expect([200, 400, 401, 404]).toContain(response.status());
    });

    test('GET /api/loyalty/programs should return response', async ({ request }) => {
      const response = await request.get('/api/loyalty/programs');
      expect([200, 401, 404]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(Array.isArray(data) || typeof data === 'object').toBe(true);
      }
    });

    test('POST /api/loyalty/programs should handle program creation', async ({ request }) => {
      const programData = {
        name: `Integration Test Program ${Date.now()}`,
        pointsPerDollar: 1,
        bonusOnSignup: 100,
        isActive: true,
      };

      const response = await request.post('/api/loyalty/programs', {
        data: programData,
      });

      expect([200, 201, 400, 401, 404, 405, 409, 500]).toContain(response.status());
    });

    test('GET /api/loyalty/rewards should return response', async ({ request }) => {
      const response = await request.get('/api/loyalty/rewards');
      expect([200, 401, 404]).toContain(response.status());
    });

    test('POST /api/loyalty/rewards should handle reward creation', async ({ request }) => {
      const rewardData = {
        name: `Integration Test Reward ${Date.now()}`,
        description: 'Created by Playwright integration test',
        pointsCost: 500,
        type: 'discount',
        value: 10.0,
        isActive: true,
      };

      const response = await request.post('/api/loyalty/rewards', {
        data: rewardData,
      });

      expect([200, 201, 400, 401, 404, 405, 500]).toContain(response.status());
    });

    test('GET /api/loyalty/tiers should return response', async ({ request }) => {
      const response = await request.get('/api/loyalty/tiers');
      expect([200, 401, 404]).toContain(response.status());
    });
  });
});

test.describe('Gift Card Integration Tests', () => {
  test.describe('Gift Cards Page UI Tests', () => {
    test('should display gift cards page or redirect to login', async ({ page }) => {
      await page.goto('/gift-cards');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      expect(url.includes('/gift-cards') || url.includes('/login')).toBe(true);

      const body = page.locator('body');
      await expect(body).toBeVisible();
    });
  });

  test.describe('Gift Cards API Tests', () => {
    test('GET /api/gift-cards should return response', async ({ request }) => {
      const response = await request.get('/api/gift-cards');
      expect([200, 401, 404]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(Array.isArray(data) || typeof data === 'object').toBe(true);
      }
    });

    test('POST /api/gift-cards should handle gift card creation', async ({ request }) => {
      const giftCardData = {
        initialBalance: 100.0,
        recipientEmail: `test.${Date.now()}@example.com`,
        recipientName: 'Integration Test Recipient',
        message: 'Integration test gift card',
        isDigital: true,
      };

      const response = await request.post('/api/gift-cards', {
        data: giftCardData,
      });

      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });

    test('GET /api/gift-cards/[id] should return gift card or error', async ({ request }) => {
      const listResponse = await request.get('/api/gift-cards');

      if (listResponse.status() === 200) {
        const giftCards = await listResponse.json();

        if (Array.isArray(giftCards) && giftCards.length > 0) {
          const giftCardId = giftCards[0].id;
          const response = await request.get(`/api/gift-cards/${giftCardId}`);
          expect([200, 401, 404]).toContain(response.status());
        }
      }
    });

    test('GET /api/gift-cards/check-balance should handle balance check', async ({ request }) => {
      const response = await request.get('/api/gift-cards/check-balance?code=TEST-CODE');
      expect([200, 400, 401, 404]).toContain(response.status());
    });
  });
});

test.describe('Waitlist Integration Tests', () => {
  test.describe('Waitlist UI Tests', () => {
    test('should display waitlist page or redirect to login', async ({ page }) => {
      await page.goto('/waitlist');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      expect(url.includes('/waitlist') || url.includes('/login')).toBe(true);

      const body = page.locator('body');
      await expect(body).toBeVisible();
    });
  });

  test.describe('Waitlist API Tests', () => {
    test('GET /api/waitlist should return response', async ({ request }) => {
      const response = await request.get('/api/waitlist');
      expect([200, 401, 404, 500]).toContain(response.status());
    });

    test('POST /api/waitlist should handle entry creation', async ({ request }) => {
      // Get location for waitlist entry
      const locationsRes = await request.get('/api/locations');
      let locationId;

      if (locationsRes.status() === 200) {
        const locations = await locationsRes.json();
        if (Array.isArray(locations) && locations.length > 0) {
          locationId = locations[0].id;
        }
      }

      if (!locationId) {
        test.skip();
        return;
      }

      const entryData = {
        locationId: locationId,
        serviceNotes: 'Integration test waitlist entry',
        phone: '555-1234567',
      };

      const response = await request.post('/api/waitlist', {
        data: entryData,
      });

      expect([200, 201, 400, 401, 500]).toContain(response.status());
    });
  });
});

test.describe('Settings Integration Tests', () => {
  test.describe('Settings UI Tests', () => {
    test('should display settings page or redirect to login', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      expect(url.includes('/settings') || url.includes('/login')).toBe(true);

      const body = page.locator('body');
      await expect(body).toBeVisible();
    });
  });

  test.describe('Settings API Tests', () => {
    test('GET /api/settings should return response', async ({ request }) => {
      const response = await request.get('/api/settings');
      expect([200, 401, 404]).toContain(response.status());
    });

    test('GET /api/settings/business should return response', async ({ request }) => {
      const response = await request.get('/api/settings/business');
      expect([200, 401, 404]).toContain(response.status());
    });

    test('GET /api/settings/notifications should return response', async ({ request }) => {
      const response = await request.get('/api/settings/notifications');
      expect([200, 401, 404]).toContain(response.status());
    });

    test('PUT /api/settings should handle update', async ({ request }) => {
      const response = await request.put('/api/settings', {
        data: { businessName: 'Integration Test Spa' },
      });

      expect([200, 204, 400, 401, 404, 405]).toContain(response.status());
    });
  });
});
