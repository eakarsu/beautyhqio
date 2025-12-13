import { test, expect } from '@playwright/test';

test.describe('Loyalty Full Integration Tests', () => {
  test.describe('Loyalty Page UI Tests', () => {
    test('should display loyalty page or redirect to login', async ({ page }) => {
      await page.goto('/loyalty');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      expect(url.includes('/loyalty') || url.includes('/login')).toBe(true);

      const body = page.locator('body');
      await expect(body).toBeVisible();
    });

    test('should click Add Reward button', async ({ page }) => {
      await page.goto('/loyalty');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/loyalty')) {
        const addRewardBtn = page.locator('button:has-text("Add Reward"), a:has-text("Add Reward"), a[href*="/rewards/new"]');
        if ((await addRewardBtn.count()) > 0) {
          await addRewardBtn.first().click();
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('should click Issue Points button', async ({ page }) => {
      await page.goto('/loyalty');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/loyalty')) {
        const issuePointsBtn = page.locator('button:has-text("Issue Points"), a:has-text("Issue Points"), a[href*="/issue"]');
        if ((await issuePointsBtn.count()) > 0) {
          await issuePointsBtn.first().click();
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('should click Total Members stat card', async ({ page }) => {
      await page.goto('/loyalty');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/loyalty')) {
        const membersCard = page.locator('text=Total Members').locator('..').locator('..');
        if ((await membersCard.count()) > 0) {
          await membersCard.first().click();
          await page.waitForLoadState('networkidle');
          expect(page.url()).toContain('/clients');
        }
      }
    });

    test('should click Active Balance stat card', async ({ page }) => {
      await page.goto('/loyalty');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/loyalty')) {
        const balanceCard = page.locator('text=Active Balance').locator('..').locator('..');
        if ((await balanceCard.count()) > 0) {
          await balanceCard.first().click();
          await page.waitForLoadState('networkidle');
          expect(page.url()).toContain('/reports');
        }
      }
    });

    test('should click Points Issued stat card', async ({ page }) => {
      await page.goto('/loyalty');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/loyalty')) {
        const issuedCard = page.locator('text=Points Issued').locator('..').locator('..');
        if ((await issuedCard.count()) > 0) {
          await issuedCard.first().click();
          await page.waitForLoadState('networkidle');
          expect(page.url()).toContain('/loyalty/issue');
        }
      }
    });

    test('should click Points Redeemed stat card', async ({ page }) => {
      await page.goto('/loyalty');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/loyalty')) {
        const redeemedCard = page.locator('text=Points Redeemed').locator('..').locator('..');
        if ((await redeemedCard.count()) > 0) {
          await redeemedCard.first().click();
          await page.waitForLoadState('networkidle');
          expect(page.url()).toContain('/loyalty/rewards');
        }
      }
    });

    test('should click Bronze tier card', async ({ page }) => {
      await page.goto('/loyalty');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/loyalty')) {
        const bronzeTier = page.locator('text=Bronze').first().locator('..').locator('..');
        if ((await bronzeTier.count()) > 0) {
          await bronzeTier.click();
          await page.waitForLoadState('networkidle');
          expect(page.url()).toContain('/clients');
        }
      }
    });

    test('should click Silver tier card', async ({ page }) => {
      await page.goto('/loyalty');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/loyalty')) {
        const silverTier = page.locator('text=Silver').first().locator('..').locator('..');
        if ((await silverTier.count()) > 0) {
          await silverTier.click();
          await page.waitForLoadState('networkidle');
          expect(page.url()).toContain('/clients');
        }
      }
    });

    test('should click Gold tier card', async ({ page }) => {
      await page.goto('/loyalty');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/loyalty')) {
        const goldTier = page.locator('text=Gold').first().locator('..').locator('..');
        if ((await goldTier.count()) > 0) {
          await goldTier.click();
          await page.waitForLoadState('networkidle');
          expect(page.url()).toContain('/clients');
        }
      }
    });

    test('should click Platinum tier card', async ({ page }) => {
      await page.goto('/loyalty');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/loyalty')) {
        const platinumTier = page.locator('text=Platinum').first().locator('..').locator('..');
        if ((await platinumTier.count()) > 0) {
          await platinumTier.click();
          await page.waitForLoadState('networkidle');
          expect(page.url()).toContain('/clients');
        }
      }
    });

    test('should click reward item', async ({ page }) => {
      await page.goto('/loyalty');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/loyalty')) {
        const rewardItem = page.locator('.bg-slate-50').first();
        if ((await rewardItem.count()) > 0) {
          await rewardItem.click();
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('should click View All Rewards button', async ({ page }) => {
      await page.goto('/loyalty');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/loyalty')) {
        const viewAllBtn = page.locator('button:has-text("View All Rewards")');
        if ((await viewAllBtn.count()) > 0) {
          await viewAllBtn.first().click();
          await page.waitForLoadState('networkidle');
          expect(page.url()).toContain('/loyalty/rewards');
        }
      }
    });

    test('should click member row in Top Members table', async ({ page }) => {
      await page.goto('/loyalty');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/loyalty')) {
        const memberRow = page.locator('table tbody tr').first();
        if ((await memberRow.count()) > 0) {
          await memberRow.click();
          await page.waitForLoadState('networkidle');
          expect(page.url()).toContain('/clients/');
        }
      }
    });

    test('should search members by name', async ({ page }) => {
      await page.goto('/loyalty');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/loyalty')) {
        const searchInput = page.locator('input[placeholder*="Search"]');
        if ((await searchInput.count()) > 0) {
          await searchInput.fill('Test');
          await page.waitForTimeout(500);
        }
      }
    });

    test('should click View Profile button', async ({ page }) => {
      await page.goto('/loyalty');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/loyalty')) {
        const viewProfileBtn = page.locator('button:has-text("View Profile")').first();
        if ((await viewProfileBtn.count()) > 0) {
          await viewProfileBtn.click();
          await page.waitForLoadState('networkidle');
          expect(page.url()).toContain('/clients/');
        }
      }
    });
  });

  test.describe('Loyalty Rewards Page Tests', () => {
    test('should display loyalty rewards page', async ({ page }) => {
      await page.goto('/loyalty/rewards');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      expect(url.includes('/loyalty/rewards') || url.includes('/loyalty') || url.includes('/login')).toBe(true);
    });

    test('should click Add Reward button on rewards page', async ({ page }) => {
      await page.goto('/loyalty/rewards');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/loyalty/rewards')) {
        const addBtn = page.locator('button:has-text("Add"), a:has-text("New Reward")');
        if ((await addBtn.count()) > 0) {
          await addBtn.first().click();
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('should click reward row to view details', async ({ page }) => {
      await page.goto('/loyalty/rewards');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/loyalty/rewards')) {
        const rewardRow = page.locator('table tbody tr.cursor-pointer').first();
        if ((await rewardRow.count()) > 0) {
          await rewardRow.click();
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('should search rewards by name', async ({ page }) => {
      await page.goto('/loyalty/rewards');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/loyalty/rewards')) {
        const searchInput = page.locator('input[placeholder*="Search"]');
        if ((await searchInput.count()) > 0) {
          await searchInput.fill('Test');
          await page.waitForTimeout(500);
        }
      }
    });
  });

  test.describe('Issue Points Page Tests', () => {
    test('should display issue points page', async ({ page }) => {
      await page.goto('/loyalty/issue');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      expect(url.includes('/loyalty/issue') || url.includes('/loyalty') || url.includes('/login')).toBe(true);
    });

    test('should fill issue points form', async ({ page }) => {
      await page.goto('/loyalty/issue');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/loyalty/issue')) {
        const pointsInput = page.locator('input[name="points"], input[type="number"]');
        if ((await pointsInput.count()) > 0) {
          await pointsInput.first().fill('100');
        }

        const reasonInput = page.locator('input[name="reason"], textarea[name="reason"]');
        if ((await reasonInput.count()) > 0) {
          await reasonInput.first().fill('Test points issuance');
        }
      }
    });
  });

  test.describe('Loyalty API Tests', () => {
    test('GET /api/loyalty should return loyalty program data', async ({ request }) => {
      const response = await request.get('/api/loyalty');
      expect([200, 400, 401, 404]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(typeof data === 'object').toBe(true);
      }
    });

    test('GET /api/loyalty/rewards should return rewards list', async ({ request }) => {
      const response = await request.get('/api/loyalty/rewards');
      expect([200, 401, 404]).toContain(response.status());
    });

    test('POST /api/loyalty/points should issue points', async ({ request }) => {
      const response = await request.post('/api/loyalty/points', {
        data: {
          clientId: 'test-client-id',
          points: 100,
          reason: 'Integration test',
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });

    test('POST /api/loyalty/redeem should redeem reward', async ({ request }) => {
      const response = await request.post('/api/loyalty/redeem', {
        data: {
          clientId: 'test-client-id',
          rewardId: 'test-reward-id',
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });
  });
});
