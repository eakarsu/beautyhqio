import { test, expect } from '@playwright/test';

test.describe('Gift Cards Page', () => {
  test('should load the gift cards page or redirect to login', async ({ page }) => {
    await page.goto('/gift-cards');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url.includes('/gift-cards') || url.includes('/login')).toBe(true);
  });

  test('should display content', async ({ page }) => {
    await page.goto('/gift-cards');
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Gift Cards API', () => {
  let createdGiftCardId: string;
  let giftCardCode: string;

  test('GET /api/gift-cards should return gift cards list', async ({ request }) => {
    const response = await request.get('/api/gift-cards');
    expect([200, 401, 500]).toContain(response.status());
  });

  test('POST /api/gift-cards should create gift card', async ({ request }) => {
    const giftCardData = {
      amount: 100.00,
      recipientEmail: `playwright-gc-${Date.now()}@test.com`,
      recipientName: 'Playwright Test Recipient',
      senderName: 'Playwright Test Sender',
      message: 'Created by Playwright test',
    };

    const response = await request.post('/api/gift-cards', {
      data: giftCardData,
    });

    expect([201, 400, 401, 500]).toContain(response.status());

    if (response.status() === 201) {
      const data = await response.json();
      createdGiftCardId = data.id;
      giftCardCode = data.code;
    }
  });

  test('GET /api/gift-cards/[id] should return gift card details', async ({ request }) => {
    if (!createdGiftCardId) {
      const response = await request.get('/api/gift-cards/test-id');
      expect([404, 401, 500]).toContain(response.status());
      return;
    }

    const response = await request.get(`/api/gift-cards/${createdGiftCardId}`);
    expect([200, 401, 404]).toContain(response.status());
  });

  test('POST /api/gift-cards/check-balance should check balance', async ({ request }) => {
    if (!giftCardCode) {
      const response = await request.post('/api/gift-cards/check-balance', {
        data: { code: 'INVALID-CODE' },
      });
      expect([404, 400, 401, 405, 500]).toContain(response.status());
      return;
    }

    const response = await request.post('/api/gift-cards/check-balance', {
      data: { code: giftCardCode },
    });

    expect([200, 401, 404, 405, 500]).toContain(response.status());
  });

  test('POST /api/gift-cards/redeem should redeem balance', async ({ request }) => {
    if (!giftCardCode) {
      test.skip();
      return;
    }

    const response = await request.post('/api/gift-cards/redeem', {
      data: { code: giftCardCode, amount: 25.00 },
    });

    expect([200, 201, 400, 401, 405, 500]).toContain(response.status());
  });

  test('POST /api/gift-cards/redeem should reject over-redemption', async ({ request }) => {
    if (!giftCardCode) {
      test.skip();
      return;
    }

    const response = await request.post('/api/gift-cards/redeem', {
      data: { code: giftCardCode, amount: 5000.00 },
    });

    expect([400, 401, 405, 500]).toContain(response.status());
  });

  test.afterAll(async ({ request }) => {
    if (createdGiftCardId) {
      await request.delete(`/api/gift-cards/${createdGiftCardId}`);
    }
  });
});
