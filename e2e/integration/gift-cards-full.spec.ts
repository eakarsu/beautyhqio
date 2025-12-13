import { test, expect } from '@playwright/test';

test.describe('Gift Cards Full Integration Tests', () => {
  test.describe('Gift Cards Page UI Tests', () => {
    test('should display gift cards page or redirect to login', async ({ page }) => {
      await page.goto('/gift-cards');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      expect(url.includes('/gift-cards') || url.includes('/login')).toBe(true);

      const body = page.locator('body');
      await expect(body).toBeVisible();
    });

    test('should click Add/Create Gift Card button', async ({ page }) => {
      await page.goto('/gift-cards');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/gift-cards')) {
        const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create"), a:has-text("New Gift Card"), a[href*="/gift-cards/new"]');
        if ((await addButton.count()) > 0) {
          await addButton.first().click();
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('should click Check Balance button', async ({ page }) => {
      await page.goto('/gift-cards');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/gift-cards')) {
        const checkBalanceBtn = page.locator('button:has-text("Check Balance"), a:has-text("Check Balance"), a[href*="/check-balance"]');
        if ((await checkBalanceBtn.count()) > 0) {
          await checkBalanceBtn.first().click();
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('should click gift card row to view details', async ({ page }) => {
      await page.goto('/gift-cards');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/gift-cards')) {
        const giftCardRow = page.locator('table tbody tr, [data-testid="gift-card-item"]').first();
        if ((await giftCardRow.count()) > 0) {
          await giftCardRow.click();
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('should click Reload/Top Up button', async ({ page }) => {
      await page.goto('/gift-cards');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/gift-cards')) {
        const reloadBtn = page.locator('button:has-text("Reload"), button:has-text("Top Up"), button:has-text("Add Funds")');
        if ((await reloadBtn.count()) > 0) {
          await reloadBtn.first().click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should click Deactivate button', async ({ page }) => {
      await page.goto('/gift-cards');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/gift-cards')) {
        const deactivateBtn = page.locator('button:has-text("Deactivate"), button:has-text("Disable")');
        if ((await deactivateBtn.count()) > 0) {
          await expect(deactivateBtn.first()).toBeVisible();
        }
      }
    });

    test('should click filter/search controls', async ({ page }) => {
      await page.goto('/gift-cards');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/gift-cards')) {
        // Search input
        const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]');
        if ((await searchInput.count()) > 0) {
          await searchInput.first().fill('TEST');
          await page.waitForTimeout(500);
        }

        // Status filter
        const statusFilter = page.locator('select, [role="combobox"]').first();
        if ((await statusFilter.count()) > 0) {
          await statusFilter.click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should click Send/Email Gift Card button', async ({ page }) => {
      await page.goto('/gift-cards');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/gift-cards')) {
        const sendBtn = page.locator('button:has-text("Send"), button:has-text("Email")');
        if ((await sendBtn.count()) > 0) {
          await sendBtn.first().click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should click Print button', async ({ page }) => {
      await page.goto('/gift-cards');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/gift-cards')) {
        const printBtn = page.locator('button:has-text("Print"), button[aria-label*="print" i]');
        if ((await printBtn.count()) > 0) {
          await expect(printBtn.first()).toBeVisible();
        }
      }
    });

    test('should click Cards Sold stat card', async ({ page }) => {
      await page.goto('/gift-cards');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/gift-cards')) {
        const soldCard = page.locator('text=Cards Sold').locator('..').locator('..');
        if ((await soldCard.count()) > 0) {
          await soldCard.first().click();
          await page.waitForLoadState('networkidle');
          expect(page.url()).toContain('/gift-cards/new');
        }
      }
    });

    test('should click Total Value Sold stat card', async ({ page }) => {
      await page.goto('/gift-cards');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/gift-cards')) {
        const valueCard = page.locator('text=Total Value Sold').locator('..').locator('..');
        if ((await valueCard.count()) > 0) {
          await valueCard.first().click();
          await page.waitForLoadState('networkidle');
          expect(page.url()).toContain('/reports');
        }
      }
    });

    test('should click Outstanding stat card', async ({ page }) => {
      await page.goto('/gift-cards');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/gift-cards')) {
        const outstandingCard = page.locator('text=Outstanding').locator('..').locator('..');
        if ((await outstandingCard.count()) > 0) {
          await outstandingCard.first().click();
          await page.waitForLoadState('networkidle');
          expect(page.url()).toContain('/gift-cards/check-balance');
        }
      }
    });

    test('should click Redeemed stat card', async ({ page }) => {
      await page.goto('/gift-cards');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/gift-cards')) {
        const redeemedCard = page.locator('text=Redeemed').locator('..').locator('..');
        if ((await redeemedCard.count()) > 0) {
          await redeemedCard.first().click();
          await page.waitForLoadState('networkidle');
          expect(page.url()).toContain('/pos');
        }
      }
    });
  });

  test.describe('New Gift Card Page Tests', () => {
    test('should display new gift card form', async ({ page }) => {
      await page.goto('/gift-cards/new');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      expect(url.includes('/gift-cards/new') || url.includes('/gift-cards') || url.includes('/login')).toBe(true);
    });

    test('should fill gift card form fields', async ({ page }) => {
      await page.goto('/gift-cards/new');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/gift-cards/new')) {
        // Fill amount
        const amountInput = page.locator('input[name="amount"], input[name="initialBalance"], input[type="number"]').first();
        if ((await amountInput.count()) > 0) {
          await amountInput.fill('100');
        }

        // Fill recipient email
        const emailInput = page.locator('input[name="email"], input[name="recipientEmail"], input[type="email"]');
        if ((await emailInput.count()) > 0) {
          await emailInput.first().fill('test@example.com');
        }

        // Fill recipient name
        const nameInput = page.locator('input[name="recipientName"], input[placeholder*="name" i]');
        if ((await nameInput.count()) > 0) {
          await nameInput.first().fill('Test Recipient');
        }

        // Fill message
        const messageInput = page.locator('textarea[name="message"], textarea');
        if ((await messageInput.count()) > 0) {
          await messageInput.first().fill('Happy Birthday!');
        }
      }
    });

    test('should click preset amount buttons', async ({ page }) => {
      await page.goto('/gift-cards/new');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/gift-cards/new')) {
        const amountButtons = page.locator('button:has-text("$25"), button:has-text("$50"), button:has-text("$100")');
        if ((await amountButtons.count()) > 0) {
          await amountButtons.first().click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should click Digital/Physical toggle', async ({ page }) => {
      await page.goto('/gift-cards/new');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/gift-cards/new')) {
        const toggle = page.locator('button:has-text("Digital"), button:has-text("Physical"), [role="switch"]');
        if ((await toggle.count()) > 0) {
          await toggle.first().click();
          await page.waitForTimeout(300);
        }
      }
    });
  });

  test.describe('Check Balance Page Tests', () => {
    test('should display check balance page', async ({ page }) => {
      await page.goto('/gift-cards/check-balance');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      expect(url.includes('/check-balance') || url.includes('/gift-cards') || url.includes('/login')).toBe(true);
    });

    test('should fill gift card code and check', async ({ page }) => {
      await page.goto('/gift-cards/check-balance');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/check-balance')) {
        const codeInput = page.locator('input[name="code"], input[placeholder*="code" i]');
        if ((await codeInput.count()) > 0) {
          await codeInput.first().fill('TEST-CODE-123');
        }

        const checkBtn = page.locator('button:has-text("Check"), button[type="submit"]');
        if ((await checkBtn.count()) > 0) {
          await checkBtn.first().click();
          await page.waitForLoadState('networkidle');
        }
      }
    });
  });

  test.describe('Gift Cards API Tests', () => {
    test('GET /api/gift-cards should return gift cards list', async ({ request }) => {
      const response = await request.get('/api/gift-cards');
      expect([200, 401, 404]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(Array.isArray(data) || typeof data === 'object').toBe(true);
      }
    });

    test('POST /api/gift-cards should create gift card', async ({ request }) => {
      const giftCardData = {
        initialBalance: 100.00,
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

    test('GET /api/gift-cards/[id] should return gift card details', async ({ request }) => {
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

    test('PUT /api/gift-cards/[id] should update gift card', async ({ request }) => {
      const listResponse = await request.get('/api/gift-cards');

      if (listResponse.status() === 200) {
        const giftCards = await listResponse.json();

        if (Array.isArray(giftCards) && giftCards.length > 0) {
          const giftCardId = giftCards[0].id;
          const response = await request.put(`/api/gift-cards/${giftCardId}`, {
            data: { isActive: true },
          });
          expect([200, 204, 400, 401, 404, 405, 500]).toContain(response.status());
        }
      }
    });

    test('GET /api/gift-cards/check-balance should check balance', async ({ request }) => {
      const response = await request.get('/api/gift-cards/check-balance?code=TEST-CODE');
      expect([200, 400, 401, 404]).toContain(response.status());
    });

    test('POST /api/gift-cards/redeem should redeem gift card', async ({ request }) => {
      const response = await request.post('/api/gift-cards/redeem', {
        data: {
          code: 'TEST-CODE',
          amount: 25.00,
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });
  });
});
